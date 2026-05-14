import type { Workflow, WorkflowEdge, WorkflowNode } from "@/types/workflow";

export function topologicalBatches(workflow: Workflow, subsetIds?: string[]) {
  const allow = subsetIds
    ? collectUpstreamNodeIds(workflow.edges, subsetIds)
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
  if (consumed.size !== nodes.length) {
    throw new Error("Workflow contains a cycle");
  }
  return batches;
}

function collectUpstreamNodeIds(edges: WorkflowEdge[], targetIds: string[]) {
  const allow = new Set(targetIds);
  let changed = true;

  while (changed) {
    changed = false;
    for (const edge of edges) {
      if (allow.has(edge.target) && !allow.has(edge.source)) {
        allow.add(edge.source);
        changed = true;
      }
    }
  }

  return allow;
}

export function validateConnection(edge: WorkflowEdge, nodes: WorkflowNode[]) {
  const source = nodes.find((node) => node.id === edge.source);
  const target = nodes.find((node) => node.id === edge.target);
  const output = source?.data.outputs?.find((item) => item.id === edge.sourceHandle);
  const input = target?.data.inputs?.find((item) => item.id === edge.targetHandle);
  if (!source || !target || !output || !input) return false;
  return input.type === "any" || output.type === "any" || input.type === output.type;
}
