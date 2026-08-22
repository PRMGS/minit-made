"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type NavItem = { label: string; href: string };
export type Nav = { header: NavItem[]; footer: NavItem[] };
export const DEFAULT_NAV: Nav = { header: [], footer: [] };

function NavList({ title, items, onChange }: { title: string; items: NavItem[]; onChange: (items: NavItem[]) => void }) {
  function update(i: number, patch: Partial<NavItem>) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  function add() {
    onChange([...items, { label: "New Link", href: "/" }]);
  }

  return (
    <div className="card p-5 space-y-3">
      <h2 className="font-bold text-gold">{title}</h2>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input className="input" placeholder="Label" value={item.label} onChange={(e) => update(i, { label: e.target.value })} />
          <input className="input" placeholder="/link" value={item.href} onChange={(e) => update(i, { href: e.target.value })} />
          <button onClick={() => move(i, -1)} className="text-neutral-400 px-1">↑</button>
          <button onClick={() => move(i, 1)} className="text-neutral-400 px-1">↓</button>
          <button onClick={() => remove(i)} className="text-red-400 text-xs">Remove</button>
        </div>
      ))}
      <button onClick={add} className="text-sm border border-border rounded-lg px-3 py-1.5 hover:border-gold">+ Add Link</button>
    </div>
  );
}

export default function NavigationClient({ initial }: { initial: Nav }) {
  const router = useRouter();
  const [nav, setNav] = useState<Nav>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "navigation", value: nav }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <NavList title="Header Navigation" items={nav.header} onChange={(header) => setNav({ ...nav, header })} />
      <NavList title="Footer Navigation" items={nav.footer} onChange={(footer) => setNav({ ...nav, footer })} />
      <button onClick={save} disabled={saving} className="btn-gold">
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save Navigation"}
      </button>
    </div>
  );
}
