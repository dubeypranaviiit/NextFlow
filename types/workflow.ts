import type { Edge, Node, Viewport } from "@xyflow/react";

export type NodeKind = "request_inputs" | "crop_image" | "gemini" | "groq" | "response" | "condition";
export type FieldKind = "text_field" | "image_field";
export type ExecutionState = "idle" | "queued" | "running" | "success" | "failed" | "skipped";
export type Comparator = "contains" | "equals" | "starts_with" | "greater_than" | "less_than";
export type RunScope = "full" | "partial" | "single";
export type PortType = "text" | "image" | "video" | "audio" | "file" | "number" | "any";

export type RequestField = {
  id: string;
  label: string;
  kind: FieldKind;
  value: string;
  imageUrl?: string;
};

export type InputConfig = {
  id: string;
  label: string;
  type: PortType;
  value?: string | number;
  connected?: boolean;
};

export type OutputConfig = {
  id: string;
  label: string;
  type: PortType;
  value?: string;
};

export type WorkflowNodeData = {
  title: string;
  kind: NodeKind;
  locked?: boolean;
  status?: ExecutionState;
  fields?: RequestField[];
  inputs?: InputConfig[];
  outputs?: OutputConfig[];
  systemPrompt?: string;
  prompt?: string;
  model?: string;
  response?: string;
  settingsOpen?: boolean;
  durationMs?: number;
  error?: string;
  comparator?: Comparator;
  conditionValue?: string;
};

export type WorkflowNode = Node<WorkflowNodeData, NodeKind>;
export type WorkflowEdge = Edge<{ type: PortType }>;

export type Workflow = {
  id: string;
  name: string;
  description?: string;
  userId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport: Viewport;
  updatedAt: string;
  status: ExecutionState;
};

export type NodeRun = {
  id: string;
  nodeId: string;
  nodeTitle: string;
  state: Exclude<ExecutionState, "idle">;
  durationMs: number;
  output?: string;
  error?: string;
};

export type WorkflowRun = {
  id: string;
  workflowId: string;
  scope: RunScope;
  state: Exclude<ExecutionState, "idle">;
  startedAt: string;
  durationMs: number;
  nodeRuns: NodeRun[];
};
