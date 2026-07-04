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


export type ContextMenu = {
  x: number;
  y: number;
  nodeId?: string;
  edgeId?: string;
} | null;


let saveTimer: ReturnType<typeof setTimeout> | null = null;
let saveInFlight = false;
let saveQueued = false;

function debouncedSave(workflowId: string) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    executeSave(workflowId);
  }, 2000);
}

async function executeSave(workflowId: string) {
  if (saveInFlight) {
   
    saveQueued = true;
    return;
  }

  const state = useWorkflowStore.getState();
  const wf = state.workflow;
  if (wf.id !== workflowId) return;

  saveInFlight = true;
  try {
    await fetch(`/api/workflows/${workflowId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: wf.name,
        description: wf.description,
        viewport: wf.viewport,
        nodes: wf.nodes.map((n) => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: n.data
        })),
        edges: wf.edges.map((e) => ({
          id: e.id,
          source: e.source,
          sourceHandle: e.sourceHandle,
          target: e.target,
          targetHandle: e.targetHandle,
          type: e.type,
          animated: e.animated,
          data: e.data,
          style: e.style
        }))
      })
    });
  } catch {
   
  } finally {
    saveInFlight = false;
    if (saveQueued) {
      saveQueued = false;
      executeSave(useWorkflowStore.getState().workflow.id);
    }
  }
}


type WorkflowStore = {
 
  workflow: Workflow;
  loading: boolean;
 
  selectedIds: string[];

  historyOpen: boolean;
  pickerOpen: boolean;
  contextMenu: ContextMenu;
 
  runs: WorkflowRun[];

  executionState: ExecutionState;
  runningNodeIds: Set<string>;
  
  undoStack: Snapshot[];
  redoStack: Snapshot[];

  currentZoom: number;

  
  setWorkflow: (workflow: Workflow) => void;
  setSelectedIds: (ids: string[]) => void;
  setHistoryOpen: (open: boolean) => void;
  setPickerOpen: (open: boolean) => void;
  setContextMenu: (menu: ContextMenu) => void;
  setExecutionState: (state: ExecutionState) => void;
  setLoading: (loading: boolean) => void;


  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<WorkflowEdge>[]) => void;
  connect: (connection: Connection) => void;
  addNode: (kind: "crop_image" | "gemini" | "groq" | "condition") => void;
  setViewport: (viewport: Viewport) => void;
  setCurrentZoom: (zoom: number) => void;
  deleteNode: (nodeId: string) => void;
  deleteEdge: (edgeId: string) => void;

  setNodeStatus: (nodeId: string, status: ExecutionState, response?: string) => void;
  addRun: (run: WorkflowRun) => void;
  setRuns: (runs: WorkflowRun[]) => void;


  undo: () => void;
  redo: () => void;

  
  exportJson: () => string;
  importJson: (workflow: Workflow) => void;


  updateNodeField: (nodeId: string, fieldId: string, value: string) => void;
  updateNodeData: (nodeId: string, data: Partial<WorkflowNode["data"]>) => void;


  hydrateFromDb: (workflowId: string) => Promise<void>;
  saveToDb: () => void;
};

const initialWorkflow = createDefaultWorkflow();

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  workflow: initialWorkflow,
  loading: true,
  selectedIds: [],
  historyOpen: false,
  pickerOpen: false,
  contextMenu: null,
  runs: [],
  executionState: "idle",
  runningNodeIds: new Set(),
  undoStack: [],
  redoStack: [],
  currentZoom: initialWorkflow.viewport.zoom,

  setWorkflow: (workflow) => set({ workflow }),
  setSelectedIds: (selectedIds) => set({ selectedIds }),
  setHistoryOpen: (historyOpen) => set({ historyOpen }),
  setPickerOpen: (pickerOpen) => set({ pickerOpen }),
  setContextMenu: (contextMenu) => set({ contextMenu }),
  setExecutionState: (executionState) => set({ executionState }),
  setLoading: (loading) => set({ loading }),

  onNodesChange: (changes) => {
   
    const safeChanges = changes.filter((change) => {
      if (change.type === "remove") {
        const node = get().workflow.nodes.find((n) => n.id === change.id);
        return node ? !node.data.locked : true;
      }
      return true;
    });
    if (safeChanges.length === 0) return;
    checkpoint();
    set((state) => ({
      workflow: { ...state.workflow, nodes: applyNodeChanges(safeChanges, state.workflow.nodes) }
    }));
    debouncedSave(get().workflow.id);
  },

  onEdgesChange: (changes) => {
    checkpoint();

    const removedEdgeIds = changes
      .filter((c) => c.type === "remove")
      .map((c) => c.id);

    set((state) => {
      let nodes = state.workflow.nodes;
      const edges = applyEdgeChanges(changes, state.workflow.edges);

      if (removedEdgeIds.length > 0) {
        const removedEdges = state.workflow.edges.filter((e) => removedEdgeIds.includes(e.id));
        for (const re of removedEdges) {
         
          const stillConnected = edges.some(
            (e) => e.target === re.target && e.targetHandle === re.targetHandle
          );
          if (!stillConnected) {
            nodes = nodes.map((node) =>
              node.id === re.target
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      inputs: node.data.inputs?.map((inp) =>
                        inp.id === re.targetHandle ? { ...inp, connected: false } : inp
                      )
                    }
                  }
                : node
            );
          }
        }
      }

      return { workflow: { ...state.workflow, nodes, edges } };
    });
    debouncedSave(get().workflow.id);
  },

  connect: (connection) => {
    const { workflow } = get();
    const source = workflow.nodes.find((n) => n.id === connection.source);
    const target = workflow.nodes.find((n) => n.id === connection.target);
    const output = source?.data.outputs?.find((o) => o.id === connection.sourceHandle);
    const input = target?.data.inputs?.find((i) => i.id === connection.targetHandle);
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
    debouncedSave(get().workflow.id);
  },

  addNode: (kind) => {
    checkpoint();
    const id = `${kind}-${Date.now()}`;
    const { workflow } = get();

    const cx = (-workflow.viewport.x + 400) / workflow.viewport.zoom;
    const cy = (-workflow.viewport.y + 300) / workflow.viewport.zoom;
    let node: WorkflowNode;

    if (kind === "crop_image") {
      node = {
        id,
        type: "crop_image",
        position: { x: cx, y: cy },
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
      };
    } else if (kind === "groq") {
      node = {
        id,
        type: "groq",
        position: { x: cx + 40, y: cy + 40 },
        data: {
          title: "Llama 3.3 70B",
          kind: "groq",
          model: "llama-3.3-70b-versatile",
          inputs: [
            { id: "prompt", label: "Prompt", type: "text" },
            { id: "system_prompt", label: "System Prompt", type: "text" }
          ],
          outputs: [{ id: "response", label: "Response text", type: "text" }]
        }
      };
    } else if (kind === "condition") {
      node = {
        id,
        type: "condition",
        position: { x: cx, y: cy },
        data: {
          title: "If / Else",
          kind: "condition",
          comparator: "contains" as const,
          conditionValue: "",
          inputs: [{ id: "input", label: "Input", type: "any" as const }],
          outputs: [
            { id: "true_branch", label: "True", type: "any" as const },
            { id: "false_branch", label: "False", type: "any" as const },
          ],
        },
      };
    } else {
      node = {
        id,
        type: "gemini",
        position: { x: cx + 40, y: cy + 40 },
        data: {
          title: "Gemini 3.1 Pro",
          kind: "gemini",
          model: "gemini-3.1-pro-preview",
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
    }

    set((state) => ({ workflow: { ...state.workflow, nodes: [...state.workflow.nodes, node] }, pickerOpen: false }));
    debouncedSave(get().workflow.id);
  },

  setViewport: (viewport) => {
    set((state) => ({ workflow: { ...state.workflow, viewport }, currentZoom: viewport.zoom }));
    debouncedSave(get().workflow.id);
  },
  setCurrentZoom: (zoom) => set({ currentZoom: zoom }),

  deleteNode: (nodeId) => {
    const node = get().workflow.nodes.find((n) => n.id === nodeId);
    if (node?.data.locked) return;
    checkpoint();
    set((state) => ({
      workflow: {
        ...state.workflow,
        nodes: state.workflow.nodes.filter((n) => n.id !== nodeId),
        edges: state.workflow.edges.filter((e) => e.source !== nodeId && e.target !== nodeId)
      },
      contextMenu: null
    }));
    debouncedSave(get().workflow.id);
  },

  deleteEdge: (edgeId) => {
    checkpoint();

    const edge = get().workflow.edges.find((e) => e.id === edgeId);

    set((state) => {
      let nodes = state.workflow.nodes;
      const edges = state.workflow.edges.filter((e) => e.id !== edgeId);

      if (edge) {
        const stillConnected = edges.some(
          (e) => e.target === edge.target && e.targetHandle === edge.targetHandle
        );
        if (!stillConnected) {
          nodes = nodes.map((node) =>
            node.id === edge.target
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    inputs: node.data.inputs?.map((inp) =>
                      inp.id === edge.targetHandle ? { ...inp, connected: false } : inp
                    )
                  }
                }
              : node
          );
        }
      }

      return {
        workflow: { ...state.workflow, nodes, edges },
        contextMenu: null
      };
    });
    debouncedSave(get().workflow.id);
  },

  setNodeStatus: (nodeId, status, response) =>
    set((state) => {
      const runningNodeIds = new Set(state.runningNodeIds);
      if (status === "running") runningNodeIds.add(nodeId);
      else runningNodeIds.delete(nodeId);
      return {
        runningNodeIds,
        workflow: {
          ...state.workflow,
          nodes: state.workflow.nodes.map((node) =>
            node.id === nodeId ? { ...node, data: { ...node.data, status, response: response ?? node.data.response } } : node
          )
        }
      };
    }),

  addRun: (run) => set((state) => ({ runs: [run, ...state.runs] })),
  setRuns: (runs) => set({ runs }),

  undo: () => {
    const { workflow, undoStack, redoStack } = get();
    const previous = undoStack.at(-1);
    if (!previous) return;
    set({
      workflow: { ...workflow, ...previous },
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, snapshot(workflow)]
    });
    debouncedSave(get().workflow.id);
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
    debouncedSave(get().workflow.id);
  },

  exportJson: () => JSON.stringify(get().workflow, null, 2),
  importJson: (workflow) => {
    const current = get().workflow;
    const imported = {
      ...current,
      ...workflow,
      id: current.id,
      userId: current.userId,
      updatedAt: new Date().toISOString()
    };
    set({ workflow: imported, undoStack: [], redoStack: [] });
    debouncedSave(current.id);
  },

  updateNodeField: (nodeId, fieldId, value) => {
    set((state) => ({
      workflow: {
        ...state.workflow,
        nodes: state.workflow.nodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  fields: node.data.fields?.map((f) =>
                    f.id === fieldId ? { ...f, value } : f
                  )
                }
              }
            : node
        )
      }
    }));
    debouncedSave(get().workflow.id);
  },

  updateNodeData: (nodeId, data) => {
    set((state) => ({
      workflow: {
        ...state.workflow,
        nodes: state.workflow.nodes.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...data } }
            : node
        )
      }
    }));
    debouncedSave(get().workflow.id);
  },


  hydrateFromDb: async (workflowId: string) => {
    set({ loading: true });
    try {
      const res = await fetch(`/api/workflows/${workflowId}`);
      if (!res.ok) throw new Error("Failed to fetch workflow");
      const data = await res.json();
      const dbWorkflow = data.workflow;

      const nodes: WorkflowNode[] = dbWorkflow.nodes.map((n: any) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data
      }));

      const edges: WorkflowEdge[] = dbWorkflow.edges.map((e: any) => {
        const edgeType = e.data?.type ?? "text";
        const color = edgeType === "image" ? "#80aefb" : "#f5a83c";
        return {
          id: e.id,
          source: e.source,
          sourceHandle: e.sourceHandle,
          target: e.target,
          targetHandle: e.targetHandle,
          type: "smoothstep",
          animated: true,
          data: e.data ?? { type: "text" },
          style: { stroke: color }
        };
      });

      const viewport = dbWorkflow.viewport ?? { x: 400, y: 300, zoom: 0.5 };

      
      const runs: WorkflowRun[] = (dbWorkflow.runs ?? []).map((r: any) => ({
        id: r.id,
        workflowId: r.workflowId,
        scope: r.scope as any,
        state: r.state as any,
        startedAt: r.startedAt,
        durationMs: r.durationMs,
        nodeRuns: (r.nodeRuns ?? []).map((nr: any) => ({
          id: nr.id,
          nodeId: nr.nodeId,
          nodeTitle: nr.nodeTitle,
          state: nr.state,
          durationMs: nr.durationMs,
          output: typeof nr.output === "string" ? nr.output : nr.output ? JSON.stringify(nr.output) : undefined,
          error: nr.error
        }))
      }));

      set({
        workflow: {
          id: dbWorkflow.id,
          name: dbWorkflow.name,
          description: dbWorkflow.description ?? "",
          userId: dbWorkflow.userId,
          nodes,
          edges,
          viewport,
          updatedAt: dbWorkflow.updatedAt,
          status: dbWorkflow.status ?? "idle"
        },
        runs,
        loading: false,
        undoStack: [],
        redoStack: [],
        currentZoom: viewport.zoom
      });
    } catch (error) {
      console.error("Failed to hydrate workflow:", error);
      set({ loading: false });
    }
  },

  saveToDb: () => {
    debouncedSave(get().workflow.id);
  }
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
