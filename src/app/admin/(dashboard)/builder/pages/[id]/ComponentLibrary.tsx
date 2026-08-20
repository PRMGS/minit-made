"use client";

import { useDraggable } from "@dnd-kit/core";
import { BLOCK_LIBRARY, type BlockType } from "@/lib/blocks";

function LibraryItem({ type, label }: { type: BlockType; label: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `lib:${type}` });
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      type="button"
      className={`w-full text-left px-3 py-2 rounded-lg border border-border text-sm hover:border-gold hover:text-gold cursor-grab active:cursor-grabbing ${isDragging ? "opacity-40" : ""}`}
    >
      {label}
    </button>
  );
}

export default function ComponentLibrary() {
  const groups = Array.from(new Set(BLOCK_LIBRARY.map((b) => b.group)));
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group}>
          <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">{group}</p>
          <div className="space-y-2">
            {BLOCK_LIBRARY.filter((b) => b.group === group).map((b) => (
              <LibraryItem key={b.type} type={b.type} label={b.label} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
