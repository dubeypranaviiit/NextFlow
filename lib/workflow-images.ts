import type { Workflow, WorkflowNode } from "@/types/workflow";

export function resolveInputImageUrls(workflow: Workflow, targetNodeId: string, inputId: string): string[] {
  return workflow.edges
    .filter((edge) => edge.target === targetNodeId && edge.targetHandle === inputId)
    .flatMap((edge) => {
      const sourceNode = workflow.nodes.find((node) => node.id === edge.source);
      if (!sourceNode) return [];
      return resolveOutputImageUrls(workflow, sourceNode, edge.sourceHandle ?? undefined);
    })
    .filter(isImageUrl);
}

export function resolveOutputImageUrls(
  workflow: Workflow,
  node: WorkflowNode,
  outputId?: string
): string[] {
  if (node.data.kind === "request_inputs") {
    const fields = node.data.fields ?? [];
    const field = outputId ? fields.find((item) => item.id === outputId) : undefined;
    const images = field ? [field.imageUrl] : fields.map((item) => item.imageUrl);
    return images.filter(isImageUrl);
  }

  if (node.data.kind === "crop_image") {
    if (isImageUrl(node.data.response)) return [node.data.response];
    return resolveInputImageUrls(workflow, node.id, "input_image");
  }

  return [];
}

function isImageUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) return false;
  if (value.startsWith("[") && value.endsWith("]")) return false;
  return (
    value.startsWith("data:image") ||
    value.startsWith("blob:") ||
    /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i.test(value) ||
    value.includes("images.unsplash.com")
  );
}
