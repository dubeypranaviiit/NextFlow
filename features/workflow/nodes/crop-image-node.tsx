"use client";

import { useState } from "react";
import type { NodeProps } from "@xyflow/react";
import { Info, Loader2, MoreHorizontal, Play, RefreshCw } from "lucide-react";
import { BaseNode, InputHandle, OutputHandle } from "@/features/workflow/nodes/base-node";
import { cn } from "@/lib/utils";
import { executeWorkflow } from "@/lib/client-execution";
import { useWorkflowStore } from "@/store/workflow-store";
import type { WorkflowNode } from "@/types/workflow";

const colorMap: Record<string, string> = {
  "Input Image": "#80aefb",
  "X Position %": "#ef4444",
  "Y Position %": "#ef4444",
  "Width %": "#22c55e",
  "Height %": "#22c55e"
};

const handleColorMap: Record<string, string> = {
  "Input Image": "#80aefb",
  "X Position %": "#ef4444",
  "Y Position %": "#ef4444",
  "Width %": "#22c55e",
  "Height %": "#22c55e"
};

export function CropImageNode(props: NodeProps<WorkflowNode>) {
  const [menuOpen, setMenuOpen] = useState(false);
  const status = props.data.status ?? "idle";
  const isRunning = status === "running";
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const deleteNode = useWorkflowStore((s) => s.deleteNode);

  return (
    <BaseNode node={props}>
      <div className="space-y-1.5 p-3">
       
        <div className="flex items-center justify-end gap-0.5 -mt-1 mb-1">
          <button
            className="grid h-5 w-5 place-items-center rounded text-gray-400 hover:text-gray-600"
            title="Info"
          >
            <Info size={10} />
          </button>
          <button
            className="grid h-5 w-5 place-items-center rounded text-gray-400 hover:text-gray-600"
            title="Refresh"
          >
            <RefreshCw size={10} />
          </button>
          <button
            className="flex h-[22px] items-center gap-1 rounded bg-[#e8faeb] px-2 text-[9px] font-semibold text-green-600 hover:bg-green-100"
            onClick={(e) => {
              e.stopPropagation();
              executeWorkflow("single", [props.id]);
            }}
          >
            <Play size={8} fill="currentColor" /> Run
          </button>
          <button
            className="grid h-5 w-5 place-items-center rounded text-gray-400 hover:text-gray-600"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
          >
            <MoreHorizontal size={12} />
          </button>
        </div>

     
        {menuOpen && (
          <div
            className="absolute right-2 top-10 z-50 w-[180px] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-float"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="flex h-8 w-full items-center px-3 text-[12px] text-gray-700 hover:bg-gray-50"
              onClick={() => setMenuOpen(false)}
            >
              Duplicate
            </button>
            <button
              className="flex h-8 w-full items-center px-3 text-[12px] text-gray-700 hover:bg-gray-50"
              onClick={() => setMenuOpen(false)}
            >
              Duplicate with Edges
            </button>
            <div className="my-1 border-t border-gray-100" />
            <button
              className="flex h-8 w-full items-center px-3 text-[12px] text-gray-700 hover:bg-gray-50"
              onClick={() => {
                updateNodeData(props.id, { locked: !props.data.locked });
                setMenuOpen(false);
              }}
            >
              {props.data.locked ? "Unlock" : "Lock"}
            </button>
            <div className="my-1 border-t border-gray-100" />
            <button
              className="flex h-8 w-full items-center px-3 text-[12px] text-red-500 hover:bg-red-50"
              onClick={() => {
                deleteNode(props.id);
                setMenuOpen(false);
              }}
            >
              Delete
            </button>
          </div>
        )}

        {props.data.inputs?.map((input, index) => {
          const labelColor = colorMap[input.label] ?? "#6b7280";
          const isNumber = input.type === "number";
          const value = input.connected ? "Connected" : String(input.value ?? "");

          return (
            <div
              key={input.id}
              className="relative flex h-[26px] items-center gap-2 rounded bg-[#f7f7f8] px-2"
            >
              <span
                className="w-[82px] truncate text-[9px] font-medium"
                style={{ color: labelColor }}
              >
                {input.label}
              </span>

              {isNumber ? (
               
                <div className="flex flex-1 items-center gap-1.5">
                  <div className="relative h-[6px] flex-1 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        width: `${Math.min(Number(input.value ?? 0), 100)}%`,
                        backgroundColor: labelColor
                      }}
                    />
                  </div>
                  <span className="w-[26px] text-right text-[9px] font-semibold text-gray-700">
                    {input.value}
                  </span>
                </div>
              ) : (
                <span
                  className={cn(
                    "flex-1 truncate text-right text-[9px]",
                    input.connected
                      ? "font-medium text-galaxy-purple"
                      : "text-gray-500"
                  )}
                >
                  {value}
                </span>
              )}

              <InputHandle
                id={input.id}
                top={48 + index * 34}
                color={handleColorMap[input.label] ?? "#f43f8f"}
              />
            </div>
          );
        })}

      
        <div className="mt-2 rounded-md border border-gray-100 bg-[#fbfbfc] px-2 py-3 text-center text-[9px] text-gray-400">
          {isRunning ? (
            <span className="flex items-center justify-center gap-2 text-galaxy-purple">
              <Loader2 size={10} className="animate-spin" />
              Cropping image...
            </span>
          ) : status === "success" ? (
            <span className="text-emerald-500">✓ Image cropped</span>
          ) : (
            "No output yet"
          )}
        </div>
        <OutputHandle id="output_image" top={248} color="#80aefb" />
      </div>
    </BaseNode>
  );
}
