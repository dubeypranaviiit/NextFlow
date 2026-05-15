"use client";

import { useEffect, useState } from "react";
import { useUpdateNodeInternals, type NodeProps } from "@xyflow/react";
import { Info, Loader2, MoreHorizontal, Play, RefreshCw } from "lucide-react";
import { BaseNode, InputHandle, OutputHandle } from "@/features/workflow/nodes/base-node";
import { cn } from "@/lib/utils";
import { executeWorkflow } from "@/lib/client-execution";
import { resolveInputImageUrls, resolveOutputImageUrls } from "@/lib/workflow-images";
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
  const updateNodeInternals = useUpdateNodeInternals();
  const workflow = useWorkflowStore((s) => s.workflow);
  const currentNode = workflow.nodes.find((node) => node.id === props.id);
  const inputPreviewUrl = resolveInputImageUrls(workflow, props.id, "input_image")[0];
  const outputPreviewUrl = currentNode
    ? resolveOutputImageUrls(workflow, currentNode, "output_image")[0]
    : undefined;

  useEffect(() => {
    updateNodeInternals(props.id);
  }, [props.id, inputPreviewUrl, outputPreviewUrl, updateNodeInternals]);

  const updateInputValue = (inputId: string, rawValue: string) => {
    const value = clampPercent(rawValue);
    updateNodeData(props.id, {
      inputs: props.data.inputs?.map((input) =>
        input.id === inputId ? { ...input, value } : input
      )
    });
  };

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
              className={cn(
                "relative flex h-[30px] items-center gap-2 rounded bg-[#f7f7f8] px-2",
                input.connected && "bg-gray-100"
              )}
            >
              <span
                className="w-[82px] truncate text-[9px] font-medium"
                style={{ color: labelColor }}
              >
                {input.label}
              </span>

              {isNumber ? (
                <div className="flex flex-1 items-center gap-1.5">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Number(input.value ?? 0)}
                    disabled={input.connected}
                    className="h-1.5 flex-1 accent-gray-800 disabled:opacity-40"
                    onChange={(e) => updateInputValue(input.id, e.target.value)}
                    onPointerDown={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={Number(input.value ?? 0)}
                    disabled={input.connected}
                    className="nodrag h-5 w-[34px] rounded border border-gray-200 bg-white px-1 text-right text-[9px] font-semibold text-gray-700 outline-none focus:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                    onChange={(e) => updateInputValue(input.id, e.target.value)}
                    onPointerDown={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                  {input.connected && (
                    <span
                      className="w-[52px] truncate text-right text-[9px] font-medium text-galaxy-purple"
                      title="Connected input"
                    >
                      Connected
                    </span>
                  )}
                  {!input.connected && (
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: labelColor }}
                    />
                  )}
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-end gap-1.5 overflow-hidden">
                  {input.id === "input_image" && inputPreviewUrl && (
                    <img
                      src={inputPreviewUrl}
                      alt=""
                      className="h-6 w-8 rounded border border-white object-cover shadow-sm"
                    />
                  )}
                  <span
                    className={cn(
                      "truncate text-right text-[9px]",
                      input.connected
                        ? "font-medium text-galaxy-purple"
                        : "text-gray-500"
                    )}
                  >
                    {value}
                  </span>
                </div>
              )}

              <InputHandle
                id={input.id}
                top={48 + index * 34}
                color={handleColorMap[input.label] ?? "#f43f8f"}
              />
            </div>
          );
        })}

        {(inputPreviewUrl || outputPreviewUrl) && (
          <div className="grid grid-cols-2 gap-1.5">
            <ImagePreview title="Input image" imageUrl={inputPreviewUrl} />
            <ImagePreview title="Output image" imageUrl={outputPreviewUrl} />
          </div>
        )}

      
        <div className="mt-2 rounded-md border border-gray-100 bg-[#fbfbfc] px-2 py-3 text-center text-[9px] text-gray-400">
          {isRunning ? (
            <span className="flex items-center justify-center gap-2 text-galaxy-purple">
              <Loader2 size={10} className="animate-spin" />
              Cropping image...
            </span>
          ) : outputPreviewUrl ? (
            <span className="text-emerald-500">Image ready</span>
          ) : (
            "No output yet"
          )}
        </div>
        <OutputHandle id="output_image" top={inputPreviewUrl || outputPreviewUrl ? 330 : 248} color="#80aefb" />
      </div>
    </BaseNode>
  );
}

function ImagePreview({ title, imageUrl }: { title: string; imageUrl?: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-gray-100 bg-[#fbfbfc]">
      <div className="px-2 py-1 text-[8px] font-medium text-gray-400">{title}</div>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="h-[58px] w-full bg-gray-950 object-contain"
        />
      ) : (
        <div className="grid h-[58px] place-items-center text-[8px] text-gray-300">Waiting</div>
      )}
    </div>
  );
}

function clampPercent(value: string) {
  const number = Number(value);
  if (Number.isNaN(number)) return 0;
  return Math.min(100, Math.max(0, number));
}
