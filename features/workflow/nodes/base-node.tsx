"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Check, Clock3, Loader2, Lock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowNode } from "@/types/workflow";

export function BaseNode({
  node,
  children,
  className
}: {
  node: NodeProps<WorkflowNode>;
  children: React.ReactNode;
  className?: string;
}) {
  const status = node.data.status ?? "idle";
  return (
    <div
      className={cn(
        "w-[224px] overflow-visible rounded-[7px] border border-gray-200 bg-white shadow-node transition-all duration-200",
        node.selected && "ring-2 ring-galaxy-purple/30",
        status === "queued" && "border-amber-200 shadow-[0_12px_28px_rgba(245,158,11,0.10)]",
        status === "running" && "animate-pulseGlow border-galaxy-purple/50",
        status === "success" && "border-emerald-200 shadow-[0_12px_28px_rgba(16,185,129,0.10)]",
        status === "failed" && "border-red-200 shadow-[0_12px_28px_rgba(239,68,68,0.10)]",
        "hover:shadow-[0_16px_36px_rgba(16,16,20,0.14)]",
        className
      )}
    >
     
      <div
        className={cn(
          "flex h-[34px] items-center border-b border-gray-100 px-3",
          status === "queued" && "bg-amber-50/40",
          status === "running" && "bg-galaxy-purple/[0.03]",
          status === "success" && "bg-emerald-50/40",
          status === "failed" && "bg-red-50/40"
        )}
      >
        <h3 className="truncate text-[10px] font-semibold text-gray-800">
          {node.data.title}
        </h3>
        {node.data.locked && (
          <Lock size={9} className="ml-1.5 flex-shrink-0 text-gray-300" />
        )}
        <div className="ml-auto flex items-center gap-1.5">
       
          {status === "running" && (
            <Loader2 size={11} className="animate-spin text-galaxy-purple" />
          )}
          {status === "queued" && (
            <Clock3 size={11} className="text-amber-500" />
          )}
          {status === "success" && (
            <Check size={11} className="text-emerald-500" />
          )}
          {status === "failed" && (
            <XCircle size={11} className="text-red-500" />
          )}
          <span
            className={cn(
              "rounded px-2 py-0.5 text-[9px] font-semibold",
              status === "running"
                ? "bg-purple-50 text-galaxy-purple"
                : status === "queued"
                  ? "bg-amber-50 text-amber-600"
                : status === "failed"
                  ? "bg-red-50 text-red-500"
                  : "bg-[#e8faeb] text-green-600"
            )}
          >
            {status === "running"
              ? "Running"
              : status === "queued"
                ? "Queued"
                : status === "failed"
                  ? "Error"
                  : "Run"}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}

export function InputHandle({
  id,
  top,
  color = "#f5a83c"
}: {
  id: string;
  top?: number;
  color?: string;
}) {
  return (
    <Handle
      id={id}
      type="target"
      position={Position.Left}
      style={{ top: top ?? "50%", background: color }}
    />
  );
}

export function OutputHandle({
  id,
  top,
  color = "#f5a83c"
}: {
  id: string;
  top?: number;
  color?: string;
}) {
  return (
    <Handle
      id={id}
      type="source"
      position={Position.Right}
      style={{ top: top ?? "50%", background: color }}
    />
  );
}
