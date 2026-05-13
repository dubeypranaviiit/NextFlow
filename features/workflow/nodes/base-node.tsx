"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Check, Clock3, Lock, XCircle } from "lucide-react";
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
        "w-[224px] overflow-hidden rounded-[7px] border border-gray-200 bg-white shadow-node transition",
        node.selected && "ring-2 ring-galaxy-purple/30",
        status === "running" && "animate-pulseGlow border-galaxy-purple/50",
        status === "success" && "border-emerald-200 shadow-[0_12px_28px_rgba(16,185,129,0.10)]",
        status === "failed" && "border-red-200 shadow-[0_12px_28px_rgba(239,68,68,0.10)]",
        className
      )}
    >
      <div className="flex h-[34px] items-center border-b border-gray-100 px-3">
        <h3 className="truncate text-[10px] font-semibold text-gray-800">{node.data.title}</h3>
        <div className="ml-auto flex items-center gap-1.5 text-gray-300">
          {node.data.locked && <Lock size={10} />}
          {status === "running" && <Clock3 size={11} className="text-galaxy-purple" />}
          {status === "success" && <Check size={11} className="text-emerald-500" />}
          {status === "failed" && <XCircle size={11} className="text-red-500" />}
          <span className="rounded bg-[#e8faeb] px-2 py-0.5 text-[9px] font-semibold text-green-600">Run</span>
        </div>
      </div>
      {children}
    </div>
  );
}

export function InputHandle({ id, top, color = "#f5a83c" }: { id: string; top: number; color?: string }) {
  return <Handle id={id} type="target" position={Position.Left} style={{ top, background: color }} />;
}

export function OutputHandle({ id, top, color = "#f5a83c" }: { id: string; top: number; color?: string }) {
  return <Handle id={id} type="source" position={Position.Right} style={{ top, background: color }} />;
}
