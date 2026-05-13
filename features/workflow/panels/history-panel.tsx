"use client";

import { ChevronDown, Clock3, PanelRightClose, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/store/workflow-store";

export function HistoryPanel() {
  const open = useWorkflowStore((s) => s.historyOpen);
  const setOpen = useWorkflowStore((s) => s.setHistoryOpen);
  const runs = useWorkflowStore((s) => s.runs);
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
