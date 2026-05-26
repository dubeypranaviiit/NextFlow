"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Import, KeyRound, Loader2, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GalaxyShell } from "@/features/dashboard/galaxy-shell";
import {
  SYSTEM_WORKFLOW_CARD_TITLE,
  SYSTEM_WORKFLOW_NAME,
  systemWorkflowCardImage
} from "@/lib/sample-workflow";

const cardImage = systemWorkflowCardImage;

type DbWorkflow = {
  id: string;
  name: string;
  status?: string;
  updatedAt: string;
  description?: string;
};

export function DashboardPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<DbWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

 
  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await fetch("/api/workflows");
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data.workflows ?? []);
      }
    } catch {  }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return workflows;
    const q = searchQuery.toLowerCase();
    return workflows.filter((w) => w.name.toLowerCase().includes(q));
  }, [workflows, searchQuery]);

 
  const sampleWorkflow = workflows.find((w) => w.name === SYSTEM_WORKFLOW_NAME);
  const userWorkflows = filtered.filter((w) => w.name !== SYSTEM_WORKFLOW_NAME);

  const openSystemWorkflow = useCallback(async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/workflows/seed", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        const id = data.workflow?.id;
        if (id) {
          router.push(`/workflow/${id}`);
          return;
        }
      }
      if (sampleWorkflow) router.push(`/workflow/${sampleWorkflow.id}`);
    } catch {
      if (sampleWorkflow) router.push(`/workflow/${sampleWorkflow.id}`);
    } finally {
      setSeeding(false);
    }
  }, [router, sampleWorkflow]);

  const createWorkflow = useCallback(async () => {
    setCreating(true);
    try {
      const name = `Untitled Workflow ${workflows.length + 1}`;
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/workflow/${data.workflow.id}`);
      }
    } catch {}
    setCreating(false);
  }, [workflows.length, router]);

  const deleteWorkflow = useCallback(async (id: string) => {
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
    setMenuOpenId(null);
    try {
      await fetch(`/api/workflows/${id}`, { method: "DELETE" });
    } catch {  }
  }, []);

  const startRename = (wf: DbWorkflow) => {
    setEditingId(wf.id);
    setEditingName(wf.name);
    setMenuOpenId(null);
  };

  const commitRename = async () => {
    if (editingId && editingName.trim()) {
      setWorkflows((prev) =>
        prev.map((w) => (w.id === editingId ? { ...w, name: editingName.trim() } : w))
      );
      try {
       
        const res = await fetch(`/api/workflows/${editingId}`);
        if (res.ok) {
          const data = await res.json();
          const wf = data.workflow;
          await fetch(`/api/workflows/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: editingName.trim(),
              description: wf.description ?? "",
              viewport: wf.viewport ?? { x: 400, y: 300, zoom: 0.7 },
              nodes: (wf.nodes ?? []).map((n: any) => ({
                id: n.id,
                type: n.type,
                position: n.position,
                data: n.data
              })),
              edges: (wf.edges ?? []).map((e: any) => ({
                id: e.id,
                source: e.source,
                sourceHandle: e.sourceHandle,
                target: e.target,
                targetHandle: e.targetHandle,
                data: e.data
              }))
            })
          });
        }
      } catch { /* silent */ }
    }
    setEditingId(null);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        const res = await fetch("/api/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          const result = await res.json();
          router.push(`/workflow/${result.workflow.id}`);
        }
      } catch {
        
       }
    };
    input.click();
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Edited just now";
      if (diffMins < 60) return `Edited ${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Edited ${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `Edited ${diffDays}d ago`;
    } catch {
      return "Edited recently";
    }
  };

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
            <Button size="sm" onClick={handleImport}>
              <Import size={14} /> Import
            </Button>
            <Button
              size="icon"
              variant="dark"
              onClick={createWorkflow}
              disabled={creating}
              title="Create workflow"
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
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
            className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-node disabled:cursor-wait disabled:opacity-70"
            onClick={openSystemWorkflow}
            disabled={seeding}
          >
            <img src={cardImage} alt="" className="h-[138px] w-[232px] object-cover" />
            <div className="flex h-11 items-center gap-2 px-3 py-3 text-xs font-semibold">
              {seeding && <Loader2 size={13} className="animate-spin" />}
              {SYSTEM_WORKFLOW_CARD_TITLE}
            </div>
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
              <Input
                className="pl-8"
                placeholder="Search workflows..."
                disabled={workflows.length === 0}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-galaxy-purple" />
            </div>
          ) : userWorkflows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
              <p>
                {searchQuery ? "No workflows match your search." : "No workflows yet. Create your first workflow to start building."}
              </p>
              {!searchQuery && (
                <Button
                  className="mt-4"
                  size="sm"
                  variant="dark"
                  onClick={createWorkflow}
                  disabled={creating}
                >
                  {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Create workflow
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(168px,168px))] gap-5">
              {userWorkflows.map((wf) => (
                <article key={wf.id} className="group relative">
                  <button
                    className="w-full text-left"
                    onClick={() => router.push(`/workflow/${wf.id}`)}
                  >
                    <img
                      src={cardImage}
                      alt=""
                      className="h-[106px] w-[168px] rounded-lg object-cover shadow-card transition group-hover:-translate-y-0.5 group-hover:shadow-node"
                    />
                    {editingId === wf.id ? (
                      <input
                        className="mt-2 w-full rounded border border-galaxy-purple px-1 text-[13px] font-semibold outline-none"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <h3 className="mt-2 truncate text-[13px] font-semibold">{wf.name}</h3>
                    )}
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="min-w-0 text-[11px] text-gray-500">{formatDate(wf.updatedAt)}</p>
                      <span className="shrink-0 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[9px] font-medium capitalize text-gray-500">
                        {wf.status ?? "idle"}
                      </span>
                    </div>
                  </button>
                  <div className="absolute right-1 top-1 hidden gap-1 group-hover:flex">
                    <button
                      className="grid h-7 w-7 place-items-center rounded-md bg-white shadow-card hover:bg-gray-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === wf.id ? null : wf.id);
                      }}
                    >
                      <MoreHorizontal size={14} />
                    </button>
                    <button
                      className="grid h-7 w-7 place-items-center rounded-md bg-white text-red-500 shadow-card hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteWorkflow(wf.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {menuOpenId === wf.id && (
                    <div className="absolute right-1 top-9 z-30 w-[156px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-float">
                      <button
                        className="flex h-8 w-full items-center gap-2 px-3 text-xs hover:bg-gray-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/workflow/${wf.id}`);
                        }}
                      >
                        <ExternalLink size={12} /> Open
                      </button>
                      <button
                        className="flex h-8 w-full items-center gap-2 px-3 text-xs hover:bg-gray-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          startRename(wf);
                        }}
                      >
                        <Pencil size={12} /> Rename
                      </button>
                      <button
                        className="flex h-8 w-full items-center gap-2 px-3 text-xs hover:bg-gray-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(null);
                          createWorkflow();
                        }}
                      >
                        <Plus size={12} /> Create new
                      </button>
                      <div className="border-t border-gray-100" />
                      <button
                        className="flex h-8 w-full items-center gap-2 px-3 text-xs text-red-500 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteWorkflow(wf.id);
                        }}
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </GalaxyShell>
  );
}
