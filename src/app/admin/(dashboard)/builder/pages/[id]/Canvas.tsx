"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BLOCK_LIBRARY, type Block } from "@/lib/blocks";
import { RenderBlock } from "@/lib/renderBlock";

function SortableBlock({
  block,
  selected,
  onSelect,
  onDelete,
}: {
  block: Block;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const label = BLOCK_LIBRARY.find((b) => b.type === block.type)?.label ?? block.type;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onSelect}
      className={`relative group rounded-lg border-2 transition-colors cursor-pointer ${
        selected ? "border-gold" : "border-transparent hover:border-neutral-700"
      } ${isDragging ? "opacity-30" : ""}`}
    >
      <div className="absolute -top-3 left-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 z-10">
        <span
          {...listeners}
          {...attributes}
          className="text-[10px] uppercase bg-gold text-black px-2 py-0.5 rounded cursor-grab active:cursor-grabbing"
        >
          ⠿ {label}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-[10px] uppercase bg-red-500 text-white px-2 py-0.5 rounded"
        >
          Delete
        </button>
      </div>
      <div className="p-2">
        <RenderBlock block={block} />
      </div>
    </div>
  );
}

export default function Canvas({
  blocks,
  selectedId,
  onSelect,
  onDelete,
  width,
}: {
  blocks: Block[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  width: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas-drop" });

  return (
    <div className="flex-1 overflow-auto bg-black p-8 flex justify-center">
      <div
        ref={setNodeRef}
        style={{ width }}
        className={`bg-black border rounded-xl min-h-[600px] p-6 transition-colors ${isOver ? "border-gold" : "border-border"}`}
      >
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {blocks.map((b) => (
              <SortableBlock
                key={b.id}
                block={b}
                selected={selectedId === b.id}
                onSelect={() => onSelect(b.id)}
                onDelete={() => onDelete(b.id)}
              />
            ))}
          </div>
        </SortableContext>
        {blocks.length === 0 && (
          <p className="text-center text-neutral-600 text-sm py-24">
            Drag a component from the left to get started
          </p>
        )}
      </div>
    </div>
  );
}
