"use client";

import { topologicalBatches } from "@/server/execution/dag";
import { formatDuration } from "@/lib/utils";
import { useWorkflowStore } from "@/store/workflow-store";
import type { NodeRun, RunScope, WorkflowNode } from "@/types/workflow";

export async function executeWorkflow(scope: RunScope, nodeIds?: string[]) {
  const store = useWorkflowStore.getState();
  const workflow = store.workflow;
  const batches = topologicalBatches(workflow, nodeIds);
  const startedAt = Date.now();
  const nodeRuns: NodeRun[] = [];

  for (const batch of batches) {
    await Promise.all(
      batch.map(async (node) => {
        store.setNodeStatus(node.id, "running");
        const start = Date.now();
        try {
          const output = await executeNode(node);
          const durationMs = Date.now() - start;
          useWorkflowStore.getState().setNodeStatus(node.id, "success", output);
          nodeRuns.push({
            id: `${node.id}-${start}`,
            nodeId: node.id,
            nodeTitle: node.data.title,
            state: "success",
            durationMs,
            output
          });
        } catch (error) {
          const durationMs = Date.now() - start;
          const message = error instanceof Error ? error.message : "Execution failed";
          useWorkflowStore.getState().setNodeStatus(node.id, "failed", message);
          nodeRuns.push({
            id: `${node.id}-${start}`,
            nodeId: node.id,
            nodeTitle: node.data.title,
            state: "failed",
            durationMs,
            error: message
          });
        }
      })
    );
  }

  const durationMs = Date.now() - startedAt;
  useWorkflowStore.getState().addRun({
    id: `run-${startedAt}`,
    workflowId: workflow.id,
    scope,
    state: nodeRuns.some((run) => run.state === "failed") ? "failed" : "success",
    startedAt: new Date(startedAt).toISOString(),
    durationMs,
    nodeRuns
  });
}

async function executeNode(node: WorkflowNode) {
  if (node.data.kind === "request_inputs") {
    await delay(450);
    return "Inputs resolved";
  }
  if (node.data.kind === "crop_image") {
    await delay(1200);
    return "Image crop queued in Trigger.dev. Production task enforces 30+ second FFmpeg delay.";
  }
  if (node.data.kind === "gemini") {
    await delay(900);
    return node.id === "gemini-final"
      ? "Cut the noise, keep the sound. These foldable wireless headphones deliver 30-hour battery life and noise cancellation for workdays, flights, and everything between."
      : "Generated response in " + formatDuration(900);
  }
  await delay(350);
  return "Final result captured";
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
