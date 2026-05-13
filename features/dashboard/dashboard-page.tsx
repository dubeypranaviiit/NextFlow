"use client";

import { useMemo, useState } from "react";
import { Import, KeyRound, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GalaxyShell } from "@/features/dashboard/galaxy-shell";

const cardImage = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=700&q=80";

export function DashboardPage() {
  const [workflows, setWorkflows] = useState([
    { id: "sample-workflow", name: "AI Racing Car Generator C...", edited: "Edited 2h ago" }
  ]);
  const canSearch = useMemo(() => workflows.length > 0, [workflows.length]);

  function createWorkflow() {
    const id = `workflow-${Date.now()}`;
    const next = { id, name: `Untitled Workflow ${workflows.length + 1}`, edited: "Edited just now" };
    setWorkflows((items) => [next, ...items]);
    window.location.href = `/workflow/${id}`;
  }

  function deleteWorkflow(id: string) {
    setWorkflows((items) => items.filter((workflow) => workflow.id !== id));
  }

  return (
    <GalaxyShell>
      <div className="mx-auto w-full max-w-[920px] px-4 pb-16 pt-[42px] sm:px-6 lg:px-0">
        <header className="mb-8 flex items-start justify-between gap-4 max-sm:flex-col">
          <div>
            <h1 className="text-[22px] font-semibold leading-7">Flow</h1>
            <p className="mt-1 text-[13px] text-gray-500">Build workflows or run models directly.</p>
          </div>
          <div className="flex gap-2 max-sm:w-full max-sm:justify-end">
            <Button size="sm">
              <KeyRound size={14} /> API Keys
            </Button>
            <Button size="sm">
              <Import size={14} /> Import
            </Button>
            <Button size="icon" variant="dark" onClick={createWorkflow} title="Create workflow">
              <Plus size={16} />
            </Button>
          </div>
        </header>

        <div className="mb-7 inline-flex rounded-lg bg-[#f8f8f9] p-1 shadow-card">
          <button className="h-8 rounded-md bg-white px-4 text-xs font-semibold shadow-card">Workflows</button>
          <button className="h-8 px-4 text-xs text-gray-500">Nodes</button>
        </div>

        <section className="mb-10">
          <h2 className="text-sm font-semibold">System Workflows</h2>
          <p className="mt-1 text-[13px] text-gray-500">Pre-built workflow templates - click to open and start using.</p>
          <button
            className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-node"
            onClick={() => {
              window.location.href = "/workflow/sample-workflow";
            }}
          >
            <img src={cardImage} alt="" className="h-[138px] w-[232px] object-cover" />
            <div className="h-11 px-3 py-3 text-xs font-semibold">AI Racing Car Generator</div>
          </button>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4 max-sm:flex-col max-sm:items-start">
            <div>
              <h2 className="text-sm font-semibold">Your Workflows</h2>
              <p className="mt-1 text-[13px] text-gray-500">Open one to edit, run, and review history.</p>
            </div>
            <div className="relative w-[172px] max-sm:w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input className="pl-8" placeholder="Search workflows..." disabled={!canSearch} />
            </div>
          </div>
          {workflows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
              No workflows yet. Use the plus button to create one.
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(168px,168px))] gap-5">
              {workflows.map((workflow) => (
                <article key={workflow.id} className="group relative">
                  <button
                    className="w-full text-left"
                    onClick={() => {
                      window.location.href = `/workflow/${workflow.id}`;
                    }}
                  >
                    <img src={cardImage} alt="" className="h-[106px] w-[168px] rounded-lg object-cover shadow-card transition group-hover:-translate-y-0.5 group-hover:shadow-node" />
                    <h3 className="mt-2 truncate text-[13px] font-semibold">{workflow.name}</h3>
                    <p className="mt-1 text-[11px] text-gray-500">{workflow.edited}</p>
                  </button>
                  <div className="absolute right-1 top-1 hidden gap-1 group-hover:flex">
                    <button className="grid h-7 w-7 place-items-center rounded-md bg-white shadow-card">
                      <MoreHorizontal size={14} />
                    </button>
                    <button className="grid h-7 w-7 place-items-center rounded-md bg-white text-red-500 shadow-card" onClick={() => deleteWorkflow(workflow.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </GalaxyShell>
  );
}
