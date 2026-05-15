"use client";

import { useState, useRef, useEffect } from "react";
import { useUpdateNodeInternals, type NodeProps } from "@xyflow/react";
import { Check, ChevronDown, ChevronUp, Info, Loader2, MoreHorizontal, Play, RefreshCw, Sparkles, Zap } from "lucide-react";
import { Textarea } from "@/components/ui/input";
import { BaseNode, InputHandle, OutputHandle } from "@/features/workflow/nodes/base-node";
import { cn } from "@/lib/utils";
import { executeWorkflow } from "@/lib/client-execution";
import { resolveInputImageUrls } from "@/lib/workflow-images";
import { useWorkflowStore } from "@/store/workflow-store";
import type { WorkflowNode } from "@/types/workflow";

const GEMINI_MODELS = [ 
   { id:  "gemini-1.5-flash", label: "Gemini 1.5 Flash", description: "Fast and efficient", icon: Zap, color: "#f59e0b" },
   {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    description: "Fast and efficient",
    icon: Zap,
    color: "#f59e0b"
  },
  { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", description: "Advanced reasoning", icon: Sparkles, color: "#8b5cf6" },
] as const;
 
const inputHandleColors: Record<string, string> = {
  prompt: "#f5a83c",
  system_prompt: "#f5a83c",
  image: "#80aefb",
  video: "#34d399",
  audio: "#a78bfa",
  file: "#94a3b8"
};

export function GeminiNode(props: NodeProps<WorkflowNode>) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const status = props.data.status ?? "idle";
  const isRunning = status === "running";
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const deleteNode = useWorkflowStore((s) => s.deleteNode);
  const workflow = useWorkflowStore((s) => s.workflow);
  const updateNodeInternals = useUpdateNodeInternals();
  const currentModel = props.data.model ?? "gemini-2.5-flash";
  const currentModelConfig = GEMINI_MODELS.find((m) => m.id === currentModel) ?? GEMINI_MODELS[0];

  useEffect(() => {
    if (!modelDropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [modelDropdownOpen]);

  useEffect(() => {
    updateNodeInternals(props.id);
  }, [props.id, props.data.inputs?.length, settingsOpen, updateNodeInternals]);
  const baseInputsY = 132;
  const inputCount = props.data.inputs?.length ?? 0;
  const inputsHeight = inputCount * 33;
  const settingsHeight = settingsOpen ? 80 : 28;
  const outputBoxTop = baseInputsY + inputsHeight + settingsHeight + 12;
  const outputHandleTop = outputBoxTop + 30;

  return (
    <BaseNode node={props} className="w-[238px]">
      <div className="space-y-2 p-3">
     
        <div className="flex items-center gap-1">
          <div className="relative flex-1" ref={modelDropdownRef}>
            <button
              className="flex h-7 w-full items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 text-[9px] font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
              onClick={(e) => {
                e.stopPropagation();
                setModelDropdownOpen(!modelDropdownOpen);
              }}
            >
              <currentModelConfig.icon size={10} style={{ color: currentModelConfig.color }} />
              {currentModel}
              <ChevronDown
                size={10}
                className={cn(
                  "ml-auto text-gray-400 transition-transform",
                  modelDropdownOpen && "rotate-180"
                )}
              />
            </button>
            {modelDropdownOpen && (
              <div className="absolute left-0 top-8 z-50 w-[200px] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                <div className="px-2 py-1.5 text-[8px] font-semibold uppercase tracking-wider text-gray-400">Select Model</div>
                {GEMINI_MODELS.map((model) => {
                  const ModelIcon = model.icon;
                  const isActive = currentModel === model.id;
                  return (
                    <button
                      key={model.id}
                      className={cn(
                        "flex w-full items-center gap-2 px-2 py-1.5 text-left transition-colors hover:bg-gray-50",
                        isActive && "bg-purple-50"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateNodeData(props.id, { model: model.id, title: model.label });
                        setModelDropdownOpen(false);
                      }}
                    >
                      <span
                        className="grid h-5 w-5 place-items-center rounded"
                        style={{ backgroundColor: model.color + "18" }}
                      >
                        <ModelIcon size={10} style={{ color: model.color }} />
                      </span>
                      <span className="flex-1">
                        <span className="block text-[9px] font-medium text-gray-700">{model.label}</span>
                        <span className="block text-[7px] text-gray-400">{model.description}</span>
                      </span>
                      {isActive && <Check size={10} className="text-purple-500" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex items-center gap-0.5">
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

    
        <div>
          <div className="mb-1 flex items-center text-[9px]">
            <span className="font-medium text-[#f5a83c]">Prompt*</span>
            <span className="ml-1 text-gray-400">
              <Info size={8} />
            </span>
          </div>
          {props.data.inputs?.find((i) => i.id === "prompt")?.connected ? (
            <div className="flex h-[30px] items-center rounded-md border border-gray-200 bg-gray-50 px-2 text-[9px] font-medium text-galaxy-purple">
              ← Connected
            </div>
          ) : (
            <Textarea
              value={props.data.prompt ?? ""}
              onChange={(e) => updateNodeData(props.id, { prompt: e.target.value })}
              className="min-h-[30px] bg-[#fbfbfc] text-[9px] leading-4"
              placeholder="Enter your prompt..."
            />
          )}
        </div>

     
        <div>
          <div className="mb-1 text-[9px] font-medium text-gray-500">System Prompt</div>
          {props.data.inputs?.find((i) => i.id === "system_prompt")?.connected ? (
            <div className="flex h-[30px] items-center rounded-md border border-gray-200 bg-gray-50 px-2 text-[9px] font-medium text-galaxy-purple">
              ← Connected
            </div>
          ) : (
            <Textarea
              value={props.data.systemPrompt ?? ""}
              onChange={(e) => updateNodeData(props.id, { systemPrompt: e.target.value })}
              className="min-h-[48px] bg-[#fbfbfc] text-[9px] leading-4"
              placeholder="Write Prompt..."
            />
          )}
        </div>

        {props.data.inputs?.map((input, index) => {
          const color = inputHandleColors[input.id] ?? "#94a3b8";
          const imageUrls = input.id === "image"
            ? resolveInputImageUrls(workflow, props.id, input.id)
            : [];
          return (
            <div
              key={input.id}
              className="relative flex h-[25px] items-center gap-2 rounded bg-[#f7f7f8] px-2"
            >
              <span
                className="w-[80px] truncate text-[9px] font-medium"
                style={{ color }}
              >
                {input.label}
              </span>
              <div className="flex flex-1 items-center justify-end gap-1 overflow-hidden">
                {imageUrls.slice(0, 3).map((imageUrl, imageIndex) => (
                  <img
                    key={`${imageUrl}-${imageIndex}`}
                    src={imageUrl}
                    alt=""
                    className="h-[22px] w-[28px] rounded border border-white bg-gray-950 object-cover shadow-sm"
                  />
                ))}
                {imageUrls.length > 3 && (
                  <span className="text-[8px] font-medium text-gray-400">+{imageUrls.length - 3}</span>
                )}
                <span
                  className={cn(
                    "min-w-0 truncate text-right text-[9px]",
                    input.connected
                      ? "font-medium text-galaxy-purple"
                      : "text-gray-400"
                  )}
                >
                  {input.connected
                    ? "Connected"
                    : typeof input.value === "string" && input.value.length > 20
                      ? input.value.slice(0, 20) + "..."
                      : String(input.value ?? "")}
                </span>
              </div>
              <InputHandle
                id={input.id}
                top={baseInputsY + index * 33}
                color={color}
              />
            </div>
          );
        })}


        <button
          className="flex h-7 w-full items-center justify-between rounded-md bg-[#fbfbfc] px-2 text-[9px] text-gray-400 hover:bg-gray-100"
          onClick={() => setSettingsOpen(!settingsOpen)}
        >
          Settings
          {settingsOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
        {settingsOpen && (
          <div className="space-y-1.5 rounded-md border border-gray-100 bg-[#fbfbfc] p-2">
            <SettingsRow label="Temperature" value="0.7" />
            <SettingsRow label="Max tokens" value="4096" />
            <SettingsRow label="Top P" value="1.0" />
          </div>
        )}

     
        <div className="min-h-[46px] rounded-md border border-gray-100 bg-[#fbfbfc] p-2 text-[9px] leading-4 text-gray-500">
          {isRunning ? (
            <div className="flex items-center gap-2 text-galaxy-purple">
              <Loader2 size={10} className="animate-spin" />
              Generating response...
            </div>
          ) : props.data.response ? (
            <p className="line-clamp-4">{props.data.response}</p>
          ) : (
            "No output yet"
          )}
        </div>
        <OutputHandle id="response" top={outputHandleTop} color="#f5a83c" />
      </div>
    </BaseNode>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[8px]">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-700">{value}</span>
    </div>
  );
}
