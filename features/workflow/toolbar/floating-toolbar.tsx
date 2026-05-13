"use client";

import { Maximize, Minus, Plus, Redo2, Search, Undo2, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkflowStore } from "@/store/workflow-store";

export function FloatingToolbar({ onFit }: { onFit: () => void }) {
  const setPickerOpen = useWorkflowStore((state) => state.setPickerOpen);
  const undo = useWorkflowStore((state) => state.undo);
  const redo = useWorkflowStore((state) => state.redo);

  return (
    <>
      <div className="absolute bottom-4 left-4 z-20 flex h-9 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 shadow-float">
        <Button size="icon" variant="ghost" onClick={undo} title="Undo">
          <Undo2 size={14} />
        </Button>
        <Button size="icon" variant="ghost" onClick={redo} title="Redo">
          <Redo2 size={14} />
        </Button>
        <Button size="icon" variant="ghost" title="Zoom out">
          <Minus size={14} />
        </Button>
        <span className="w-12 text-center text-[11px] font-medium text-gray-500">48%</span>
        <Button size="icon" variant="ghost" title="Zoom in">
          <ZoomIn size={14} />
        </Button>
        <Button size="icon" variant="ghost" onClick={onFit} title="Fit view">
          <Maximize size={14} />
        </Button>
        <Button size="icon" variant="ghost" title="Search">
          <Search size={14} />
        </Button>
      </div>
      <div className="absolute bottom-4 left-1/2 z-20 flex h-9 -translate-x-1/2 items-center rounded-lg border border-gray-200 bg-white px-2 shadow-float">
        <Button size="icon" variant="ghost" onClick={() => setPickerOpen(true)} title="Add node">
          <Plus size={15} />
        </Button>
      </div>
    </>
  );
}
