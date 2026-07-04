"use client";

import { ChevronDown, Clock3, GitBranch, ImageIcon, PanelRightClose, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveInputImageUrls, resolveOutputImageUrls } from "@/lib/workflow-images";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/store/workflow-store";
import type { NodeRun, WorkflowNode } from "@/types/workflow";

export function HistoryPanel() {
  const open = useWorkflowStore((s) => s.historyOpen);
  const setOpen = useWorkflowStore((s) => s.setHistoryOpen);
  const runs = useWorkflowStore((s) => s.runs);
  const workflow = useWorkflowStore((s) => s.workflow);
  if (!open) return null;

  return (
    <aside className="absolute bottom-0 right-0 top-0 z-20 w-[312px] animate-panelIn border-l border-gray-200 bg-white/96 shadow-float backdrop-blur">
      <header className="flex h-[52px] items-center border-b border-gray-100 px-4">
        <div>
          <h2 className="text-sm font-semibold">Run history</h2>
          <p className="text-[11px] text-gray-500">All workflow executions</p>
        </div>
        <Button
          className="ml-auto"
          size="icon"
          variant="ghost"
          onClick={() => setOpen(false)}
        >
          <PanelRightClose size={15} />
        </Button>
      </header>
      <div className="galaxy-scrollbar h-[calc(100%-52px)] overflow-y-auto p-3">
        {runs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 p-5 text-center text-xs text-gray-500">
            <Clock3 size={20} className="mx-auto mb-2 text-gray-300" />
            No runs yet. Execute your workflow to see history here.
          </div>
        ) : (
          <div className="space-y-2">
            {runs.map((run) => (
              <details
                key={run.id}
                className="rounded-lg border border-gray-200 bg-white p-3 shadow-card"
                open
              >
                <summary className="flex cursor-pointer list-none items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-gray-100">
                    {run.state === "running" ? (
                      <Loader2 size={14} className="animate-spin text-galaxy-purple" />
                    ) : run.state === "success" ? (
                      <CheckCircle size={14} className="text-emerald-500" />
                    ) : run.state === "failed" ? (
                      <XCircle size={14} className="text-red-500" />
                    ) : (
                      <Clock3 size={14} />
                    )}
                  </span>
                  <span>
                    <span className="block text-xs font-semibold capitalize">
                      {run.scope} run
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {formatDuration(run.durationMs)}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      run.state === "success" &&
                        "bg-emerald-50 text-emerald-600",
                      run.state === "failed" && "bg-red-50 text-red-600",
                      run.state === "running" &&
                        "bg-purple-50 text-galaxy-purple",
                      run.state === "queued" && "bg-gray-50 text-gray-600"
                    )}
                  >
                    {run.state}
                  </span>
                  <ChevronDown size={13} className="text-gray-400" />
                </summary>
                <div className="mt-3 space-y-2">
                  <div className="rounded-md border border-blue-100 bg-blue-50/50 p-2">
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-blue-700">
                      <GitBranch size={12} />
                      Workflow data flow
                    </div>
                    <div className="space-y-1.5">
                      {workflow.nodes.map((node, index) => {
                        const nodeRun = run.nodeRuns.find((item) => item.nodeId === node.id);
                        return (
                          <WorkflowFlowRow
                            key={node.id}
                            node={node}
                            nodeRun={nodeRun}
                            index={index}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <ServiceCard title="Trigger.dev" body="Runs node jobs and records status." />
                    <ServiceCard title="Transloadit" body="Stores uploaded/cropped image URLs." />
                    <ServiceCard title="Gemini API" body="Combines prompt plus vision images." />
                  </div>

                  {run.nodeRuns.map((nr) => (
                    <div key={nr.id} className="rounded-md bg-[#fbfbfc] p-2">
                      <div className="flex text-[11px] font-medium">
                        <span className="flex items-center gap-1.5">
                          {nr.state === "success" && (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          )}
                          {nr.state === "failed" && (
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          )}
                          {nr.state === "running" && (
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-galaxy-purple" />
                          )}
                          {nr.state === "skipped" && (
                            <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                          )}
                          {nr.nodeTitle}
                        </span>
                        <span className="ml-auto text-gray-500">
                          {formatDuration(nr.durationMs)}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-gray-500">
                        {nr.error ? (
                          <span className="text-red-500">{nr.error}</span>
                        ) : (
                          nr.output
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

function WorkflowFlowRow({
  node,
  nodeRun,
  index
}: {
  node: WorkflowNode;
  nodeRun?: NodeRun;
  index: number;
}) {
  const workflow = useWorkflowStore((s) => s.workflow);
  const inputImages =
    node.data.kind === "crop_image"
      ? resolveInputImageUrls(workflow, node.id, "input_image")
      : node.data.kind === "gemini"
        ? resolveInputImageUrls(workflow, node.id, "image")
        : [];
  const outputImages =
    node.data.kind === "request_inputs" || node.data.kind === "crop_image"
      ? resolveOutputImageUrls(workflow, node)
      : [];
  const text = nodeRun?.error ?? readableOutput(nodeRun?.output) ?? node.data.prompt ?? node.data.systemPrompt;

  return (
    <div className="rounded border border-white/70 bg-white/80 p-2">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-800">
        <span className="w-4 text-gray-400">{index === 0 ? "┌" : "├"}</span>
        <span className={cn("h-1.5 w-1.5 rounded-full", statusDot(nodeRun?.state))} />
        <span className="min-w-0 flex-1 truncate">{node.data.title}</span>
        {nodeRun && <span className="text-gray-400">{formatDuration(nodeRun.durationMs)}</span>}
      </div>
      <div className="ml-6 mt-1 space-y-1 text-[9px] leading-3 text-gray-500">
        <p className="line-clamp-2">
          {dataFlowLabel(node)}
        </p>
        {text && (
          <p className="line-clamp-2 text-gray-600">
            → {text}
          </p>
        )}
        {(inputImages.length > 0 || outputImages.length > 0) && (
          <div className="flex flex-wrap gap-1">
            {inputImages.slice(0, 2).map((imageUrl, imageIndex) => (
              <ImageChip key={`in-${imageUrl}-${imageIndex}`} label="in" imageUrl={imageUrl} />
            ))}
            {outputImages.slice(0, 2).map((imageUrl, imageIndex) => (
              <ImageChip key={`out-${imageUrl}-${imageIndex}`} label="out" imageUrl={imageUrl} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ImageChip({ label, imageUrl }: { label: string; imageUrl: string }) {
  return (
    <div className="flex max-w-full items-center gap-1 rounded border border-gray-100 bg-[#fbfbfc] px-1 py-0.5">
      <ImageIcon size={9} className="text-blue-500" />
      <span className="text-[8px] font-semibold text-blue-500">{label}</span>
      <img src={imageUrl} alt="" className="h-5 w-7 rounded bg-gray-950 object-cover" />
      <span className="max-w-[92px] truncate text-[8px] text-gray-400">{shortUrl(imageUrl)}</span>
    </div>
  );
}

function ServiceCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-gray-100 bg-[#fbfbfc] p-1.5">
      <div className="text-[9px] font-semibold text-gray-800">{title}</div>
      <div className="mt-0.5 text-[8px] leading-3 text-gray-500">{body}</div>
    </div>
  );
}

function dataFlowLabel(node: WorkflowNode) {
  if (node.data.kind === "request_inputs") return "Inputs: text_field + image_field";
  if (node.data.kind === "crop_image") return "Image: original photo → cropped image output";
  if (node.data.kind === "gemini") return "Gemini 2.5 Flash: prompt + Image (Vision) → marketing text";
  if (node.data.kind === "condition") return "If / Else";
  if (node.data.kind === "response") return "Final Gemini text captured";
  return "Text: prompt → generated text";
}

function readableOutput(output: unknown) {
  if (output === undefined || output === null) return undefined;
  if (typeof output === "string") return output;
  return JSON.stringify(output);
}

function shortUrl(value: string) {
  if (value.startsWith("data:image")) return "image data";
  try {
    const url = new URL(value);
    return `${url.hostname}${url.pathname}`;
  } catch {
    return value;
  }
}

function statusDot(state?: NodeRun["state"]) {
  if (state === "failed") return "bg-red-500";
  if (state === "running") return "bg-galaxy-purple";
  if (state === "queued") return "bg-amber-500";
  if (state === "skipped") return "bg-gray-400";
  return "bg-emerald-500";
}
