import { NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getCurrentUserId } from "@/lib/current-user";
import { topologicalBatches } from "@/server/execution/dag";
import type { Workflow, WorkflowEdge, WorkflowNode } from "@/types/workflow";
import type { cropImageTask } from "@/trigger/crop-image";
import type { geminiTask } from "@/trigger/gemini";

const executeSchema = z.object({
  workflow: z.any(),
  scope: z.enum(["full", "partial", "single"]),
  nodeIds: z.array(z.string()).optional()
});

const MAX_STORED_OUTPUT = 500;

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = executeSchema.parse(await request.json());
  const workflow = payload.workflow as Workflow;
  const existing = await prisma.workflow.findFirst({
    where: { id: workflow.id, userId },
    select: { id: true }
  });
  if (!existing) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });

  const run = await prisma.workflowRun.create({
    data: {
      workflowId: workflow.id,
      userId,
      scope: payload.scope,
      state: "running",
      inputs: payload.nodeIds ? { nodeIds: payload.nodeIds } : undefined,
      durationMs: 0
    }
  });

  const startedAt = Date.now();
  const nodeRuns: Array<{
    nodeId: string;
    nodeTitle: string;
    state: "success" | "failed";
    durationMs: number;
    output?: string;
    error?: string;
  }> = [];
  const nodeOutputs = new Map<string, string>();
  const failedNodeIds = new Set<string>();
  let hasFailure = false;

  try {
    const batches = topologicalBatches(workflow, payload.nodeIds);

    for (const batch of batches) {
      const results = await Promise.all(
        batch.map(async (node) => {
          const started = Date.now();
          try {
            const failedParent = workflow.edges.some(
              (edge) => edge.target === node.id && failedNodeIds.has(edge.source)
            );
            if (failedParent) throw new Error("Upstream dependency failed");

            const output = await executeNode(node, workflow.edges, nodeOutputs, workflow.nodes);
            nodeOutputs.set(node.id, output);
            return {
              nodeId: node.id,
              nodeTitle: node.data.title,
              state: "success" as const,
              durationMs: Date.now() - started,
              output: truncateOutput(output)
            };
          } catch (error) {
            failedNodeIds.add(node.id);
            hasFailure = true;
            return {
              nodeId: node.id,
              nodeTitle: node.data.title,
              state: "failed" as const,
              durationMs: Date.now() - started,
              error: error instanceof Error ? error.message : "Execution failed"
            };
          }
        })
      );
      nodeRuns.push(...results);
    }

    const durationMs = Date.now() - startedAt;
    const state = hasFailure ? "failed" : "success";

    await prisma.workflowRun.update({
      where: { id: run.id },
      data: {
        state,
        durationMs,
        nodeRuns: {
          createMany: {
            data: nodeRuns.map((nodeRun) => ({
              nodeId: nodeRun.nodeId,
              nodeTitle: nodeRun.nodeTitle,
              state: nodeRun.state,
              durationMs: nodeRun.durationMs,
              output: nodeRun.output ?? undefined,
              error: nodeRun.error ?? null
            }))
          }
        }
      }
    });

    return NextResponse.json({
      run: {
        id: run.id,
        workflowId: workflow.id,
        scope: payload.scope,
        state,
        startedAt: run.startedAt.toISOString(),
        durationMs,
        nodeRuns
      }
    });
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    await prisma.workflowRun.update({
      where: { id: run.id },
      data: { state: "failed", durationMs }
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Workflow execution failed" },
      { status: 500 }
    );
  }
}

