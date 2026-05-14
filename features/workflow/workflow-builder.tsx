"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
  type NodeTypes
} from "@xyflow/react";
import { ArrowLeft, Check, Clock3, Columns2, Download, FileUp, Loader2, PanelRightOpen, Play, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Providers } from "@/components/providers";
import { executeWorkflow } from "@/lib/client-execution";
import { useWorkflowStore } from "@/store/workflow-store";
import { CropImageNode } from "@/features/workflow/nodes/crop-image-node";
import { GeminiNode } from "@/features/workflow/nodes/gemini-node";
import { GroqNode } from "@/features/workflow/nodes/groq-node";
import { RequestInputsNode } from "@/features/workflow/nodes/request-inputs-node";
import { ResponseNode } from "@/features/workflow/nodes/response-node";
import { FloatingToolbar } from "@/features/workflow/toolbar/floating-toolbar";
import { HistoryPanel } from "@/features/workflow/panels/history-panel";
import { NodePicker } from "@/features/workflow/panels/node-picker";
import { CanvasContextMenu } from "@/features/workflow/panels/context-menu";

const nodeTypes: NodeTypes = {
  request_inputs: RequestInputsNode,
  crop_image: CropImageNode,
  gemini: GeminiNode,
  groq: GroqNode,
  response: ResponseNode
};

export function WorkflowBuilderPage({ embedded = false, onBack }: { embedded?: boolean; onBack?: () => void }) {
  return (
    <Providers>
      <WorkflowBuilderInner embedded={embedded} onBack={onBack} />
    </Providers>
  );
}

function WorkflowBuilderInner({ embedded, onBack }: { embedded: boolean; onBack?: () => void }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const flow = useReactFlow();
  const importRef = useRef<HTMLInputElement>(null);
  const workflow = useWorkflowStore((s) => s.workflow);
  const onNodesChange = useWorkflowStore((s) => s.onNodesChange);
  const onEdgesChange = useWorkflowStore((s) => s.onEdgesChange);
  const connect = useWorkflowStore((s) => s.connect);
  const setHistoryOpen = useWorkflowStore((s) => s.setHistoryOpen);
  const historyOpen = useWorkflowStore((s) => s.historyOpen);
  const exportJson = useWorkflowStore((s) => s.exportJson);
  const importJson = useWorkflowStore((s) => s.importJson);
  const undo = useWorkflowStore((s) => s.undo);
  const redo = useWorkflowStore((s) => s.redo);
  const setViewport = useWorkflowStore((s) => s.setViewport);
  const setContextMenu = useWorkflowStore((s) => s.setContextMenu);
  const contextMenu = useWorkflowStore((s) => s.contextMenu);
  const executionState = useWorkflowStore((s) => s.executionState);
  const saveToDb = useWorkflowStore((s) => s.saveToDb);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const defaultEdgeOptions = useMemo(
    () => ({
      type: "smoothstep",
      animated: true,
      style: { strokeWidth: 2.2, stroke: "#f5a83c" }
    }),
    []
  );

  const fit = useCallback(() => flow.fitView({ duration: 320, padding: 0.18 }), [flow]);

 
  const handleSave = useCallback(async () => {
    setSaving(true);
    saveToDb();
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 500);
  }, [saveToDb]);

  
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [undo, redo, handleSave]);

  
  useEffect(() => {
    if (!contextMenu) return;
    function handleClick() {
      setContextMenu(null);
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [contextMenu, setContextMenu]);

  return (
    <main
      className={
        embedded
          ? "relative h-[calc(100vh-144px)] w-full overflow-hidden bg-galaxy-canvas"
          : "relative h-screen w-screen overflow-hidden bg-galaxy-canvas"
      }
    >
      <ReactFlow
        nodes={workflow.nodes}
        edges={workflow.edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={connect}
        defaultViewport={workflow.viewport}
        onMoveEnd={(_, viewport) => setViewport(viewport)}
        minZoom={0.18}
        maxZoom={1.6}
        fitView={false}
        snapToGrid
        snapGrid={[8, 8]}
        deleteKeyCode={["Backspace", "Delete"]}
        multiSelectionKeyCode={["Shift", "Meta", "Control"]}
        defaultEdgeOptions={defaultEdgeOptions}
        proOptions={{ hideAttribution: true }}
        onNodeContextMenu={(e, node) => {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id });
        }}
        onEdgeContextMenu={(e, edge) => {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY, edgeId: edge.id });
        }}
        onPaneContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY });
        }}
        onPaneClick={() => setContextMenu(null)}
      >
        <Background variant={BackgroundVariant.Dots} gap={14} size={1} color="#e7e8ee" />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          nodeColor={(n) =>
            n.type === "gemini"
              ? "#ece9ff"
              : n.type === "crop_image"
                ? "#e8f1ff"
                : "#f2f2f3"
          }
          maskColor="rgba(255,255,255,0.72)"
          className="!bottom-4 !right-4 !h-[116px] !w-[156px]"
        />
        <Controls
          showInteractive={false}
          position="bottom-right"
          className="!bottom-[138px] !right-4 !rounded-lg !border !border-gray-200 !shadow-float"
        />
      </ReactFlow>

 
      {!embedded && (
        <header className="absolute left-4 top-4 z-20 flex items-center gap-2">
       
          <button
            className="grid h-8 w-8 place-items-center rounded-md border border-gray-200 bg-white shadow-float transition hover:bg-gray-50"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle sidebar"
          >
            <Columns2 size={14} className="text-gray-600" />
          </button>
          <div className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-2 shadow-float">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onBack ? onBack() : router.push("/dashboard")}
            >
              <ArrowLeft size={15} />
            </Button>
            <div className="min-w-[140px] pr-3 text-xs font-semibold">
              {workflow.name}
            </div>
          </div>
        </header>
      )}

  
      <div className="absolute right-4 top-4 z-20 flex h-9 items-center gap-2">
        <Button size="sm">
          <Clock3 size={14} /> Est. 0.81 M
        </Button>
        <Button size="sm">
          <Save size={14} /> Bal. $364.83 M
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : saved ? (
            <Check size={14} className="text-emerald-500" />
          ) : (
            <Save size={14} />
          )}
          {saving ? "Saving..." : saved ? "Saved" : "Save"}
        </Button>
        <Button
          size="icon"
          variant="primary"
          onClick={() => executeWorkflow("full")}
          disabled={executionState === "running"}
          className={executionState === "running" ? "animate-pulse" : ""}
        >
          <Play size={15} />
        </Button>
        <Button
          size="icon"
          onClick={() => setHistoryOpen(!historyOpen)}
        >
          <PanelRightOpen size={15} />
        </Button>
      </div>

     
      <div className="absolute right-4 top-[52px] z-20 mt-2 flex gap-2">
        <Button
          size="icon"
          title="Export JSON"
          onClick={() => download(workflow.name + ".json", exportJson())}
        >
          <Download size={14} />
        </Button>
        <Button
          size="icon"
          title="Import JSON"
          onClick={() => importRef.current?.click()}
        >
          <FileUp size={14} />
        </Button>
        <input
          ref={importRef}
          type="file"
          accept="application/json"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            importJson(JSON.parse(await file.text()));
          }}
        />
      </div>

      <FloatingToolbar onFit={fit} />
      {sidebarOpen && <ExecutionHistorySidebar onClose={() => setSidebarOpen(false)} />}
      <HistoryPanel />
      <NodePicker />
      <CanvasContextMenu />
    </main>
  );
}

