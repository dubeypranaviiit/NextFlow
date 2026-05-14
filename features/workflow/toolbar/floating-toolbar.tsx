"use client";

import { useReactFlow } from "@xyflow/react";
import {
  ArrowLeft,
  ArrowRight,
  Crosshair,
  Grid3X3,
  Map,
  Maximize,
  Minus,
  Plus,
  Redo2,
  Search,
  Undo2,
  ZoomIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkflowStore } from "@/store/workflow-store";

export function FloatingToolbar({ onFit }: { onFit: () => void }) {
  const flow = useReactFlow();
  const setPickerOpen = useWorkflowStore((s) => s.setPickerOpen);
  const undo = useWorkflowStore((s) => s.undo);
  const redo = useWorkflowStore((s) => s.redo);
  const currentZoom = useWorkflowStore((s) => s.currentZoom);

  const zoomIn = () => flow.zoomIn({ duration: 200 });
  const zoomOut = () => flow.zoomOut({ duration: 200 });

  return (
    <>
    
      <div className="absolute bottom-4 left-4 z-20 flex h-9 items-center gap-0.5 rounded-lg border border-gray-200 bg-white px-1.5 shadow-float">
        <Button size="icon" variant="ghost" onClick={() => window.history.back()} title="Back">
          <ArrowLeft size={13} />
        </Button>
        <Button size="icon" variant="ghost" onClick={undo} title="Undo (Ctrl+Z)">
          <Undo2 size={13} />
        </Button>
        <Button size="icon" variant="ghost" onClick={redo} title="Redo (Ctrl+Shift+Z)">
          <Redo2 size={13} />
        </Button>
        <div className="mx-0.5 h-4 w-px bg-gray-200" />
        <Button size="icon" variant="ghost" title="Toggle minimap">
          <Map size={13} />
        </Button>
        <Button size="icon" variant="ghost" onClick={zoomOut} title="Zoom out">
          <Minus size={13} />
        </Button>
        <span className="w-10 text-center text-[11px] font-medium text-gray-500">
          {Math.round(currentZoom * 100)}%
        </span>
        <Button size="icon" variant="ghost" onClick={zoomIn} title="Zoom in">
          <ZoomIn size={13} />
        </Button>
        <Button size="icon" variant="ghost" onClick={onFit} title="Fit view">
          <Maximize size={13} />
        </Button>
        <Button size="icon" variant="ghost" title="Search">
          <Search size={13} />
        </Button>
        <div className="mx-0.5 h-4 w-px bg-gray-200" />
        <Button size="icon" variant="ghost" title="Toggle grid">
          <Grid3X3 size={13} />
        </Button>
        <Button size="icon" variant="ghost" title="Center view">
          <Crosshair size={13} />
        </Button>
      </div>

     
      <div className="absolute bottom-4 left-1/2 z-20 flex h-9 -translate-x-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-white px-1.5 shadow-float">
        <Button size="icon" variant="ghost" title="Clipboard">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setPickerOpen(true)}
          title="Add node"
        >
          <Plus size={15} />
        </Button>
      </div>
    </>
  );
}
