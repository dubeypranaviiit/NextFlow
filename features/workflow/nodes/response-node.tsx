"use client";

import type { NodeProps } from "@xyflow/react";
import { BaseNode, InputHandle } from "@/features/workflow/nodes/base-node";
import type { WorkflowNode } from "@/types/workflow";

export function ResponseNode(props: NodeProps<WorkflowNode>) {
  return (
    <BaseNode node={props} className="w-[178px]">
      <div className="p-3">
        <div className="relative h-[38px] rounded bg-[#f7f7f8] px-3 py-3 text-[9px] text-gray-500">
          result
          <InputHandle id="result" top={53} color="#7c3aed" />
        </div>
        <div className="mt-3 min-h-[28px] rounded-md border border-gray-100 bg-[#fbfbfc] px-2 py-2 text-center text-[9px] text-gray-400">
          No output yet
        </div>
      </div>
    </BaseNode>
  );
}
