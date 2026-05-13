"use client";

import { ChevronDown, Clock3, PanelRightClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils";
import { useWorkflowStore } from "@/store/workflow-store";

export function HistoryPanel() {
  const open = useWorkflowStore((state) => state.historyOpen);
  const setOpen = useWorkflowStore((state) => state.setHistoryOpen);
  const runs = useWorkflowStore((state) => state.runs);
  if (!open) return null;

  return (
    <aside className="absolute bottom-0 right-0 top-0 z-20 w-[312px] animate-panelIn border-l border-gray-200 bg-white/96 shadow-float backdrop-blur">
      <header className="flex h-[52px] items-center border-b border-gray-100 px-4">
        <div>
          <h2 className="text-sm font-semibold">Run history</h2>
          <p className="text-[11px] text-gray-500">All workflow executions</p>
        </div>
        <Button className="ml-auto" size="icon" variant="ghost" onClick={() => setOpen(false)}>
          <PanelRightClose size={15} />
        </Button>
      </header>
      <div className="galaxy-scrollbar h-[calc(100%-52px)] overflow-y-auto p-3">
        {runs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 p-5 text-center text-xs text-gray-500">
            No runs yet
          </div>
        ) : (
          <div className="space-y-2">
            {runs.map((run) => (
              <details key={run.id} className="rounded-lg border border-gray-200 bg-white p-3 shadow-card" open>
                <summary className="flex cursor-pointer list-none items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-gray-100">
                    <Clock3 size={14} />
                  </span>
                  <span>
                    <span className="block text-xs font-semibold capitalize">{run.scope} run</span>
                    <span className="text-[11px] text-gray-500">{formatDuration(run.durationMs)}</span>
                  </span>
                  <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">{run.state}</span>
                  <ChevronDown size={13} className="text-gray-400" />
                </summary>
                <div className="mt-3 space-y-2">
                  {run.nodeRuns.map((nodeRun) => (
                    <div key={nodeRun.id} className="rounded-md bg-[#fbfbfc] p-2">
                      <div className="flex text-[11px] font-medium">
                        {nodeRun.nodeTitle}
                        <span className="ml-auto text-gray-500">{formatDuration(nodeRun.durationMs)}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-gray-500">{nodeRun.output ?? nodeRun.error}</p>
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
