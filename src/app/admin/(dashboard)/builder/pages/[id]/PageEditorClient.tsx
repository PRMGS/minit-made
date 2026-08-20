"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { BLOCK_LIBRARY, defaultBlock, type Block, type BlockType } from "@/lib/blocks";
import { normalizeBlocks } from "@/lib/pageBlocks";
import ComponentLibrary from "./ComponentLibrary";
import Canvas from "./Canvas";
import PropertiesPanel from "./PropertiesPanel";
import type { Database } from "@/types/database.types";

type Page = Database["public"]["Tables"]["pages"]["Row"];

const WIDTHS = { desktop: 1024, tablet: 768, mobile: 375 };

export default function PageEditorClient({ page }: { page: Page }) {
  const router = useRouter();
  const [title, setTitle] = useState(page.title);
  const [metaDescription, setMetaDescription] = useState(page.meta_description ?? "");
  const [history, setHistory] = useState<Block[][]>([normalizeBlocks(page.content)]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [breakpoint, setBreakpoint] = useState<keyof typeof WIDTHS>("desktop");
  const [activeDragType, setActiveDragType] = useState<BlockType | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const blocks = history[historyIndex];
  const selected = blocks.find((b) => b.id === selectedId) ?? null;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function commit(next: Block[]) {
    const truncated = history.slice(0, historyIndex + 1);
    setHistory([...truncated, next]);
    setHistoryIndex(truncated.length);
    setSaved(false);
  }

  function undo() {
    setHistoryIndex((i) => Math.max(0, i - 1));
  }
  function redo() {
    setHistoryIndex((i) => Math.min(history.length - 1, i + 1));
  }

  function handleDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    if (id.startsWith("lib:")) setActiveDragType(id.slice(4) as BlockType);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveDragType(null);
    const { active, over } = e;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId.startsWith("lib:")) {
      const type = activeId.slice(4) as BlockType;
      const newBlock = defaultBlock(type);
      const overIndex = blocks.findIndex((b) => b.id === overId);
      const next = [...blocks];
      if (overIndex === -1) next.push(newBlock);
      else next.splice(overIndex, 0, newBlock);
      commit(next);
      setSelectedId(newBlock.id);
      return;
    }

    if (activeId !== overId) {
      const oldIndex = blocks.findIndex((b) => b.id === activeId);
      const newIndex = blocks.findIndex((b) => b.id === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        commit(arrayMove(blocks, oldIndex, newIndex));
      }
    }
  }

  const updateSelected = useCallback(
    (patch: Partial<Block>) => {
      if (!selectedId) return;
      commit(blocks.map((b) => (b.id === selectedId ? { ...b, ...patch } : b)));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedId, blocks, history, historyIndex]
  );

  function deleteBlock(id: string) {
    commit(blocks.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  async function save(status?: "draft" | "published") {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/admin/pages/${page.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        meta_description: metaDescription,
        content: { blocks },
        ...(status ? { status } : {}),
      }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  const dragOverlayLabel = useMemo(
    () => BLOCK_LIBRARY.find((b) => b.type === activeDragType)?.label,
    [activeDragType]
  );

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-[calc(100vh-4rem)] -m-8">
        <aside className="w-64 border-r border-border p-5 overflow-y-auto shrink-0">
          <ComponentLibrary />
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="border-b border-border px-4 py-3 flex items-center gap-3 flex-wrap">
            <button onClick={() => router.push("/admin/builder/pages")} className="text-sm text-neutral-400 hover:text-gold">← Back</button>
            <button onClick={undo} disabled={historyIndex === 0} className="text-sm px-2 py-1 border border-border rounded disabled:opacity-30">⟲ Undo</button>
            <button onClick={redo} disabled={historyIndex === history.length - 1} className="text-sm px-2 py-1 border border-border rounded disabled:opacity-30">⟳ Redo</button>

            <div className="flex gap-1 ml-2">
              {(Object.keys(WIDTHS) as (keyof typeof WIDTHS)[]).map((bp) => (
                <button
                  key={bp}
                  onClick={() => setBreakpoint(bp)}
                  className={`text-xs px-3 py-1.5 rounded-lg border ${breakpoint === bp ? "border-gold text-gold" : "border-border text-neutral-400"}`}
                >
                  {bp}
                </button>
              ))}
            </div>

            <div className="ml-auto flex gap-2">
              <button onClick={() => save()} disabled={saving} className="border border-border rounded-lg px-4 py-1.5 text-sm hover:border-gold">
                {saving ? "Saving…" : saved ? "Saved ✓" : "💾 Save"}
              </button>
              <a href={`/${page.slug}`} target="_blank" className="border border-border rounded-lg px-4 py-1.5 text-sm hover:border-gold">
                👁 Preview
              </a>
              <button onClick={() => save("published")} disabled={saving} className="btn-gold text-sm">
                ✓ Publish
              </button>
            </div>
          </div>

          <Canvas blocks={blocks} selectedId={selectedId} onSelect={setSelectedId} onDelete={deleteBlock} width={WIDTHS[breakpoint]} />
        </div>

        <aside className="w-72 border-l border-border p-5 overflow-y-auto shrink-0">
          <div className="mb-6 pb-6 border-b border-border space-y-3">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Page Settings</p>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Title</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Meta description (SEO)</label>
              <textarea className="input" rows={2} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
            </div>
          </div>
          <p className="text-xs uppercase tracking-wide text-neutral-500 mb-3">Properties</p>
          <PropertiesPanel block={selected} onChange={updateSelected} />
        </aside>
      </div>

      <DragOverlay>
        {dragOverlayLabel ? (
          <div className="px-3 py-2 rounded-lg border border-gold text-gold text-sm bg-black">{dragOverlayLabel}</div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
