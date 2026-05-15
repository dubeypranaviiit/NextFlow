"use client";

import type { NodeProps } from "@xyflow/react";
import { CheckCircle, Loader2 } from "lucide-react";
import { BaseNode, InputHandle } from "@/features/workflow/nodes/base-node";
import type { WorkflowNode } from "@/types/workflow";

export function ResponseNode(props: NodeProps<WorkflowNode>) {
  const status = props.data.status ?? "idle";
  const hasResponse = props.data.response && status === "success";

  return (
    <BaseNode node={props} className="w-[178px]">
      <div className="p-3">
        <div className="relative h-[38px] rounded bg-[#f7f7f8] px-3 py-3 text-[9px] text-gray-500">
          result
          <InputHandle id="result" color="#7c3aed" />
        </div>
        <div className="mt-3 min-h-[28px] rounded-md border border-gray-100 bg-[#fbfbfc] px-2 py-2 text-[9px] text-gray-400">
          {status === "running" ? (
            <span className="flex items-center gap-1.5 text-galaxy-purple">
              <Loader2 size={10} className="animate-spin" />
              Waiting...
            </span>
          ) : hasResponse ? (
            <div>
              <div className="mb-1 flex items-center gap-1 text-emerald-500">
                <CheckCircle size={9} /> Captured
              </div>
              <p className="line-clamp-3 text-[8px] leading-3 text-gray-500">
                {props.data.response}
              </p>
            </div>
          ) : (
            <span className="text-center block">No output yet</span>
          )}
        </div>
      </div>
    </BaseNode>
  );
}
