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
  const [form, setForm] = useState<Record<string, number>>(
    Object.fromEntries(FIELDS.map((f) => [f.key, Number(config[f.key])]))
  );
  const [active, setActive] = useState(config.active);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    // form already stores cents
    const body: Record<string, unknown> = { ...form, active, reason };

    await fetch(`/api/admin/pricing/${config.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setSaved(true);
    onSaved();
  }

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
                type="number"
                step="0.01"
                className="input"
                value={(form[f.key as string] / 100).toFixed(2)}
                onChange={(e) =>
                  setForm({ ...form, [f.key as string]: Math.round(Number(e.target.value) * 100) })
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
        <p className="text-xs text-neutral-500">
          Current total: {formatMoney(Object.values(form).reduce((a, b) => a + b, 0))}
        </p>
        <button onClick={save} disabled={saving} className="btn-gold">
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
