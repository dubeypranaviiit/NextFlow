"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/loading-screen";
import { GalaxyShell } from "@/features/dashboard/galaxy-shell";
import { WorkflowBuilderPage } from "@/features/workflow/workflow-builder";
import { PlaygroundTab } from "@/features/workflow/tabs/playground-tab";
import { ApiTab } from "@/features/workflow/tabs/api-tab";
import { WorkflowTab } from "@/features/workflow/tabs/workflow-tab";
import { useWorkflowStore } from "@/store/workflow-store";
import { cn } from "@/lib/utils";

type Tab = "playground" | "api" | "workflow";

export function WorkflowDetailPage({ workflowId }: { workflowId: string }) {
  const loading = useWorkflowStore((state) => state.loading);
  const hydrateFromDb = useWorkflowStore((state) => state.hydrateFromDb);
  const workflow = useWorkflowStore((state) => state.workflow);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("playground");
  const [canvasMode, setCanvasMode] = useState(false);

  useEffect(() => {
    hydrateFromDb(workflowId);
  }, [workflowId, hydrateFromDb]);

  if (loading) return <LoadingScreen />;

  if (canvasMode) {
    return <WorkflowBuilderPage onBack={() => setCanvasMode(false)} />;
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "playground", label: "Playground" },
    { id: "api", label: "API" },
    { id: "workflow", label: "Workflow" },
  ];

  return (
    <GalaxyShell>
     
      <div className="border-b border-gray-200 bg-white">
        <div className="flex h-[52px] items-center gap-3 px-5">
          <button
            className="grid h-7 w-7 place-items-center rounded-md text-gray-600 hover:bg-gray-100"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-[15px] font-semibold text-gray-900 truncate">
            {workflow.name}
          </h1>
        </div>
      
        <div className="flex gap-0 px-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={cn(
                "relative h-[38px] px-4 text-[13px] font-medium transition-colors",
                activeTab === tab.id
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900 rounded-t" />
              )}
            </button>
          ))}
        </div>
      </div>

    
      <div className="flex-1">
        {activeTab === "playground" && <PlaygroundTab />}
        {activeTab === "api" && <ApiTab workflowId={workflowId} />}
        {activeTab === "workflow" && (
          <WorkflowTab onEditWorkflow={() => setCanvasMode(true)} />
        )}
      </div>
    </GalaxyShell>
  );
}
