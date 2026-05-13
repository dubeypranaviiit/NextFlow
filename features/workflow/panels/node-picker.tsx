"use client";

import { useState, useMemo } from "react";
import { Crop, Image, Search, Sparkles, Video, Volume2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/store/workflow-store";

type Category = "Recent" | "Image" | "Video" | "Audio" | "Others";

const categories: [Category, typeof Sparkles][] = [
  ["Recent", Sparkles],
  ["Image", Image],
  ["Video", Video],
  ["Audio", Volume2],
  ["Others", Sparkles]
];

const allNodes = [
  {
    id: "crop_image" as const,
    title: "Crop Image",
    meta: "FFmpeg image crop with configurable dimensions",
    category: "Image" as Category,
    icon: Crop
  },
  {
    id: "gemini" as const,
    title: "Gemini 3.1 Pro",
    meta: "Google Gemini text and multimodal LLM",
    category: "Others" as Category,
    icon: Sparkles
  }
];

export function NodePicker() {
  const open = useWorkflowStore((s) => s.pickerOpen);
  const setOpen = useWorkflowStore((s) => s.setPickerOpen);
  const addNode = useWorkflowStore((s) => s.addNode);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("Recent");

  const filtered = useMemo(() => {
    let nodes = allNodes;
    if (search.trim()) {
      const q = search.toLowerCase();
      nodes = nodes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) || n.meta.toLowerCase().includes(q)
      );
    } else if (activeCategory !== "Recent") {
      nodes = nodes.filter((n) => n.category === activeCategory);
    }
    return nodes;
  }, [search, activeCategory]);

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-40 grid place-items-center bg-black/35"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-[520px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search */}
        <div className="border-b border-gray-100 p-4">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              className="h-10 pl-9"
              placeholder="Search nodes..."
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        {/* Category sidebar + nodes */}
        <div className="grid grid-cols-[136px_1fr]">
          <aside className="border-r border-gray-100 bg-[#fbfbfc] p-2">
            {categories.map(([label, Icon]) => (
              <button
                key={label}
                className={cn(
                  "flex h-9 w-full items-center gap-2 rounded-md px-3 text-xs",
                  activeCategory === label
                    ? "bg-white font-semibold shadow-card"
                    : "text-gray-500 hover:bg-white"
                )}
                onClick={() => {
                  setActiveCategory(label);
                  setSearch("");
                }}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </aside>
          <div className="min-h-[140px] space-y-2 p-3">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No nodes found matching &ldquo;{search}&rdquo;
              </div>
            ) : (
              filtered.map((node) => (
                <NodeOption
                  key={node.id}
                  title={node.title}
                  meta={node.meta}
                  icon={<node.icon size={14} />}
                  onClick={() => addNode(node.id)}
                />
              ))
            )}
          </div>
        </div>
        {/* Footer */}
        <div className="flex h-11 justify-end border-t border-gray-100 px-3 py-2">
          <button
            className="rounded-md px-3 text-xs text-gray-500 hover:bg-gray-100"
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
  onClick
}: {
  title: string;
  meta: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:shadow-node"
      onClick={onClick}
    >
      <span className="grid h-8 w-8 place-items-center rounded-md bg-gray-100">
        {icon}
      </span>
      <span>
        <span className="block text-xs font-semibold">{title}</span>
        <span className="mt-1 block text-[11px] text-gray-500">{meta}</span>
      </span>
    </button>
  );
}
