"use client";

import { Image, Search, Sparkles, Video, Volume2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/store/workflow-store";

const categories = [
  ["Recent", Sparkles],
  ["Image", Image],
  ["Video", Video],
  ["Audio", Volume2],
  ["Others", Sparkles]
] as const;

export function NodePicker() {
  const open = useWorkflowStore((state) => state.pickerOpen);
  const setOpen = useWorkflowStore((state) => state.setPickerOpen);
  const addNode = useWorkflowStore((state) => state.addNode);
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-black/35">
      <div className="w-[520px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-float">
        <div className="border-b border-gray-100 p-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input className="h-10 pl-9" placeholder="Search nodes..." autoFocus />
          </div>
        </div>
        <div className="grid grid-cols-[136px_1fr]">
          <aside className="border-r border-gray-100 bg-[#fbfbfc] p-2">
            {categories.map(([label, Icon], index) => (
              <button key={label} className={cn("flex h-9 w-full items-center gap-2 rounded-md px-3 text-xs", index === 0 ? "bg-white font-semibold shadow-card" : "text-gray-500")}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </aside>
          <div className="space-y-2 p-3">
            <NodeOption title="Crop Image" meta="FFmpeg image crop" onClick={() => addNode("crop_image")} />
            <NodeOption title="Gemini 3.1 Pro" meta="Google Gemini text and multimodal LLM" onClick={() => addNode("gemini")} />
          </div>
        </div>
        <div className="flex h-11 justify-end border-t border-gray-100 px-3 py-2">
          <button className="rounded-md px-3 text-xs text-gray-500 hover:bg-gray-100" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function NodeOption({ title, meta, onClick }: { title: string; meta: string; onClick: () => void }) {
  return (
    <button className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:shadow-node" onClick={onClick}>
      <span className="grid h-8 w-8 place-items-center rounded-md bg-gray-100">
        <Sparkles size={14} />
      </span>
      <span>
        <span className="block text-xs font-semibold">{title}</span>
        <span className="mt-1 block text-[11px] text-gray-500">{meta}</span>
      </span>
    </button>
  );
}
