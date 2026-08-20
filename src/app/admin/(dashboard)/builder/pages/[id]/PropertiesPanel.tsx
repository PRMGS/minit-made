"use client";

import { BRAND_COLORS, type Block, type BlockStyle, type GalleryItem } from "@/lib/blocks";

const TEXT_PROP_FIELDS: Record<string, { key: string; label: string; multiline?: boolean }[]> = {
  heading: [{ key: "text", label: "Text" }],
  paragraph: [{ key: "text", label: "Text", multiline: true }],
  button: [{ key: "text", label: "Label" }, { key: "href", label: "Link" }],
  image: [{ key: "url", label: "Image URL" }, { key: "alt", label: "Alt text" }],
  hero: [
    { key: "heading", label: "Heading" },
    { key: "subheading", label: "Subheading", multiline: true },
    { key: "ctaText", label: "Button label" },
    { key: "ctaHref", label: "Button link" },
    { key: "backgroundImage", label: "Background image URL" },
  ],
  two_column: [
    { key: "leftText", label: "Left column", multiline: true },
    { key: "rightText", label: "Right column", multiline: true },
  ],
  card: [
    { key: "title", label: "Title" },
    { key: "text", label: "Description", multiline: true },
    { key: "imageUrl", label: "Image URL" },
  ],
  cta: [
    { key: "heading", label: "Heading" },
    { key: "buttonText", label: "Button label" },
    { key: "buttonHref", label: "Button link" },
  ],
  video: [{ key: "youtubeUrl", label: "YouTube URL" }],
  testimonial: [{ key: "quote", label: "Quote", multiline: true }, { key: "author", label: "Author" }],
  footer: [{ key: "text", label: "Text" }],
  social_links: [
    { key: "instagram", label: "Instagram URL" },
    { key: "tiktok", label: "TikTok URL" },
    { key: "youtube", label: "YouTube URL" },
  ],
  spacer: [],
  divider: [],
  gallery: [{ key: "heading", label: "Heading" }],
  format_row: [],
  content_feed: [
    { key: "heading", label: "Heading" },
    { key: "linkText", label: "Link text" },
    { key: "linkHref", label: "Link href" },
  ],
  email_capture: [
    { key: "label", label: "Eyebrow label" },
    { key: "heading", label: "Heading" },
  ],
};

function GalleryItemsEditor({ block, onChange }: { block: Block; onChange: (patch: Partial<Block>) => void }) {
  const items = block.items ?? [];

  function update(i: number, patch: Partial<GalleryItem>) {
    onChange({ items: items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) });
  }
  function remove(i: number) {
    onChange({ items: items.filter((_, idx) => idx !== i) });
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ items: next });
  }
  function add() {
    onChange({ items: [...items, { title: "New Item", imageUrl: "", href: "" }] });
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Items</p>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-neutral-500">Item {i + 1}</span>
              <div className="flex gap-2 text-xs">
                <button onClick={() => move(i, -1)}>↑</button>
                <button onClick={() => move(i, 1)}>↓</button>
                <button onClick={() => remove(i)} className="text-red-400">Remove</button>
              </div>
            </div>
            <input className="input" placeholder="Title" value={item.title} onChange={(e) => update(i, { title: e.target.value })} />
            <input className="input" placeholder="Image URL" value={item.imageUrl} onChange={(e) => update(i, { imageUrl: e.target.value })} />
            <input className="input" placeholder="Link (optional)" value={item.href} onChange={(e) => update(i, { href: e.target.value })} />
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-3 text-sm border border-border rounded-lg px-3 py-1.5 hover:border-gold w-full">
        + Add Item
      </button>
    </div>
  );
}

