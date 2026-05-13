"use client";

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type Viewport
} from "@xyflow/react";
import { create } from "zustand";
import { createDefaultWorkflow } from "@/lib/sample-workflow";
import type { ExecutionState, Workflow, WorkflowEdge, WorkflowNode, WorkflowRun } from "@/types/workflow";

type Snapshot = Pick<Workflow, "nodes" | "edges" | "viewport">;

type WorkflowStore = {
  workflow: Workflow;
  selectedIds: string[];
  historyOpen: boolean;
  pickerOpen: boolean;
  runs: WorkflowRun[];
  undoStack: Snapshot[];
  redoStack: Snapshot[];
  setWorkflow: (workflow: Workflow) => void;
  setSelectedIds: (ids: string[]) => void;
  setHistoryOpen: (open: boolean) => void;
  setPickerOpen: (open: boolean) => void;
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<WorkflowEdge>[]) => void;
  connect: (connection: Connection) => void;
  addNode: (kind: "crop_image" | "gemini") => void;
  setViewport: (viewport: Viewport) => void;
  setNodeStatus: (nodeId: string, status: ExecutionState, response?: string) => void;
  addRun: (run: WorkflowRun) => void;
  undo: () => void;
  redo: () => void;
  exportJson: () => string;
  importJson: (workflow: Workflow) => void;
};

const initialWorkflow = createDefaultWorkflow();

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  workflow: initialWorkflow,
  selectedIds: [],
  historyOpen: true,
  pickerOpen: false,
  runs: [],
  undoStack: [],
  redoStack: [],
  setWorkflow: (workflow) => set({ workflow }),
  setSelectedIds: (selectedIds) => set({ selectedIds }),
  setHistoryOpen: (historyOpen) => set({ historyOpen }),
  setPickerOpen: (pickerOpen) => set({ pickerOpen }),
  onNodesChange: (changes) => {
    checkpoint();
    set((state) => ({
      workflow: { ...state.workflow, nodes: applyNodeChanges(changes, state.workflow.nodes) }
    }));
  },
  onEdgesChange: (changes) => {
    checkpoint();
    const protectedIds = new Set(["request-inputs", "response"]);
    const safeChanges = changes.filter((change) => {
      if (change.type !== "remove") return true;
      const edge = get().workflow.edges.find((item) => item.id === change.id);
      return edge ? !protectedIds.has(edge.source) && !protectedIds.has(edge.target) : true;
    });
    set((state) => ({
      workflow: { ...state.workflow, edges: applyEdgeChanges(safeChanges, state.workflow.edges) }
    }));
  },
  connect: (connection) => {
    const { workflow } = get();
    const source = workflow.nodes.find((node) => node.id === connection.source);
    const target = workflow.nodes.find((node) => node.id === connection.target);
    const output = source?.data.outputs?.find((item) => item.id === connection.sourceHandle);
    const input = target?.data.inputs?.find((item) => item.id === connection.targetHandle);
    if (!source || !target || !output || !input) return;
    if (input.type !== "any" && output.type !== "any" && input.type !== output.type) return;
    if (wouldCreateCycle(workflow.edges, source.id, target.id)) return;
    checkpoint();
    set((state) => {
      const nodes = state.workflow.nodes.map((node) =>
        node.id === target.id
          ? {
              ...node,
              data: {
                ...node.data,
                inputs: node.data.inputs?.map((item) =>
                  item.id === input.id ? { ...item, connected: true } : item
                )
              }
            }
          : node
      );
      return {
        workflow: {
          ...state.workflow,
          nodes,
          edges: addEdge(
            {
              ...connection,
              id: `${connection.source}.${connection.sourceHandle}-${connection.target}.${connection.targetHandle}`,
              type: "smoothstep",
              animated: true,
              data: { type: output.type },
              style: { stroke: output.type === "image" ? "#80aefb" : "#f5a83c" }
            },
            state.workflow.edges
          )
        }
      };
    });
  },
  addNode: (kind) => {
    checkpoint();
    const id = `${kind}-${Date.now()}`;
    const node: WorkflowNode =
      kind === "crop_image"
        ? {
            id,
            type: "crop_image",
            position: { x: 120, y: 120 },
            data: {
              title: "Crop Image",
              kind: "crop_image",
              inputs: [
                { id: "input_image", label: "Input Image", type: "image" },
                { id: "x", label: "X Position %", type: "number", value: 0 },
                { id: "y", label: "Y Position %", type: "number", value: 0 },
                { id: "width", label: "Width %", type: "number", value: 100 },
                { id: "height", label: "Height %", type: "number", value: 100 }
              ],
              outputs: [{ id: "output_image", label: "Output Image", type: "image" }]
            }
          }
        : {
            id,
            type: "gemini",
            position: { x: 160, y: 160 },
            data: {
              title: "Gemini 3.1 Pro",
              kind: "gemini",
              model: "Gemini 3.1 Pro",
              inputs: [
                { id: "prompt", label: "Prompt", type: "text" },
                { id: "system_prompt", label: "System Prompt", type: "text" },
                { id: "image", label: "Image (Vision)", type: "image" },
                { id: "video", label: "Video", type: "video" },
                { id: "audio", label: "Audio", type: "audio" },
                { id: "file", label: "File", type: "file" }
              ],
              outputs: [{ id: "response", label: "Response text", type: "text" }]
            }
          };
    set((state) => ({ workflow: { ...state.workflow, nodes: [...state.workflow.nodes, node] }, pickerOpen: false }));
  },
  setViewport: (viewport) => set((state) => ({ workflow: { ...state.workflow, viewport } })),
  setNodeStatus: (nodeId, status, response) =>
    set((state) => ({
      workflow: {
        ...state.workflow,
        nodes: state.workflow.nodes.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, status, response: response ?? node.data.response } } : node
        )
      }
    })),
  addRun: (run) => set((state) => ({ runs: [run, ...state.runs] })),
  undo: () => {
    const { workflow, undoStack, redoStack } = get();
    const previous = undoStack.at(-1);
    if (!previous) return;
    set({
      workflow: { ...workflow, ...previous },
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, snapshot(workflow)]
    });
  },
  redo: () => {
    const { workflow, undoStack, redoStack } = get();
    const next = redoStack.at(-1);
    if (!next) return;
    set({
      workflow: { ...workflow, ...next },
      redoStack: redoStack.slice(0, -1),
      undoStack: [...undoStack, snapshot(workflow)]
    });
  },
  exportJson: () => JSON.stringify(get().workflow, null, 2),
  importJson: (workflow) => set({ workflow, undoStack: [], redoStack: [] })
}));

function checkpoint() {
  const { workflow, undoStack } = useWorkflowStore.getState();
  useWorkflowStore.setState({ undoStack: [...undoStack.slice(-24), snapshot(workflow)], redoStack: [] });
}

function snapshot(workflow: Workflow): Snapshot {
  return { nodes: workflow.nodes, edges: workflow.edges, viewport: workflow.viewport };
}

function wouldCreateCycle(edges: WorkflowEdge[], source: string, target: string) {
  const graph = new Map<string, string[]>();
  for (const edge of edges) {
    graph.set(edge.source, [...(graph.get(edge.source) ?? []), edge.target]);
  }
  graph.set(source, [...(graph.get(source) ?? []), target]);
  const seen = new Set<string>();
  const walk = (node: string): boolean => {
    if (node === source && seen.size > 0) return true;
    if (seen.has(node)) return false;
    seen.add(node);
    return (graph.get(node) ?? []).some(walk);
  };
  return walk(target);
}
