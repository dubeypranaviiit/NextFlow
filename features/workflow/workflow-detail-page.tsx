"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Boxes,
  Copy,
  Gift,
  Grid2X2,
  Image,
  Loader2,
  MessageSquare,
  Music,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Search,
  Settings,
  Video
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/loading-screen";
import { Textarea } from "@/components/ui/input";
import { WorkflowBuilderPage } from "@/features/workflow/workflow-builder";
import { executeWorkflow } from "@/lib/client-execution";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";
import { useWorkflowStore } from "@/store/workflow-store";

type Tab = "playground" | "api" | "workflow";

export function WorkflowDetailPage({ workflowId }: { workflowId: string }) {
  const [tab, setTab] = useState<Tab>("playground");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen);
  const workflow = useWorkflowStore((s) => s.workflow);
  const loading = useWorkflowStore((s) => s.loading);
  const hydrateFromDb = useWorkflowStore((s) => s.hydrateFromDb);

  /* Hydrate workflow from DB on mount */
  useEffect(() => {
    hydrateFromDb(workflowId);
  }, [workflowId, hydrateFromDb]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Red promo banner */}
      <div className="flex h-[50px] items-center justify-center bg-galaxy-red px-4 text-center text-[12px] font-semibold text-white sm:text-sm">
        Pay once, get a <span className="mx-1 font-extrabold">LIFETIME</span> deal forever — for only $399
        <span className="mx-2 hidden text-xs sm:inline">⏱ 14h 39m 21s</span>
        <span className="hidden rounded-full bg-white px-4 py-1 text-galaxy-red sm:inline">
          Click here
        </span>
      </div>

      {drawerOpen && (
        <WorkflowSideDrawer
          onClose={() => setDrawerOpen(false)}
          onSettings={() => setSettingsOpen(true)}
        />
      )}

      <div
        className={cn(
          "transition-[padding] duration-200",
          drawerOpen && "pl-[320px] max-lg:pl-[280px] max-md:pl-0"
        )}
      >
        <header className="flex h-[94px] flex-col border-b border-gray-200 bg-white">
          <div className="flex h-[58px] items-center gap-3 px-3 sm:px-5">
            {!drawerOpen && (
              <Button
                size="icon"
                onClick={() => setDrawerOpen(true)}
              >
                <PanelLeftOpen size={15} />
              </Button>
            )}
            <Button size="icon" onClick={() => router.push("/dashboard")}>
              <ArrowLeft size={15} />
            </Button>
            <h1 className="truncate text-base font-semibold">
              {workflow.name}
            </h1>
          </div>
          <nav className="flex h-9 gap-6 px-12 max-sm:px-4">
            {(["playground", "api", "workflow"] as const).map((item) => (
              <button
                key={item}
                className={cn(
                  "h-9 border-b text-[13px] capitalize transition",
                  tab === item
                    ? "border-black font-medium text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
                onClick={() => setTab(item)}
              >
                {item}
              </button>
            ))}
          </nav>
        </header>
        {tab === "playground" && <PlaygroundTab />}
        {tab === "api" && <ApiTab />}
        {tab === "workflow" && <WorkflowBuilderPage embedded />}
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Playground Tab                                                     */
/* ------------------------------------------------------------------ */
function PlaygroundTab() {
  const [prompt, setPrompt] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState("");
  const runs = useWorkflowStore((s) => s.runs);
  const workflow = useWorkflowStore((s) => s.workflow);

  async function runWorkflow() {
    setIsRunning(true);
    setOutput("");

    /* If prompt is provided, update the request inputs node text_field */
    if (prompt) {
      const requestNode = workflow.nodes.find((n) => n.data.kind === "request_inputs");
      if (requestNode) {
        const store = useWorkflowStore.getState();
        const textField = requestNode.data.fields?.find((f) => f.kind === "text_field");
        if (textField) {
          store.updateNodeField(requestNode.id, textField.id, prompt);
        }
      }
    }

    await executeWorkflow("full");

    /* Get the response node's output */
    const updatedWorkflow = useWorkflowStore.getState().workflow;
    const responseNode = updatedWorkflow.nodes.find((n) => n.data.kind === "response");
    const geminiNodes = updatedWorkflow.nodes.filter((n) => n.data.kind === "gemini");

    let finalOutput = responseNode?.data.response ?? "";
    if (!finalOutput) {
      /* Fallback: get the last gemini node's response */
      for (const gn of geminiNodes.reverse()) {
        if (gn.data.response) {
          finalOutput = gn.data.response;
          break;
        }
      }
    }

    setOutput(finalOutput || "Workflow completed");
    setIsRunning(false);
  }

  return (
    <section className="grid gap-5 p-5 sm:grid-cols-[400px_1fr] max-sm:p-3">
      <aside className="flex min-h-[520px] flex-col rounded-2xl border border-gray-200 bg-white shadow-card">
        <header className="flex h-[58px] items-center border-b border-gray-200 px-4">
          <div>
            <h2 className="text-sm font-semibold">Inputs</h2>
            <p className="mt-1 text-[11px] text-gray-500">
              Configure the input fields for this workflow run
            </p>
          </div>
          <span className="ml-auto rounded bg-gray-100 px-2 py-1 text-[10px] text-gray-500">
            Est. ~1.72M
          </span>
        </header>
        <div className="p-4">
          <div className="mb-2 flex items-center text-[12px] font-medium">
            <span className="mr-2 text-gray-400">☰</span>
            Car prompt
            <span className="ml-auto text-[11px] font-normal text-gray-400">
              Text
            </span>
          </div>
          <Textarea
            className="min-h-[68px] text-[12px]"
            placeholder="Enter Car prompt..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
        <div className="mt-auto p-4">
          <button
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-galaxy-purple text-sm font-semibold text-white shadow-node transition hover:bg-[#5544ec] disabled:opacity-70"
            onClick={runWorkflow}
            disabled={isRunning}
          >
            {isRunning ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Play size={15} />
            )}{" "}
            {isRunning ? "Running" : "Run"}
          </button>
        </div>
      </aside>

      <section className="min-h-[520px] rounded-2xl border border-gray-200 bg-white shadow-card">
        <header className="flex h-[58px] items-center border-b border-gray-200 px-4">
          <div>
            <h2 className="text-sm font-semibold">Output</h2>
            <p className="mt-1 text-[11px] text-gray-500">
              Results from workflow execution
            </p>
          </div>
        </header>
        <div className="grid h-[462px] place-items-center p-8 text-center">
          {isRunning ? (
            <div>
              <div className="mx-auto mb-3 grid h-[54px] w-[54px] place-items-center rounded-full bg-[#f1edff] text-galaxy-purple">
                <Loader2 size={24} className="animate-spin" />
              </div>
              <div className="text-[12px] font-medium text-gray-600">
                Workflow running
              </div>
              <div className="mt-1 text-[11px] text-gray-400">
                Executing nodes in parallel where possible
              </div>
            </div>
          ) : output ? (
            <div className="w-full max-w-[620px] rounded-xl border border-gray-200 bg-[#fbfbfc] p-5 text-left shadow-card">
              <div className="mb-2 text-[12px] font-semibold text-emerald-600">
                ✓ Completed
              </div>
              <p className="whitespace-pre-line text-[14px] leading-6 text-gray-800">
                {output}
              </p>
              <p className="mt-4 text-[11px] text-gray-500">
                {runs.length} run{runs.length !== 1 ? "s" : ""} saved to history
              </p>
            </div>
          ) : (
            <div>
              <div className="mx-auto mb-3 grid h-[54px] w-[54px] place-items-center rounded-full bg-gray-50 text-gray-300">
                <Play size={24} />
              </div>
              <div className="text-[12px] font-medium text-gray-500">
                No output yet
              </div>
              <div className="mt-1 text-[11px] text-gray-400">
                Run the workflow to see results here
              </div>
            </div>
          )}
        </div>
      </section>

      {isRunning && <LoadingScreen overlay />}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Side Drawer (Workflow detail page)                                 */
/* ------------------------------------------------------------------ */
function WorkflowSideDrawer({
  onClose,
  onSettings
}: {
  onClose: () => void;
  onSettings: () => void;
}) {
  const router = useRouter();
  const items = [
    ["All Tools", Grid2X2],
    ["Platform", Boxes],
    ["API Docs", BookOpen],
    ["Free Credits", Gift],
    ["AI Image Generator", Image],
    ["AI Video Generator", Video],
    ["Audio Library", Music],
    ["Chat with AI", MessageSquare]
  ] as const;

  return (
    <aside className="fixed bottom-0 left-0 top-[50px] z-40 flex w-[320px] flex-col border-r border-gray-200 bg-[#fbfbfc] shadow-[8px_0_24px_rgba(16,16,20,0.06)] max-lg:w-[280px] max-md:hidden">
      <div className="flex h-[74px] items-center justify-between px-5">
        <div className="grid h-9 w-9 place-items-center rounded-full border border-black bg-black text-[12px] text-white">
          NF
        </div>
        <button
          className="grid h-8 w-8 place-items-center rounded-md text-gray-800 hover:bg-white"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <PanelLeftClose size={14} />
        </button>
      </div>
      <div className="px-3">
        <button className="flex h-11 w-full items-center gap-3 rounded-full border border-gray-200 bg-white px-4 text-[13px] text-gray-500 shadow-card">
          <Search size={14} />
          Quick search...
          <span className="ml-auto text-[11px]">⌘K</span>
        </button>
      </div>
      <nav className="galaxy-scrollbar mt-5 flex-1 overflow-y-auto px-3">
        <div className="space-y-1">
          {items.slice(0, 6).map(([label, Icon], index) => (
            <button
              key={label}
              className={cn(
                "flex h-[36px] w-full items-center gap-4 rounded-md px-3 text-left text-[13px] text-gray-800 hover:bg-white",
                index === 0 && "bg-white"
              )}
            >
              <Icon size={15} />
              <span>{label}</span>
              {index === 0 && (
                <span className="ml-auto rounded-full bg-[#e9e8ff] px-2 py-0.5 text-[11px] font-semibold text-galaxy-purple">
                  5933
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="mt-8">
          <div className="mb-3 px-3 text-[11px] font-semibold text-gray-400">
            Unfair Advantage
          </div>
          {["Prompt Library", "Tutorials", "Ad Library"].map((label) => (
            <button
              key={label}
              className="flex h-[36px] w-full items-center gap-4 rounded-md px-3 text-left text-[13px] text-gray-700 hover:bg-white"
            >
              <BookOpen size={15} /> {label}
            </button>
          ))}
        </div>
      </nav>
      <div className="border-t border-gray-200 p-3">
        <button
          className="mb-3 flex h-9 w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white text-[12px] shadow-card"
          onClick={onSettings}
        >
          <Settings size={14} /> Settings
        </button>
        <button
          className="flex h-9 w-full items-center justify-center gap-2 rounded-full bg-galaxy-purple text-[12px] font-semibold text-white"
          onClick={() => router.push("/dashboard")}
        >
          Dashboard
        </button>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/*  API Tab                                                            */
/* ------------------------------------------------------------------ */
function ApiTab() {
  return (
    <section className="grid gap-5 p-5 lg:grid-cols-[46%_1fr] max-sm:p-3">
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <header className="flex h-11 items-center border-b border-gray-200 px-3">
          <button className="rounded-full border border-gray-200 px-3 py-1 text-[12px]">
            Python⌄
          </button>
          <button className="ml-auto flex items-center gap-2 text-[12px]">
            <Copy size={14} /> Copy
          </button>
        </header>
        <pre className="galaxy-scrollbar h-[686px] overflow-auto bg-[#fbfbfc] p-5 text-[12px] leading-[20px] text-[#111827]">
          {`import requests
import time
import json

api_key = "YOUR_API_KEY"
url = "https://api.galaxy.ai/api/v1/runs"

data = {
  "workflowId": "ai-racing-car",
  "values": {
    "node_request": {
      "Car prompt": "your text here"
    }
  }
}

response = requests.post(
  url,
  json=data,
  headers={"Authorization": f"Bearer {api_key}"}
)

run_id = response.json()["runId"]`}
        </pre>
      </div>
      <div className="galaxy-scrollbar h-[730px] overflow-auto pr-2">
        <h2 className="mb-3 text-base font-semibold">API Endpoint</h2>
        <div className="mb-6 rounded-md border border-gray-200 bg-[#fbfbfc] px-4 py-2 font-mono text-[12px]">
          <span className="mr-2 rounded bg-emerald-100 px-2 py-1 font-sans text-[10px] font-semibold text-emerald-700">
            POST
          </span>
          https://api.galaxy.ai/api/v1/runs
        </div>
        <DocCard title="Response Format">
          The start endpoint returns a <Code>runId</Code>. Poll{" "}
          <Code>GET /v1/runs/{`{runId}`}</Code> to check status.
          <pre className="mt-4 rounded-md border border-gray-200 bg-[#fbfbfc] p-4 text-[12px]">{`{
  "runId": "run_abc123..."
}`}</pre>
        </DocCard>
        <DocCard title="Polling Response">
          Poll <Code>GET /v1/runs/{`{runId}`}</Code> until status is terminal.
          <div className="mt-4 flex gap-2 text-[10px]">
            {["QUEUED", "RUNNING", "COMPLETED", "FAILED"].map((s) => (
              <span
                key={s}
                className="rounded bg-gray-100 px-2 py-1"
              >
                {s}
              </span>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3 text-[12px] text-gray-500">
            inDetails{" "}
            <span className="h-6 w-11 rounded-full bg-black p-1">
              <span className="block h-4 w-4 rounded-full bg-white" />
            </span>{" "}
            true - all node runs
          </div>
          <pre className="mt-4 rounded-md border border-gray-200 bg-[#fbfbfc] p-4 text-[12px]">{`{
  "id": "run_abc123...",
  "workflowId": "ai-racing-car",
  "status": "COMPLETED",
  "nodeRuns": []
}`}</pre>
        </DocCard>
      </div>
    </section>
  );
}

function DocCard({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-[13px] leading-6">
        {children}
      </div>
    </section>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-gray-100 px-2 py-1 text-[11px]">
      {children}
    </code>
  );
}
