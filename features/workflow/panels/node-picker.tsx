"use client";

import { useState, useMemo } from "react";
import { Brain, Crop, Image, Layers, Search, Sparkles, Video, Volume2, Zap, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/store/workflow-store";

type Category = "All" | "LLM" | "Image" | "Video" | "Audio" | "Utility";

const categories: { label: Category; icon: typeof Sparkles; color: string }[] = [
  { label: "All", icon: Layers, color: "#6366f1" },
  { label: "LLM", icon: Brain, color: "#8b5cf6" },
  { label: "Image", icon: Image, color: "#3b82f6" },
  { label: "Video", icon: Video, color: "#10b981" },
  { label: "Audio", icon: Volume2, color: "#f59e0b" },
  { label: "Utility", icon: Sparkles, color: "#6b7280" },
];

const allNodes = [
  {
    id: "groq" as const,
    title: "Groq — Llama 3.3 70B",
    meta: "Ultra-fast inference — main LLM (default)",
    category: "LLM" as Category,
    icon: Zap,
    color: "#f97316",
    bgColor: "#fff7ed",
  },
  {
    id: "gemini" as const,
    title: "Gemini 3.1 Pro",
    meta: "Google Gemini — multimodal LLM with vision",
    category: "LLM" as Category,
    icon: Sparkles,
    color: "#8b5cf6",
    bgColor: "#f5f3ff",
  },
  {
    id: "crop_image" as const,
    title: "Crop Image",
    meta: "FFmpeg image crop with configurable dimensions",
    category: "Image" as Category,
    icon: Crop,
    color: "#3b82f6",
    bgColor: "#eff6ff",
  },
];

export function NodePicker() {
  const open = useWorkflowStore((s) => s.pickerOpen);
  const setOpen = useWorkflowStore((s) => s.setPickerOpen);
  const addNode = useWorkflowStore((s) => s.addNode);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  const filtered = useMemo(() => {
    let nodes = allNodes;
    if (search.trim()) {
      const q = search.toLowerCase();
      nodes = nodes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) || n.meta.toLowerCase().includes(q)
      );
    } else if (activeCategory !== "All") {
      nodes = nodes.filter((n) => n.category === activeCategory);
    }
    return nodes;
  }, [search, activeCategory]);

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-40 grid place-items-center bg-black/40 backdrop-blur-[2px]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-[560px] animate-in fade-in zoom-in-95 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animationDuration: "200ms" }}
      >
       
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Add Node</h3>
            <p className="mt-0.5 text-[11px] text-gray-400">Choose a node to add to your workflow</p>
          </div>
          <button
            className="grid h-7 w-7 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            onClick={() => setOpen(false)}
          >
            <X size={14} />
          </button>
        </div>

       
        <div className="border-b border-gray-100 px-5 py-3">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              className="h-9 rounded-lg bg-gray-50 pl-9 text-xs placeholder:text-gray-400 focus:bg-white"
              placeholder="Search nodes..."
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

       
        <div className="grid grid-cols-[148px_1fr]">
          <aside className="border-r border-gray-100 bg-[#fafafa] p-2.5">
            {categories.map(({ label, icon: Icon, color }) => (
              <button
                key={label}
                className={cn(
                  "flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-[11px] transition-all",
                  activeCategory === label
                    ? "bg-white font-semibold text-gray-800 shadow-sm ring-1 ring-gray-200/60"
                    : "text-gray-500 hover:bg-white/70 hover:text-gray-700"
                )}
                onClick={() => {
                  setActiveCategory(label);
                  setSearch("");
                }}
              >
                <Icon size={13} style={{ color: activeCategory === label ? color : undefined }} />
                {label}
              </button>
            ))}
          </aside>
          <div className="min-h-[180px] max-h-[320px] overflow-y-auto p-3 space-y-2">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search size={24} className="mb-2 text-gray-300" />
                <div className="text-xs font-medium text-gray-400">No nodes found</div>
                <div className="mt-0.5 text-[11px] text-gray-300">
                  Try a different search term
                </div>
              </div>
            ) : (
              filtered.map((node) => (
                <NodeOption
                  key={node.id}
                  title={node.title}
                  meta={node.meta}
                  icon={<node.icon size={16} />}
                  color={node.color}
                  bgColor={node.bgColor}
                  onClick={() => addNode(node.id)}
                />
              ))
            )}
          </div>
        </div>

        
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-2.5">
          <span className="text-[10px] text-gray-400">
            {filtered.length} node{filtered.length !== 1 ? "s" : ""} available
          </span>
          <button
            className="rounded-lg px-3 py-1.5 text-[11px] font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function NodeOption({
  title,
  meta,
  icon,
  color,
  bgColor,
  onClick,
}: {
  title: string;
  meta: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  onClick: () => void;
}) {
  return (
    <button
      className="group flex w-full items-center gap-3 rounded-xl border border-gray-150 bg-white p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-lg"
      onClick={onClick}
    >
      <span
        className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg transition-transform group-hover:scale-110"
        style={{ backgroundColor: bgColor, color }}
      >
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-semibold text-gray-800">{title}</span>
        <span className="mt-0.5 block text-[11px] leading-tight text-gray-400">{meta}</span>
      </span>
      <span className="flex-shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-[9px] font-medium text-gray-500 opacity-0 transition-opacity group-hover:opacity-100">
        Add
      </span>
    </button>
  );
}
