"use client";

import type { NodeProps } from "@xyflow/react";
import { ChevronDown } from "lucide-react";
import { Input, Textarea } from "@/components/ui/input";
import { BaseNode, InputHandle, OutputHandle } from "@/features/workflow/nodes/base-node";
import type { WorkflowNode } from "@/types/workflow";

export function GeminiNode(props: NodeProps<WorkflowNode>) {
  return (
    <BaseNode node={props} className="w-[238px]">
      <div className="space-y-2 p-3">
        <div className="flex h-7 items-center rounded-md border border-gray-200 bg-white px-2 text-[9px] font-medium">
          {props.data.model ?? "Gemini 3.1 Pro"}
          <ChevronDown size={12} className="ml-auto text-gray-400" />
        </div>
        <Textarea value={props.data.systemPrompt ?? ""} readOnly className="min-h-[52px] bg-[#fbfbfc] text-[9px] leading-4" />
        {props.data.inputs?.map((input, index) => (
          <div key={input.id} className="relative flex h-[25px] items-center gap-2 rounded bg-[#f7f7f8] px-2">
            <span className="w-[80px] truncate text-[9px] text-gray-600">{input.label}</span>
            <Input
              value={input.connected ? "Connected" : String(input.value ?? "")}
              readOnly
              disabled={input.connected}
              className="h-5 flex-1 rounded border-gray-100 px-2 text-[9px]"
            />
            <InputHandle id={input.id} top={128 + index * 33} color={input.type === "image" ? "#80aefb" : "#f5a83c"} />
          </div>
        ))}
        <button className="h-7 w-full rounded-md bg-[#fbfbfc] text-[9px] text-gray-400">Settings</button>
        <div className="min-h-[46px] rounded-md border border-gray-100 bg-[#fbfbfc] p-2 text-[9px] leading-4 text-gray-500">
          {props.data.response ?? "No output yet"}
        </div>
        <OutputHandle id="response" top={310} color="#f5a83c" />
      </div>
    </BaseNode>
  );
}
