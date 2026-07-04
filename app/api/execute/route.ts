import { NextResponse } from "next/server";
import { evaluateCondition } from "@/lib/condition-evaluator";
import { configure, runs, tasks } from "@trigger.dev/sdk/v3";
import type { AnyTask, TaskIdentifier, TaskPayload } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getCurrentUserId } from "@/lib/current-user";
import { topologicalBatches } from "@/server/execution/dag";
import type { Workflow, WorkflowEdge, WorkflowNode } from "@/types/workflow";
import type { cropImageTask } from "@/trigger/crop-image";
import type { geminiTask } from "@/trigger/gemini";
import type { groqTask } from "@/trigger/groq";

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
    state: "success" | "failed" | "skipped";
    durationMs: number;
    output?: string;
    error?: string;
  }> = [];
  const nodeOutputs = new Map<string, string>();
  const failedNodeIds = new Set<string>();
  const skippedNodeIds = new Set<string>();
  let hasFailure = false;

  try {
    const batches = topologicalBatches(workflow, payload.nodeIds);

    for (const batch of batches) {
      const results = await Promise.all(
        batch.map(async (node) => {
          const started = Date.now();

          // Check if this node should be skipped (downstream of inactive condition branch)
          if (skippedNodeIds.has(node.id)) {
            return {
              nodeId: node.id,
              nodeTitle: node.data.title,
              state: "skipped" as const,
              durationMs: 0,
            };
          }

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

      // After batch completes, check for condition nodes and propagate skips
      for (const result of results) {
        if (result.state !== "success") continue;
        const executedNode = batch.find((n) => n.id === result.nodeId);
        if (!executedNode || executedNode.data.kind !== "condition") continue;

        // Parse the condition result
        try {
          const condResult = JSON.parse(result.output ?? "{}");
          const inactiveHandle = condResult.result ? "false_branch" : "true_branch";
          // Find edges from the inactive handle and mark their targets as skipped
          for (const edge of workflow.edges) {
            if (edge.source === executedNode.id && edge.sourceHandle === inactiveHandle) {
              skippedNodeIds.add(edge.target);
            }
          }
        } catch {}
      }

      // Propagate skips: if ALL incoming edges of a node come from skipped nodes, skip it too
      let changed = true;
      while (changed) {
        changed = false;
        for (const node of workflow.nodes) {
          if (skippedNodeIds.has(node.id)) continue;
          const incomingEdges = workflow.edges.filter((e) => e.target === node.id);
          if (incomingEdges.length === 0) continue;
          const allSourcesSkipped = incomingEdges.every((e) => skippedNodeIds.has(e.source));
          if (allSourcesSkipped) {
            skippedNodeIds.add(node.id);
            changed = true;
          }
        }
      }
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

  if (node.data.kind === "condition") {
    const inputValue = resolveInputValues(node, "input", edges, nodeOutputs, allNodes).join("\n") || "";
    const comparator = node.data.comparator ?? "contains";
    const conditionValue = node.data.conditionValue ?? "";
    const result = evaluateCondition(inputValue, comparator, conditionValue);
    return JSON.stringify({ result, value: inputValue });
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

  if (node.data.kind === "groq") {
    const prompt = resolveInputValues(node, "prompt", edges, nodeOutputs, allNodes).join("\n") || node.data.prompt || "";
    const systemPrompt =
      node.data.systemPrompt || resolveInputValues(node, "system_prompt", edges, nodeOutputs, allNodes).join("\n");
    if (!prompt) throw new Error("Groq node requires a prompt");

    return executeGroqTask({
      prompt,
      systemPrompt: systemPrompt || undefined,
      model: node.data.model ?? "llama-3.3-70b-versatile"
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
  if (!shouldUseTriggerTasks()) {
    console.log("[NextFlow] crop-image-ffmpeg running locally");
    const result = await runCropLocally(payload);
    return result.outputUrl;
  }

  try {
    console.log("[NextFlow] crop-image-ffmpeg running through Trigger.dev");
    const taskRun = await triggerAndPollTask<typeof cropImageTask>(
      "crop-image-ffmpeg",
      payload
    );
    return String(taskRun.output?.outputUrl ?? payload.inputUrl);
  } catch (error) {
    if (isStrictTriggerMode()) throw error;
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
  if (!shouldUseTriggerTasks()) {
    console.log("[NextFlow] gemini-2.5-flash running locally");
    const result = await runGeminiLocally(payload);
    return result.text;
  }

  try {
    console.log("[NextFlow] gemini-2.5-flash running through Trigger.dev");
    const taskRun = await triggerAndPollTask<typeof geminiTask>(
      "gemini-2.5-flash",
      payload
    );
    return String(taskRun.output?.text ?? "No response generated");
  } catch (error) {
    if (isStrictTriggerMode()) throw error;
    if (!isTriggerAuthError(error)) throw error;
    const result = await runGeminiLocally(payload);
    return result.text;
  }
}

async function executeGroqTask(payload: {
  prompt: string;
  systemPrompt?: string;
  model: string;
}) {
  if (!shouldUseTriggerTasks()) {
    console.log("[NextFlow] groq-llm running locally");
    const result = await runGroqLocally(payload);
    return result.text;
  }

  try {
    console.log("[NextFlow] groq-llm running through Trigger.dev");
    const taskRun = await triggerAndPollTask<typeof groqTask>(
      "groq-llm",
      payload
    );
    return String(taskRun.output?.text ?? "No response generated");
  } catch (error) {
    if (isStrictTriggerMode()) throw error;
    if (!isTriggerAuthError(error)) throw error;
    const result = await runGroqLocally(payload);
    return result.text;
  }
}

function shouldUseTriggerTasks() {
  return process.env.NEXTFLOW_EXECUTION_MODE !== "local" && Boolean(process.env.TRIGGER_SECRET_KEY);
}

function isStrictTriggerMode() {
  return process.env.NEXTFLOW_EXECUTION_MODE === "trigger";
}

async function triggerAndPollTask<TTask extends AnyTask>(
  taskId: TaskIdentifier<TTask>,
  payload: TaskPayload<TTask>
) {
  configureTriggerClient();
  const handle = await tasks.trigger<TTask>(taskId, payload);
  const taskRun = await runs.poll(handle, { pollIntervalMs: 1000 });

  if (taskRun.status !== "COMPLETED") {
    throw new Error(getTriggerRunErrorMessage(taskRun.error, `${String(taskId)} task failed`));
  }

  return taskRun;
}

function configureTriggerClient() {
  const accessToken = cleanEnvSecret(process.env.TRIGGER_SECRET_KEY);
  if (!accessToken) {
    throw new Error("TRIGGER_SECRET_KEY is not configured");
  }
  if (accessToken.startsWith("tr_pat_")) {
    throw new Error(
      "TRIGGER_SECRET_KEY is a personal access token. Use the project API key from Trigger.dev project API Keys, usually starting with tr_dev_ or tr_prod_."
    );
  }
  configure({ accessToken });
}

function getTriggerRunErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message ?? fallback);
  }
  return fallback;
}

function cleanEnvSecret(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "");
}

function isTriggerAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  return (
    lower.includes("invalid api key") ||
    lower.includes("trigger_secret_key") ||
    lower.includes("unauthorized") ||
    lower.includes("401") ||
    lower.includes("authentication")
  );
}

async function runCropLocally(input: {
  inputUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  // await delay(30000);
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
  if (!apiKey) {
    if (!process.env.GROQ_API_KEY) throw new Error("GEMINI_API_KEY not configured");
    const imageNote = input.imageUrls.length
      ? `\n\nImage inputs received: ${input.imageUrls.length}. Use the upstream crop context as supporting visual evidence.`
      : "";
    return runGroqLocally({
      prompt: `${input.prompt}${imageNote}`,
      systemPrompt: input.systemPrompt,
      model: "llama-3.3-70b-versatile"
    });
  }

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

async function runGroqLocally(input: {
  prompt: string;
  systemPrompt?: string;
  model: string;
}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  const primaryModel = resolveGroqModelId(input.model);
  const modelsToTry = [
    primaryModel,
    ...["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"].filter(
      (model) => model !== primaryModel
    )
  ];

  for (const modelId of modelsToTry) {
    const result = await callGroq(apiKey, modelId, input.prompt, input.systemPrompt);
    if (result.ok) return { text: result.text };
    if (result.status !== 429) throw new Error(result.error);
  }

  throw new Error("All Groq models are rate-limited. Please wait a moment and try again.");
}

async function callGroq(
  apiKey: string,
  modelId: string,
  prompt: string,
  systemPrompt?: string
): Promise<{ ok: true; text: string } | { ok: false; status: number; error: string }> {
  const messages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: prompt });

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      temperature: 0.7,
      max_tokens: 4096
    })
  });

  const data = await response.json();
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: data?.error?.message || `Groq API error: ${response.status}`
    };
  }

  return { ok: true, text: data?.choices?.[0]?.message?.content ?? "No response generated" };
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

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


