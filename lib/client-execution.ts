"use client";

import { useWorkflowStore } from "@/store/workflow-store";
import type { RunScope, Workflow, WorkflowNode, WorkflowRun } from "@/types/workflow";

let progressTimers: ReturnType<typeof setTimeout>[] = [];

export async function executeWorkflow(scope: RunScope, nodeIds?: string[]) {
  const store = useWorkflowStore.getState();
  const workflow = store.workflow;
  clearProgressTimers();

  for (const node of workflow.nodes) {
    store.setNodeStatus(node.id, "idle");
  }
  store.setExecutionState("running");

  try {
    const executionBatches = topologicalBatches(workflow, nodeIds);
    const queuedIds = executionBatches.flat().map((node) => node.id);
    for (const nodeId of queuedIds) store.setNodeStatus(nodeId, "queued");
    startProgressPreview(executionBatches);

    const response = await fetch("/api/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflow, scope, nodeIds })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Workflow execution failed");
    clearProgressTimers();

    const run = data.run as WorkflowRun;
    for (const nodeRun of run.nodeRuns) {
      store.setNodeStatus(nodeRun.nodeId, nodeRun.state, nodeRun.output ?? nodeRun.error);
    }
    store.setExecutionState(run.state);
    store.addRun(run);
  } catch (error) {
    clearProgressTimers();
    const message = error instanceof Error ? error.message : "Workflow execution failed";
    const failedIds = nodeIds
      ? topologicalBatches(workflow, nodeIds).flat().map((node) => node.id)
      : workflow.nodes.map((node) => node.id);
    for (const nodeId of failedIds) store.setNodeStatus(nodeId, "failed", message);
    store.setExecutionState("failed");
  } finally {
    store.setHistoryOpen(true);
    setTimeout(() => {
      useWorkflowStore.getState().setExecutionState("idle");
    }, 2000);
  }
}

function startProgressPreview(batches: WorkflowNode[][]) {
  if (batches.length === 0) return;
  const stepMs = 850;
  batches.forEach((batch, index) => {
    const timer = setTimeout(() => {
      const store = useWorkflowStore.getState();
      const completed = batches.slice(0, index).flat();
      for (const node of completed) {
        const currentStatus = store.workflow.nodes.find((item) => item.id === node.id)?.data.status;
        if (currentStatus === "queued" || currentStatus === "running") {
          store.setNodeStatus(node.id, "success");
        }
      }
      for (const node of batch) {
        const currentStatus = store.workflow.nodes.find((item) => item.id === node.id)?.data.status;
        if (currentStatus === "queued") store.setNodeStatus(node.id, "running");
      }
    }, index * stepMs);
    progressTimers.push(timer);
  });
}

function clearProgressTimers() {
  for (const timer of progressTimers) clearTimeout(timer);
  progressTimers = [];
}

function topologicalBatches(workflow: Workflow, subsetIds?: string[]) {
  const allow = subsetIds
    ? collectUpstreamNodeIds(workflow, subsetIds)
    : new Set(workflow.nodes.map((node) => node.id));
  const nodes = workflow.nodes.filter((node) => allow.has(node.id));
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, string[]>();

  for (const node of nodes) incoming.set(node.id, 0);
  for (const edge of workflow.edges) {
    if (!allow.has(edge.source) || !allow.has(edge.target)) continue;
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
  }

  const batches: WorkflowNode[][] = [];
  let ready = nodes.filter((node) => (incoming.get(node.id) ?? 0) === 0);
  const consumed = new Set<string>();

  while (ready.length) {
    batches.push(ready);
    const next: WorkflowNode[] = [];
    for (const node of ready) {
      consumed.add(node.id);
      for (const child of outgoing.get(node.id) ?? []) {
        incoming.set(child, (incoming.get(child) ?? 0) - 1);
        if ((incoming.get(child) ?? 0) === 0) {
          const childNode = nodes.find((item) => item.id === child);
          if (childNode) next.push(childNode);
        }
      }
    }
    ready = next;
  }

  return batches;
}

function collectUpstreamNodeIds(workflow: Workflow, targetIds: string[]) {
  const allow = new Set(targetIds);
  let changed = true;

  while (changed) {
    changed = false;
    for (const edge of workflow.edges) {
      if (allow.has(edge.target) && !allow.has(edge.source)) {
        allow.add(edge.source);
        changed = true;
      }
    }
  }

  return allow;
}