async function executeNode(
  node: WorkflowNode,
  edges: WorkflowEdge[],
  nodeOutputs: Map<string, string>,
  allNodes: WorkflowNode[]
) {
  if (node.data.kind === "request_inputs") {
    return node.data.fields?.map((field) => field.imageUrl || field.value).filter(Boolean).join(", ") || "Inputs resolved";
  }

  if (node.data.kind === "crop_image") {
    const imageUrl = resolveInputValues(node, "input_image", edges, nodeOutputs, allNodes)[0] ?? findRequestImageFallback(node, edges, allNodes);
    const x = Number(node.data.inputs?.find((input) => input.id === "x")?.value ?? 0);
    const y = Number(node.data.inputs?.find((input) => input.id === "y")?.value ?? 0);
    const width = Number(node.data.inputs?.find((input) => input.id === "width")?.value ?? 100);
    const height = Number(node.data.inputs?.find((input) => input.id === "height")?.value ?? 100);
    if (!imageUrl) throw new Error("Crop Image requires an input image");

    return executeCropTask({ inputUrl: imageUrl, x, y, width, height });
  }

  if (node.data.kind === "gemini") {
    const prompt = resolveInputValues(node, "prompt", edges, nodeOutputs, allNodes).join("\n") || node.data.prompt || "";
    const systemPrompt =
      node.data.systemPrompt || resolveInputValues(node, "system_prompt", edges, nodeOutputs, allNodes).join("\n");
    const imageUrls = resolveInputValues(node, "image", edges, nodeOutputs, allNodes);
    if (!prompt && imageUrls.length === 0) throw new Error("Gemini node requires a prompt or image input");

    return executeGeminiTask({
      prompt: prompt || "Describe this image",
      systemPrompt: systemPrompt || undefined,
      model: node.data.model ?? "gemini-1.5-flash",
      imageUrls
    });
  }

  if (node.data.kind === "response") {
    return resolveInputValues(node, "result", edges, nodeOutputs, allNodes).join("\n") || "Final result captured";
  }

  return "Completed";
}

function resolveInputValues(
  node: WorkflowNode,
  inputId: string,
  edges: WorkflowEdge[],
  nodeOutputs: Map<string, string>,
  allNodes: WorkflowNode[]
) {
  const incomingEdges = edges.filter((edge) => edge.target === node.id && edge.targetHandle === inputId);
  if (incomingEdges.length === 0) {
    const input = node.data.inputs?.find((item) => item.id === inputId);
    const value = input?.value;
    return value === undefined || value === "" ? [] : [String(value)];
  }

  return incomingEdges
    .flatMap((edge) => {
      const sourceNode = allNodes.find((item) => item.id === edge.source);
      if (!sourceNode) return [];
      if (sourceNode.data.kind === "request_inputs") {
        const field = sourceNode.data.fields?.find((item) => item.id === edge.sourceHandle);
        return field?.kind === "image_field" ? [field.imageUrl ?? ""] : [field?.value ?? ""];
      }
      return [nodeOutputs.get(sourceNode.id) ?? ""];
    })
    .filter(Boolean);
}

function findRequestImageFallback(
  node: WorkflowNode,
  edges: WorkflowEdge[],
  allNodes: WorkflowNode[]
) {
  const incomingRequestNodeIds = new Set(
    edges
      .filter((edge) => edge.target === node.id && edge.targetHandle === "input_image")
      .map((edge) => edge.source)
  );

  for (const sourceNode of allNodes) {
    if (sourceNode.data.kind !== "request_inputs" || !incomingRequestNodeIds.has(sourceNode.id)) continue;
    const imageField = sourceNode.data.fields?.find((field) => field.kind === "image_field" && field.imageUrl);
    if (imageField?.imageUrl) return imageField.imageUrl;
  }

  return undefined;
}

function truncateOutput(output: string) {
  if (output.length <= MAX_STORED_OUTPUT) return output;
  if (output.startsWith("data:image")) return "[image data]";
  return `${output.slice(0, MAX_STORED_OUTPUT)}...`;
}

async function executeCropTask(payload: {
  inputUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  try {
    const taskRun = await tasks.triggerAndPoll<typeof cropImageTask>(
      "crop-image-ffmpeg",
      payload,
      { pollIntervalMs: 1000 }
    );
    if (taskRun.status !== "COMPLETED") throw new Error(taskRun.error?.message ?? "Crop Image task failed");
    return String(taskRun.output?.outputUrl ?? payload.inputUrl);
  } catch (error) {
    if (!isTriggerAuthError(error)) throw error;
    const result = await runCropLocally(payload);
    return result.outputUrl;
  }
}

async function executeGeminiTask(payload: {
  prompt: string;
  systemPrompt?: string;
  model: string;
  imageUrls: string[];
}) {
  try {
    const taskRun = await tasks.triggerAndPoll<typeof geminiTask>(
      "gemini-3-1-pro",
      payload,
      { pollIntervalMs: 1000 }
    );
    if (taskRun.status !== "COMPLETED") throw new Error(taskRun.error?.message ?? "Gemini task failed");
    return String(taskRun.output?.text ?? "No response generated");
  } catch (error) {
    if (!isTriggerAuthError(error)) throw error;
    const result = await runGeminiLocally(payload);
    return result.text;
  }
}

function isTriggerAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("Invalid API Key") || message.includes("TRIGGER_SECRET_KEY");
}

