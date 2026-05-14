"use client";

import { useState } from "react";
import { Expand, GripVertical, Loader2, Play } from "lucide-react";
import { useWorkflowStore } from "@/store/workflow-store";
import { executeWorkflow } from "@/lib/client-execution";

export function PlaygroundTab() {
  const workflow = useWorkflowStore((s) => s.workflow);
  const updateNodeField = useWorkflowStore((s) => s.updateNodeField);
  const executionState = useWorkflowStore((s) => s.executionState);
  const [output, setOutput] = useState<string | null>(null);

  
  const requestNode = workflow.nodes.find((n) => n.data.kind === "request_inputs");
  const fields = requestNode?.data.fields ?? [];
  const responseNode = workflow.nodes.find((n) => n.data.kind === "response");
  const responseOutput = responseNode?.data.response ?? output;

  const isRunning = executionState === "running";

  const handleRun = async () => {
    await executeWorkflow("full");
   
    const store = useWorkflowStore.getState();
    const respNode = store.workflow.nodes.find((n) => n.data.kind === "response");
    if (respNode?.data.response) {
      setOutput(respNode.data.response);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-144px)]">
   
      <div className="flex w-[380px] flex-shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="flex items-center justify-between px-5 pt-5 pb-1">
          <div>
            <h2 className="text-[14px] font-semibold text-blue-600">Inputs</h2>
            <p className="mt-0.5 text-[11px] text-gray-400">
              Configure the input fields for this workflow run
            </p>
          </div>
          <span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-500">
            Est. ~1.72M
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {fields.length === 0 ? (
            <div className="text-center py-12 text-xs text-gray-400">
              No input fields configured
            </div>
          ) : (
            fields.map((field) => (
              <div key={field.id}>
                <div className="mb-2 flex items-center gap-2">
                  <GripVertical size={12} className="text-gray-300" />
                  <span className="text-[13px] font-medium text-gray-800">
                    {field.label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                  <span className="ml-auto text-[11px] text-gray-400 capitalize">
                    {field.kind === "text_field" ? "Text" : "Image"}
                  </span>
                </div>
                {field.kind === "text_field" ? (
                  <div className="relative">
                    <textarea
                      className="min-h-[80px] w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-[13px] text-gray-700 placeholder:text-gray-400 outline-none transition focus:border-gray-300 focus:ring-1 focus:ring-gray-200"
                      placeholder={`Enter ${field.label.replace(/_/g, " ")}...`}
                      value={field.value}
                      onChange={(e) => {
                        if (requestNode) {
                          updateNodeField(requestNode.id, field.id, e.target.value);
                        }
                      }}
                    />
                    <button className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded text-gray-300 hover:text-gray-500">
                      <Expand size={10} />
                    </button>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    {field.imageUrl ? (
                      <img
                        src={field.imageUrl}
                        alt={field.label}
                        className="h-[120px] w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-[80px] items-center justify-center bg-gray-50 text-[11px] text-gray-400">
                        Click to upload an image
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      
        <div className="border-t border-gray-100 p-4">
          <button
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-galaxy-purple text-sm font-semibold text-white transition hover:bg-[#5544ec] disabled:opacity-60"
            onClick={handleRun}
            disabled={isRunning}
          >
            {isRunning ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Play size={14} fill="currentColor" />
            )}
            {isRunning ? "Running..." : "Run"}
          </button>
        </div>
      </div>

      <div className="flex-1 bg-[#fafafa]">
        <div className="px-6 pt-5 pb-1">
          <h2 className="text-[14px] font-semibold text-gray-800">Output</h2>
          <p className="mt-0.5 text-[11px] text-gray-400">
            Results from workflow execution
          </p>
        </div>
        <div className="px-6 py-4">
          <div className="min-h-[400px] rounded-xl border border-gray-200 bg-white p-6">
            {isRunning ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 size={32} className="mb-3 animate-spin text-galaxy-purple" />
                <p className="text-sm font-medium text-gray-600">Running workflow...</p>
                <p className="mt-1 text-[11px] text-gray-400">
                  This may take a moment
                </p>
              </div>
            ) : responseOutput ? (
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-gray-700">
                  {responseOutput}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-gray-100">
                  <Play size={20} className="ml-0.5 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-500">No output yet</p>
                <p className="mt-1 text-[11px] text-gray-400">
                  Run the workflow to see results here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
