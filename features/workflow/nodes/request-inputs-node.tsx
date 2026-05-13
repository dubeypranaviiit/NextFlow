"use client";

import type { NodeProps } from "@xyflow/react";
import { ImagePlus, Plus } from "lucide-react";
import { Textarea } from "@/components/ui/input";
import { BaseNode, OutputHandle } from "@/features/workflow/nodes/base-node";
import type { WorkflowNode } from "@/types/workflow";

export function RequestInputsNode(props: NodeProps<WorkflowNode>) {
  return (
    <BaseNode node={props}>
      <div className="space-y-2 p-3">
        {props.data.fields?.map((field, index) => (
          <div key={field.id} className="relative rounded-md border border-gray-100 bg-[#fbfbfc] p-2">
            <div className="mb-1 text-[9px] font-medium text-gray-500">{field.label}</div>
            {field.kind === "text_field" ? (
              <Textarea value={field.value} readOnly className="min-h-[58px] bg-white text-[9px] leading-4" />
            ) : (
              <div className="flex h-[42px] items-center gap-2 rounded-md border border-dashed border-gray-200 bg-white px-2 text-[9px] text-gray-500">
                {field.imageUrl ? <img src={field.imageUrl} alt="" className="h-8 w-8 rounded object-cover" /> : <ImagePlus size={13} />}
                Upload image
              </div>
            )}
            <OutputHandle id={field.id} top={76 + index * 84} color={field.kind === "image_field" ? "#80aefb" : "#f5a83c"} />
          </div>
        ))}
        <button className="flex h-7 w-full items-center justify-center gap-1 rounded-md border border-gray-200 bg-white text-[9px] text-gray-500">
          <Plus size={11} /> Add field
        </button>
      </div>
    </BaseNode>
  );
}