async function runCropLocally(input: {
  inputUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  await new Promise((resolve) => setTimeout(resolve, 30000));
  const sharp = (await import("sharp")).default;
  const source = await loadImageBuffer(input.inputUrl);
  const metadata = await sharp(source).metadata();
  const imageWidth = metadata.width ?? 1;
  const imageHeight = metadata.height ?? 1;
  const left = Math.max(0, Math.round((imageWidth * input.x) / 100));
  const top = Math.max(0, Math.round((imageHeight * input.y) / 100));
  const width = Math.max(1, Math.min(imageWidth - left, Math.round((imageWidth * input.width) / 100)));
  const height = Math.max(1, Math.min(imageHeight - top, Math.round((imageHeight * input.height) / 100)));
  const cropped = await sharp(source).extract({ left, top, width, height }).png().toBuffer();
  return { outputUrl: `data:image/png;base64,${cropped.toString("base64")}` };
}

async function runGeminiLocally(input: {
  prompt: string;
  systemPrompt?: string;
  model: string;
  imageUrls: string[];
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const requestBody: any = { contents: [{ parts: [{ text: input.prompt }] }] };
  if (input.systemPrompt) requestBody.system_instruction = { parts: [{ text: input.systemPrompt }] };

  for (const imageUrl of input.imageUrls) {
    const imagePart = await imageUrlToGeminiPart(imageUrl);
    if (imagePart) requestBody.contents[0].parts.push(imagePart);
  }

  const modelId = resolveGeminiModelId(input.model);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message ?? `Gemini API error: ${response.status}`);
  return { text: data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response generated" };
}

async function imageUrlToGeminiPart(imageUrl: string) {
  const parsed = parseDataUrl(imageUrl);
  if (parsed) return { inline_data: { mime_type: parsed.mimeType, data: parsed.data } };

  const response = await fetch(imageUrl);
  if (!response.ok) return null;
  const buffer = await response.arrayBuffer();
  return {
    inline_data: {
      mime_type: response.headers.get("content-type") || "image/jpeg",
      data: Buffer.from(buffer).toString("base64")
    }
  };
}

function parseDataUrl(url: string) {
  const match = url.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

async function loadImageBuffer(inputUrl: string) {
  if (inputUrl.startsWith("data:")) {
    const [, data = ""] = inputUrl.split(",");
    return Buffer.from(data, "base64");
  }

  const response = await fetch(inputUrl);
  if (!response.ok) throw new Error(`Could not fetch image: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

function resolveGeminiModelId(model: string) {
  const map: Record<string, string> = {
    "Gemini 3.1 Pro": "gemini-2.0-flash",
    "Gemini 2.0 Flash": "gemini-2.0-flash",
    "Gemini 2.0 Flash Lite": "gemini-2.0-flash-lite",
    "Gemini 2.5 Flash": "gemini-2.5-flash-preview-05-20",
    "Gemini 2.5 Pro": "gemini-2.5-pro-preview-05-06",
    "Gemini 1.5 Pro": "gemini-2.0-flash",
    "Gemini 1.5 Flash": "gemini-2.0-flash-lite",
    "gemini-2.0-flash": "gemini-2.0-flash",
    "gemini-2.0-flash-lite": "gemini-2.0-flash-lite",
    "gemini-2.5-flash": "gemini-2.5-flash-preview-05-20",
    "gemini-2.5-pro": "gemini-2.5-pro-preview-05-06"
  };
  return map[model] ?? "gemini-2.0-flash";
}