function resolveGeminiModelId(model: string) {
  const map: Record<string, string> = {
    
    "gemini-2.5-flash": "gemini-2.5-flash",
    "gemini-2.5-pro": "gemini-2.5-pro",

   
    "Gemini 2.5 Flash": "gemini-2.5-flash",
    "Gemini 2.5 Pro": "gemini-2.5-pro",

    
    "Gemini 1.5 Flash": "gemini-1.5-flash",
    "Gemini 1.5 Pro": "gemini-1.5-pro",

    
    "Gemini 2.0 Flash": "gemini-2.0-flash",
    "Gemini 2.0 Flash Lite": "gemini-2.0-flash-lite",
  };

  return map[model] ?? "gemini-2.5-flash";
}
function resolveGroqModelId(model: string) {
  const map: Record<string, string> = {
    "Llama 3.3 70B": "llama-3.3-70b-versatile",
    "Llama 3.1 8B": "llama-3.1-8b-instant",
    "Mixtral 8x7B": "mixtral-8x7b-32768",
    "Gemma 2 9B": "gemma2-9b-it",
    "llama-3.3-70b-versatile": "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant": "llama-3.1-8b-instant",
    "mixtral-8x7b-32768": "mixtral-8x7b-32768",
    "gemma2-9b-it": "gemma2-9b-it"
  };
  return map[model] ?? "llama-3.3-70b-versatile";
}
