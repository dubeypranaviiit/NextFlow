"use client";

import type { NodeProps } from "@xyflow/react";
import { Input } from "@/components/ui/input";
import { BaseNode, InputHandle, OutputHandle } from "@/features/workflow/nodes/base-node";
import type { WorkflowNode } from "@/types/workflow";

export function CropImageNode(props: NodeProps<WorkflowNode>) {
  return (
    <BaseNode node={props}>
      <div className="space-y-2 p-3">
        {props.data.inputs?.map((input, index) => (
          <div key={input.id} className="relative flex h-[26px] items-center gap-2 rounded bg-[#f7f7f8] px-2">
            <span className="w-[82px] truncate text-[9px] text-gray-600">{input.label}</span>
            <Input
              value={input.connected ? "Connected" : String(input.value ?? "")}
              readOnly
              disabled={input.connected}
              className="h-5 flex-1 rounded border-gray-100 px-2 text-[9px]"
            />
            <InputHandle id={input.id} top={49 + index * 34} color={input.type === "image" ? "#80aefb" : "#f43f8f"} />
          </div>
        ))}
        <div className="mt-2 h-[48px] rounded-md border border-gray-100 bg-[#fbfbfc] px-2 py-4 text-center text-[9px] text-gray-400">
          No output yet
        </div>
        <OutputHandle id="output_image" top={225} color="#80aefb" />
      </div>
    </BaseNode>
  );
}
