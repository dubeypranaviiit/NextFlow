"use client";

import { useCallback } from "react";
import type { NodeProps } from "@xyflow/react";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/input";
import { BaseNode, OutputHandle } from "@/features/workflow/nodes/base-node";
import { useWorkflowStore } from "@/store/workflow-store";
import type { WorkflowNode } from "@/types/workflow";

export function RequestInputsNode(props: NodeProps<WorkflowNode>) {
  const updateNodeField = useWorkflowStore((s) => s.updateNodeField);
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);

  const addField = useCallback(() => {
    const fields = props.data.fields ?? [];
    const id = `field_${Date.now()}`;
    const newField = { id, label: `field_${fields.length + 1}`, kind: "text_field" as const, value: "" };
    const newOutput = { id, label: `field_${fields.length + 1}`, type: "text" as const };
    updateNodeData(props.id, {
      fields: [...fields, newField],
      outputs: [...(props.data.outputs ?? []), newOutput]
    });
  }, [props.id, props.data.fields, props.data.outputs, updateNodeData]);

  return (
    <BaseNode node={props}>
      <div className="space-y-2 p-3">
        {props.data.fields?.map((field, index) => (
          <div key={field.id} className="relative rounded-md border border-gray-100 bg-[#fbfbfc] p-2">
            <div className="mb-1 flex items-center text-[9px] font-medium text-gray-500">
              <span className="flex-1 truncate">{field.label}</span>
              <span className="text-[8px] text-gray-400">
                {field.kind === "text_field" ? "Text" : "Image"}
              </span>
            </div>
            {field.kind === "text_field" ? (
              <Textarea
                value={field.value}
                onChange={(e) => updateNodeField(props.id, field.id, e.target.value)}
                className="min-h-[58px] bg-white text-[9px] leading-4"
                placeholder={`Enter ${field.label}...`}
              />
            ) : (
              <div className="flex h-[42px] items-center gap-2 rounded-md border border-dashed border-gray-200 bg-white px-2 text-[9px] text-gray-500">
                {field.imageUrl ? (
                  <img
                    src={field.imageUrl}
                    alt=""
                    className="h-8 w-8 rounded object-cover"
                  />
                ) : (
                  <ImagePlus size={13} />
                )}
                {field.imageUrl ? "Image uploaded" : "Upload image"}
              </div>
            )}
            <OutputHandle
              id={field.id}
              top={76 + index * 84}
              color={field.kind === "image_field" ? "#80aefb" : "#f5a83c"}
            />
          </div>
        ))}
        <button
          className="flex h-7 w-full items-center justify-center gap-1 rounded-md border border-gray-200 bg-white text-[9px] text-gray-500 transition hover:bg-gray-50"
          onClick={addField}
        >
          <Plus size={11} /> Add field
        </button>
      </div>
    </BaseNode>
  );
}
