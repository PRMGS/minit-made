"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/constants";
import type { Database } from "@/types/database.types";

type Config = Database["public"]["Tables"]["pricing_config"]["Row"];

const FIELDS: { key: keyof Config; label: string }[] = [
  { key: "video_production_price", label: "Video Production (base)" },
  { key: "bts_price", label: "BTS" },
  { key: "broll_price", label: "B-Roll" },
  { key: "audio_mix_price", label: "Audio Mix" },
  { key: "audio_mix_master_base_price", label: "Mix + Master" },
  { key: "photoshoot_price", label: "Photoshoot" },
  { key: "epk_basic_price", label: "Basic EPK" },
  { key: "epk_full_price", label: "Full EPK" },
  { key: "interview_price", label: "Interview" },
];

export default function PricingClient({ configs }: { configs: Config[] }) {
  const router = useRouter();
  return (
    <div className="space-y-6">
      {configs.map((c) => (
        <PricingCard key={c.id} config={c} onSaved={() => router.refresh()} />
      ))}
    </div>
  );
}

function PricingCard({ config, onSaved }: { config: Config; onSaved: () => void }) {
  // What's actually typed, kept separate from the parsed cents value.
  //
  // The field previously derived its `value` from cents on every render
  // (`(cents / 100).toFixed(2)`) and re-parsed on every keystroke. A
  // type="number" input reports `e.target.value` as "" for anything
  // mid-typed that isn't yet a complete valid number (a bare "300.", an
  // empty field, "300.5" the instant before the 5 lands) — that empty
  // string round-tripped through Number() → 0 → back through toFixed(2),
  // snapping the field to "0.00" or reverting the keystroke entirely. A raw
  // string per field, parsed only at save time, lets someone actually type.
  const [text, setText] = useState<Record<string, string>>(
    Object.fromEntries(FIELDS.map((f) => [f.key, (Number(config[f.key]) / 100).toFixed(2)]))
  );
  const [active, setActive] = useState(config.active);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    const cents = Object.fromEntries(
      FIELDS.map((f) => [f.key, Math.round((Number(text[f.key as string]) || 0) * 100)])
    );
    const body: Record<string, unknown> = { ...cents, active, reason };

    await fetch(`/api/admin/pricing/${config.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setSaved(true);
    onSaved();
  }

  const total = FIELDS.reduce((sum, f) => sum + (Number(text[f.key as string]) || 0) * 100, 0);

  return (
    <div className="card p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-gold capitalize">{config.format.replace(/_/g, " ")}</h2>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Active
        </label>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {FIELDS.map((f) => (
          <div key={String(f.key)}>
            <label className="block text-xs text-neutral-500 mb-1">{f.label}</label>
            <div className="flex items-center gap-1">
              <span className="text-neutral-500">$</span>
              <input
                type="text"
                inputMode="decimal"
                className="input"
                value={text[f.key as string]}
                onChange={(e) => setText({ ...text, [f.key as string]: e.target.value })}
                onBlur={() =>
                  setText((t) => ({
                    ...t,
                    [f.key as string]: (Number(t[f.key as string]) || 0).toFixed(2),
                  }))
                }
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <label className="block text-xs text-neutral-500 mb-1">Reason for change (optional, logged)</label>
        <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-neutral-500">Current total: {formatMoney(total)}</p>
        <button onClick={save} disabled={saving} className="btn-gold">
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
