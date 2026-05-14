"use client";

import { Pencil } from "lucide-react";
import {
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlow,
  type NodeTypes,
} from "@xyflow/react";
import { Providers } from "@/components/providers";
import { useWorkflowStore } from "@/store/workflow-store";
import { CropImageNode } from "@/features/workflow/nodes/crop-image-node";
import { GeminiNode } from "@/features/workflow/nodes/gemini-node";
import { GroqNode } from "@/features/workflow/nodes/groq-node";
import { RequestInputsNode } from "@/features/workflow/nodes/request-inputs-node";
import { ResponseNode } from "@/features/workflow/nodes/response-node";

const nodeTypes: NodeTypes = {
  request_inputs: RequestInputsNode,
  crop_image: CropImageNode,
  gemini: GeminiNode,
  groq: GroqNode,
  response: ResponseNode,
};

export function WorkflowTab({
  onEditWorkflow,
}: {
  onEditWorkflow: () => void;
}) {
  return (
    <Providers>
      <WorkflowTabInner onEditWorkflow={onEditWorkflow} />
    </Providers>
  );
}

function WorkflowTabInner({ onEditWorkflow }: { onEditWorkflow: () => void }) {
  const workflow = useWorkflowStore((s) => s.workflow);

  return (
    <div className="min-h-[calc(100vh-144px)] bg-white">
      {/* Header row */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <h2 className="text-[15px] font-semibold text-gray-900">
          Workflow Structure
        </h2>
        <button
          className="flex h-8 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-[12px] font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          onClick={onEditWorkflow}
        >
          <Pencil size={12} />
          Edit Workflow
        </button>
      </div>

    
      <div className="relative h-[calc(100vh-210px)] w-full bg-galaxy-canvas">
        <ReactFlow
          nodes={workflow.nodes}
          edges={workflow.edges}
          nodeTypes={nodeTypes}
          defaultViewport={workflow.viewport}
          minZoom={0.15}
          maxZoom={1.2}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag
          zoomOnScroll
          preventScrolling
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            type: "smoothstep",
            animated: true,
            style: { strokeWidth: 2.2, stroke: "#f5a83c" },
          }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={14}
            size={1}
            color="#e7e8ee"
          />
          <MiniMap
            position="bottom-right"
            pannable
            zoomable
            nodeColor={(n) =>
              n.type === "gemini"
                ? "#ece9ff"
                : n.type === "groq"
                  ? "#fff3e6"
                  : n.type === "crop_image"
                    ? "#e8f1ff"
                    : "#f2f2f3"
            }
            maskColor="rgba(255,255,255,0.72)"
            className="!bottom-4 !right-4 !h-[100px] !w-[140px] !rounded-lg !border !border-gray-200 !bg-white"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
