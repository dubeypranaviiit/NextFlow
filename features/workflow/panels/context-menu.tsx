"use client";

import { Copy, Play, Trash2 } from "lucide-react";
import { executeWorkflow } from "@/lib/client-execution";
import { useWorkflowStore } from "@/store/workflow-store";

export function CanvasContextMenu() {
  const contextMenu = useWorkflowStore((s) => s.contextMenu);
  const deleteNode = useWorkflowStore((s) => s.deleteNode);
  const deleteEdge = useWorkflowStore((s) => s.deleteEdge);
  const setContextMenu = useWorkflowStore((s) => s.setContextMenu);
  const setPickerOpen = useWorkflowStore((s) => s.setPickerOpen);
  const workflow = useWorkflowStore((s) => s.workflow);

  if (!contextMenu) return null;

  const node = contextMenu.nodeId
    ? workflow.nodes.find((n) => n.id === contextMenu.nodeId)
    : null;
  const isLocked = node?.data.locked ?? false;

  return (
    <div
      className="fixed z-50 w-[180px] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-float"
      style={{ left: contextMenu.x, top: contextMenu.y }}
      onClick={(e) => e.stopPropagation()}
    >
      {contextMenu.nodeId && (
        <>
          <ContextItem
            icon={<Play size={13} />}
            label="Run this node"
            onClick={() => {
              setContextMenu(null);
              executeWorkflow("single", [contextMenu.nodeId!]);
            }}
          />
          <ContextItem
            icon={<Copy size={13} />}
            label="Duplicate"
            disabled={isLocked}
            onClick={() => {
              setContextMenu(null);
            }}
          />
          <div className="my-1 border-t border-gray-100" />
          <ContextItem
            icon={<Trash2 size={13} />}
            label="Delete node"
            danger
            disabled={isLocked}
            onClick={() => deleteNode(contextMenu.nodeId!)}
          />
        </>
      )}
      {contextMenu.edgeId && (
        <ContextItem
          icon={<Trash2 size={13} />}
          label="Delete connection"
          danger
          onClick={() => deleteEdge(contextMenu.edgeId!)}
        />
      )}
      {!contextMenu.nodeId && !contextMenu.edgeId && (
        <>
          <ContextItem
            icon={<Play size={13} />}
            label="Add node"
            onClick={() => {
              setContextMenu(null);
              setPickerOpen(true);
            }}
          />
          <ContextItem
            icon={<Play size={13} />}
            label="Run workflow"
            onClick={() => {
              setContextMenu(null);
              executeWorkflow("full");
            }}
          />
        </>
      )}
    </div>
  );
}

function ContextItem({
  icon,
  label,
  danger,
  disabled,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex h-8 w-full items-center gap-2.5 px-3 text-[12px] transition ${
        disabled
          ? "cursor-not-allowed text-gray-300"
          : danger
            ? "text-red-500 hover:bg-red-50"
            : "text-gray-700 hover:bg-gray-50"
      }`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {icon} {label}
    </button>
  );
}