export default function PropertiesPanel({
  block,
  onChange,
}: {
  block: Block | null;
  onChange: (patch: Partial<Block>) => void;
}) {
  if (!block) {
    return <p className="text-neutral-500 text-sm">Select a block to edit its properties.</p>;
  }

  const fields = TEXT_PROP_FIELDS[block.type] ?? [];

  function setProp(key: string, value: string) {
    onChange({ props: { ...block!.props, [key]: value } });
  }
  function setStyle(patch: Partial<BlockStyle>) {
    onChange({ style: { ...block!.style, ...patch } });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Content</p>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-xs text-neutral-500 mb-1">{f.label}</label>
              {f.multiline ? (
                <textarea className="input" rows={3} value={block.props[f.key] ?? ""} onChange={(e) => setProp(f.key, e.target.value)} />
              ) : (
                <input className="input" value={block.props[f.key] ?? ""} onChange={(e) => setProp(f.key, e.target.value)} />
              )}
            </div>
          ))}
          {block.type === "spacer" && (
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Height</label>
              <select className="input" value={block.props.height ?? "md"} onChange={(e) => setProp("height", e.target.value)}>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </div>
          )}
          {!fields.length && block.type !== "spacer" && block.type !== "format_row" && (
            <p className="text-neutral-600 text-xs">No content options.</p>
          )}
          {block.type === "format_row" && (
            <p className="text-neutral-600 text-xs">Auto-generated from your active formats.</p>
          )}
        </div>
      </div>

      {block.type === "gallery" && <GalleryItemsEditor block={block} onChange={onChange} />}

      {block.type === "content_feed" && (
        <p className="text-neutral-600 text-xs">
          Pulls live, published content automatically — nothing to configure beyond the heading.
        </p>
      )}
      {block.type === "email_capture" && (
        <p className="text-neutral-600 text-xs">Signups are saved to your Leads list — visible to admins.</p>
      )}

      <div>
        <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Text Color</p>
        <div className="flex flex-wrap gap-2">
          {BRAND_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setStyle({ color: c })}
              className={`w-6 h-6 rounded-full border-2 ${block.style.color === c ? "border-gold" : "border-transparent"}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <input type="color" value={block.style.color ?? "#f5f5f5"} onChange={(e) => setStyle({ color: e.target.value })} className="w-6 h-6 bg-transparent" />
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Background</p>
        <div className="flex flex-wrap gap-2">
          {BRAND_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setStyle({ bg: c })}
              className={`w-6 h-6 rounded-full border-2 ${block.style.bg === c ? "border-gold" : "border-transparent"}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <button onClick={() => setStyle({ bg: undefined })} className="text-xs text-neutral-500 underline">
            None
          </button>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Typography</p>
        <div className="grid grid-cols-2 gap-2">
          <select className="input" value={block.style.fontSize ?? "base"} onChange={(e) => setStyle({ fontSize: e.target.value as BlockStyle["fontSize"] })}>
            {["sm", "base", "lg", "xl", "2xl", "3xl", "4xl"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select className="input" value={block.style.fontWeight ?? "normal"} onChange={(e) => setStyle({ fontWeight: e.target.value as BlockStyle["fontWeight"] })}>
            {["normal", "semibold", "bold", "extrabold"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Alignment</p>
        <div className="flex gap-2">
          {(["left", "center", "right"] as const).map((a) => (
            <button
              key={a}
              onClick={() => setStyle({ align: a })}
              className={`flex-1 px-2 py-1.5 rounded-lg text-xs border ${block.style.align === a ? "border-gold text-gold" : "border-border text-neutral-400"}`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Spacing</p>
        <select className="input" value={block.style.paddingY ?? "md"} onChange={(e) => setStyle({ paddingY: e.target.value as BlockStyle["paddingY"] })}>
          {["none", "sm", "md", "lg", "xl"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={!!block.style.rounded} onChange={(e) => setStyle({ rounded: e.target.checked })} /> Rounded
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={!!block.style.shadow} onChange={(e) => setStyle({ shadow: e.target.checked })} /> Shadow
        </label>
      </div>
    </div>
  );
}