function download(name: string, content: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
function ExecutionHistorySidebar({ onClose }: { onClose: () => void }) {
  const runs = useWorkflowStore((s) => s.runs);
  const [activeTab, setActiveTab] = useState<"ui" | "api">("ui");

  return (
    <aside className="absolute bottom-0 right-0 top-0 z-30 w-[280px] animate-panelIn border-l border-gray-200 bg-white shadow-float">
   
      <div className="flex h-[48px] items-center justify-between border-b border-gray-100 px-4">
        <h2 className="text-[13px] font-semibold text-gray-900">Execution History</h2>
        <button
          className="text-[12px] font-medium text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          Close
        </button>
      </div>

    
      <div className="flex border-b border-gray-100">
        <button
          className={`flex-1 py-2.5 text-center text-[12px] font-medium transition ${
            activeTab === "ui"
              ? "border-b-2 border-gray-900 text-gray-900"
              : "text-gray-400 hover:text-gray-600"
          }`}
          onClick={() => setActiveTab("ui")}
        >
          UI Runs
        </button>
        <button
          className={`flex-1 py-2.5 text-center text-[12px] font-medium transition ${
            activeTab === "api"
              ? "border-b-2 border-gray-900 text-gray-900"
              : "text-gray-400 hover:text-gray-600"
          }`}
          onClick={() => setActiveTab("api")}
        >
          API Runs
        </button>
      </div>
      <div className="flex items-center justify-between border-b border-gray-50 px-4 py-2.5">
        <span className="text-[12px] font-medium text-gray-700">Run history</span>
        <select className="rounded border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-600 outline-none">
          <option>All</option>
          <option>Success</option>
          <option>Failed</option>
        </select>
      </div>
      <div className="galaxy-scrollbar h-[calc(100%-148px)] overflow-y-auto p-3">
        {runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-[12px] italic text-gray-400">
              No runs for this filter yet.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {runs.map((run) => (
              <div
                key={run.id}
                className="rounded-lg border border-gray-200 bg-white p-3"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium capitalize">{run.scope} run</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      run.state === "success"
                        ? "bg-emerald-50 text-emerald-600"
                        : run.state === "failed"
                          ? "bg-red-50 text-red-600"
                          : "bg-gray-50 text-gray-600"
                    }`}
                  >
                    {run.state}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
