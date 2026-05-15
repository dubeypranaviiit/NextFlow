"use client";

import { useCallback, useEffect } from "react";
import { useUpdateNodeInternals, type NodeProps } from "@xyflow/react";
import { ImagePlus, Plus, Type } from "lucide-react";
import { Textarea } from "@/components/ui/input";
import { BaseNode, OutputHandle } from "@/features/workflow/nodes/base-node";
import { useWorkflowStore } from "@/store/workflow-store";
import type { FieldKind, WorkflowNode } from "@/types/workflow";

export function RequestInputsNode(props: NodeProps<WorkflowNode>) {
  const updateNodeField = useWorkflowStore((s) => s.updateNodeField);
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    updateNodeInternals(props.id);
  }, [props.id, props.data.fields?.length, updateNodeInternals]);

  const addField = useCallback((kind: FieldKind) => {
    const fields = props.data.fields ?? [];
    const sameKindCount = fields.filter((field) => field.kind === kind).length + 1;
    const id = `${kind}_${sameKindCount}`;
    const label = sameKindCount === 1 ? kind : `${kind}_${sameKindCount}`;
    const newField = { id, label, kind, value: "" };
    const newOutput = {
      id,
      label,
      type: kind === "image_field" ? ("image" as const) : ("text" as const)
    };
    updateNodeData(props.id, {
      fields: [...fields, newField],
      outputs: [...(props.data.outputs ?? []), newOutput]
    });
  }, [props.id, props.data.fields, props.data.outputs, updateNodeData]);

  const renameField = useCallback((fieldId: string, label: string) => {
    updateNodeData(props.id, {
      fields: props.data.fields?.map((field) =>
        field.id === fieldId ? { ...field, label } : field
      ),
      outputs: props.data.outputs?.map((output) =>
        output.id === fieldId ? { ...output, label } : output
      )
    });
  }, [props.id, props.data.fields, props.data.outputs, updateNodeData]);

  const updateImageField = useCallback((fieldId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = String(reader.result ?? "");
      updateNodeData(props.id, {
        fields: props.data.fields?.map((field) =>
          field.id === fieldId ? { ...field, value: file.name, imageUrl } : field
        )
      });
    };
    reader.readAsDataURL(file);

    const form = new FormData();
    form.append("file", file);
    fetch("/api/transloadit/upload", {
      method: "POST",
      body: form
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Upload failed");
        return data.url as string;
      })
      .then((imageUrl) => {
        updateNodeData(props.id, {
          fields: props.data.fields?.map((field) =>
            field.id === fieldId ? { ...field, value: file.name, imageUrl } : field
          )
        });
      })
      .catch(() => {
      
      });
  }, [props.id, props.data.fields, updateNodeData]);

  return (
    <BaseNode node={props}>
      <div className="space-y-2 p-3">
        {props.data.fields?.map((field, index) => (
          <div key={field.id} className="relative rounded-md border border-gray-100 bg-[#fbfbfc] p-2">
            <div className="mb-1 flex items-center gap-1 text-[9px] font-medium text-gray-500">
              <input
                className="min-w-0 flex-1 bg-transparent outline-none"
                value={field.label}
                onChange={(e) => renameField(field.id, e.target.value)}
                aria-label={`Rename ${field.label}`}
              />
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
              <label className="flex h-[54px] cursor-pointer items-center gap-2 rounded-md border border-dashed border-gray-200 bg-white px-2 text-[9px] text-gray-500 transition hover:bg-gray-50">
                {field.imageUrl ? (
                  <img
                    src={field.imageUrl}
                    alt=""
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <ImagePlus size={13} />
                )}
                <span className="min-w-0 flex-1 truncate">
                  {field.value || (field.imageUrl ? "Image uploaded" : "Upload image")}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) updateImageField(field.id, file);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
            <OutputHandle
              id={field.id}
              color={field.kind === "image_field" ? "#80aefb" : "#f5a83c"}
            />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            className="flex h-7 items-center justify-center gap-1 rounded-md border border-gray-200 bg-white text-[9px] text-gray-500 transition hover:bg-gray-50"
            onClick={() => addField("text_field")}
          >
            <Type size={10} /> Text
          </button>
          <button
            className="flex h-7 items-center justify-center gap-1 rounded-md border border-gray-200 bg-white text-[9px] text-gray-500 transition hover:bg-gray-50"
            onClick={() => addField("image_field")}
          >
            <Plus size={10} /> Image
          </button>
        </div>
      </div>
    </BaseNode>
  );
}
