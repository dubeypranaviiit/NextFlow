"use client";

import { useCallback } from "react";
import { type NodeProps } from "@xyflow/react";
import { GitBranch, Trash2 } from "lucide-react";
import { BaseNode, InputHandle, OutputHandle } from "@/features/workflow/nodes/base-node";
import { useWorkflowStore } from "@/store/workflow-store";
import type { Comparator, WorkflowNode } from "@/types/workflow";

const comparators: { value: Comparator; label: string }[] = [
  { value: "contains", label: "Contains" },
  { value: "equals", label: "Equals" },
  { value: "starts_with", label: "Starts with" },
  { value: "greater_than", label: "Greater than" },
  { value: "less_than", label: "Less than" },
];

export function ConditionNode(props: NodeProps<WorkflowNode>) {
  const node = props;
  const data = node.data;
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const deleteNode = useWorkflowStore((s) => s.deleteNode);

  const handleComparatorChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateNodeData(props.id, { comparator: e.target.value as Comparator });
    },
    [props.id, updateNodeData]
  );

  const handleValueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateNodeData(props.id, { conditionValue: e.target.value });
    },
    [props.id, updateNodeData]
  );

  return (
    <BaseNode node={props} className="w-[238px]">
      <div className="px-3 pb-3">
        {/* Input section */}
        <div className="relative mb-3 flex items-center gap-2 text-[11px]">
          <InputHandle id="input" color="#f59e0b" />
          <span className="font-medium text-gray-600">Input</span>
          {data.inputs?.[0]?.connected && (
            <span className="ml-auto text-[10px] text-amber-500">← Connected</span>
          )}
        </div>

        {/* Comparator dropdown */}
        <div className="mb-2">
          <label className="mb-1 block text-[10px] font-medium text-gray-400">Condition</label>
          <select
            className="h-7 w-full rounded-md border border-gray-200 bg-white px-2 text-[11px] text-gray-700 outline-none focus:border-gray-300"
            value={data.comparator ?? "contains"}
            onChange={handleComparatorChange}
          >
            {comparators.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Comparison value input */}
        <div className="mb-3">
          <label className="mb-1 block text-[10px] font-medium text-gray-400">Value</label>
          <input
            type="text"
            className="h-7 w-full rounded-md border border-gray-200 bg-white px-2 text-[11px] text-gray-700 placeholder:text-gray-400 outline-none focus:border-gray-300"
            placeholder="Compare against..."
            value={data.conditionValue ?? ""}
            onChange={handleValueChange}
          />
        </div>

        {/* Output handles */}
        <div className="space-y-2 border-t border-gray-100 pt-2">
          <div className="relative flex items-center justify-end gap-2 text-[11px]">
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">✓ True</span>
            <OutputHandle id="true_branch" color="#10b981" />
          </div>
          <div className="relative flex items-center justify-end gap-2 text-[11px]">
            <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-500">✗ False</span>
            <OutputHandle id="false_branch" color="#ef4444" />
          </div>
        </div>

        {/* Delete button */}
        {!data.locked && (
          <div className="mt-2 flex justify-end border-t border-gray-100 pt-2">
            <button
              className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-600"
              onClick={() => deleteNode(props.id)}
            >
              <Trash2 size={10} /> Delete
            </button>
          </div>
        )}
      </div>
    </BaseNode>
  );
}
