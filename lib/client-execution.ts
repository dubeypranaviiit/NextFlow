"use client";

import { useWorkflowStore } from "@/store/workflow-store";
import type { RunScope, WorkflowRun } from "@/types/workflow";

export async function executeWorkflow(scope: RunScope, nodeIds?: string[]) {
  const store = useWorkflowStore.getState();
  const workflow = store.workflow;

  for (const node of workflow.nodes) {
    store.setNodeStatus(node.id, "idle");
  }
  store.setExecutionState("running");

  try {
    const queuedIds = nodeIds ?? workflow.nodes.map((node) => node.id);
    for (const nodeId of queuedIds) store.setNodeStatus(nodeId, "queued");

    const response = await fetch("/api/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflow, scope, nodeIds })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Workflow execution failed");

    const run = data.run as WorkflowRun;
    for (const nodeRun of run.nodeRuns) {
      store.setNodeStatus(nodeRun.nodeId, nodeRun.state, nodeRun.output ?? nodeRun.error);
    }
    store.setExecutionState(run.state);
    store.addRun(run);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workflow execution failed";
    const failedIds = nodeIds ?? workflow.nodes.map((node) => node.id);
    for (const nodeId of failedIds) store.setNodeStatus(nodeId, "failed", message);
    store.setExecutionState("failed");
  } finally {
    store.setHistoryOpen(true);
    setTimeout(() => {
      useWorkflowStore.getState().setExecutionState("idle");
    }, 2000);
  }
}
