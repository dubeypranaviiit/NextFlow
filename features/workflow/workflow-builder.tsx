"use client";

import { useCallback, useMemo, useRef } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
  type NodeTypes
} from "@xyflow/react";
import { ArrowLeft, Clock3, Download, FileUp, PanelRightOpen, Play, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Providers } from "@/components/providers";
import { executeWorkflow } from "@/lib/client-execution";
import { useWorkflowStore } from "@/store/workflow-store";
import { CropImageNode } from "@/features/workflow/nodes/crop-image-node";
import { GeminiNode } from "@/features/workflow/nodes/gemini-node";
import { RequestInputsNode } from "@/features/workflow/nodes/request-inputs-node";
import { ResponseNode } from "@/features/workflow/nodes/response-node";
import { FloatingToolbar } from "@/features/workflow/toolbar/floating-toolbar";
import { HistoryPanel } from "@/features/workflow/panels/history-panel";
import { NodePicker } from "@/features/workflow/panels/node-picker";

const nodeTypes: NodeTypes = {
  request_inputs: RequestInputsNode,
  crop_image: CropImageNode,
  gemini: GeminiNode,
  response: ResponseNode
};

export function WorkflowBuilderPage({ embedded = false }: { embedded?: boolean }) {
  return (
    <Providers>
      <WorkflowBuilderInner embedded={embedded} />
    </Providers>
  );
}

function WorkflowBuilderInner({ embedded }: { embedded: boolean }) {
  const router = useRouter();
  const flow = useReactFlow();
  const importRef = useRef<HTMLInputElement>(null);
  const workflow = useWorkflowStore((state) => state.workflow);
  const onNodesChange = useWorkflowStore((state) => state.onNodesChange);
  const onEdgesChange = useWorkflowStore((state) => state.onEdgesChange);
  const connect = useWorkflowStore((state) => state.connect);
  const setHistoryOpen = useWorkflowStore((state) => state.setHistoryOpen);
  const exportJson = useWorkflowStore((state) => state.exportJson);
  const importJson = useWorkflowStore((state) => state.importJson);

  const defaultEdgeOptions = useMemo(
    () => ({
      type: "smoothstep",
      animated: true,
      style: { strokeWidth: 2.2, stroke: "#f5a83c" }
    }),
    []
  );

  const fit = useCallback(() => flow.fitView({ duration: 320, padding: 0.18 }), [flow]);

  return (
    <main className={embedded ? "relative h-[calc(100vh-144px)] w-full overflow-hidden bg-galaxy-canvas" : "relative h-screen w-screen overflow-hidden bg-galaxy-canvas"}>
      <ReactFlow
        nodes={workflow.nodes}
        edges={workflow.edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={connect}
        defaultViewport={workflow.viewport}
        minZoom={0.18}
        maxZoom={1.6}
        fitView={false}
        snapToGrid
        snapGrid={[8, 8]}
        deleteKeyCode={["Backspace", "Delete"]}
        multiSelectionKeyCode={["Shift", "Meta", "Control"]}
        defaultEdgeOptions={defaultEdgeOptions}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={14} size={1} color="#e7e8ee" />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          nodeColor={(node) => (node.type === "gemini" ? "#ece9ff" : node.type === "crop_image" ? "#e8f1ff" : "#f2f2f3")}
          maskColor="rgba(255,255,255,0.72)"
          className="!bottom-4 !right-4 !h-[116px] !w-[156px]"
        />
        <Controls showInteractive={false} position="bottom-right" className="!bottom-[138px] !right-4 !rounded-lg !border !border-gray-200 !shadow-float" />
      </ReactFlow>

      {!embedded && (
        <header className="absolute left-4 top-4 z-20 flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-2 shadow-float">
          <Button size="icon" variant="ghost" onClick={() => router.push("/dashboard")}>
            <ArrowLeft size={15} />
          </Button>
          <div className="min-w-[140px] pr-3 text-xs font-semibold">{workflow.name}</div>
        </header>
      )}

      <div className="absolute right-4 top-4 z-20 flex h-9 items-center gap-2">
        <Button size="sm">
          <Clock3 size={14} /> Est. 0.81 M
        </Button>
        <Button size="sm">
          <Save size={14} /> Bal. $364.83 M
        </Button>
        <Button size="icon" variant="primary" onClick={() => executeWorkflow("full")}>
          <Play size={15} />
        </Button>
        <Button size="icon" onClick={() => setHistoryOpen(true)}>
          <PanelRightOpen size={15} />
        </Button>
      </div>

      <div className="absolute right-[360px] top-4 z-20 flex gap-2">
        <Button size="icon" title="Export JSON" onClick={() => download(workflow.name + ".json", exportJson())}>
          <Download size={14} />
        </Button>
        <Button size="icon" title="Import JSON" onClick={() => importRef.current?.click()}>
          <FileUp size={14} />
        </Button>
        <input
          ref={importRef}
          type="file"
          accept="application/json"
          hidden
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            importJson(JSON.parse(await file.text()));
          }}
        />
      </div>

      <FloatingToolbar onFit={fit} />
      <HistoryPanel />
      <NodePicker />
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
