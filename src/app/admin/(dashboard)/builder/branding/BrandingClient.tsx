"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export type Branding = {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  backgroundColor: string;
  buttonStyle: "rounded" | "squared";
  headingFont: string;
  bodyFont: string;
};

export const DEFAULT_BRANDING: Branding = {
  logoUrl: "",
  primaryColor: "#ffd700",
  secondaryColor: "#b8960a",
  textColor: "#f5f5f5",
  backgroundColor: "#000000",
  buttonStyle: "rounded",
  headingFont: "",
  bodyFont: "",
};

export default function BrandingClient({ initial }: { initial: Branding }) {
  const router = useRouter();
  const [form, setForm] = useState<Branding>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function uploadLogo(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("bucket", "profile-images");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) setForm((f) => ({ ...f, logoUrl: data.url }));
    setUploading(false);
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "branding", value: form }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <label className="block text-sm text-neutral-400 mb-1">Logo</label>
        {form.logoUrl && (
          <Image src={form.logoUrl} alt="Logo" width={200} height={64} className="h-16 w-auto mb-2" />
        )}
        <input type="file" accept="image/*" className="input" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
        {uploading && <p className="text-xs text-gold mt-1">Uploading…</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {(["primaryColor", "secondaryColor", "textColor", "backgroundColor"] as const).map((key) => (
          <div key={key}>
            <label className="block text-sm text-neutral-400 mb-1 capitalize">{key.replace("Color", " color")}</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-10 h-10 bg-transparent" />
              <input className="input" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </div>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm text-neutral-400 mb-1">Button Style</label>
        <select className="input" value={form.buttonStyle} onChange={(e) => setForm({ ...form, buttonStyle: e.target.value as Branding["buttonStyle"] })}>
          <option value="rounded">Rounded</option>
          <option value="squared">Squared</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-neutral-400 mb-1">Heading Font</label>
          <input className="input" value={form.headingFont} onChange={(e) => setForm({ ...form, headingFont: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-neutral-400 mb-1">Body Font</label>
          <input className="input" value={form.bodyFont} onChange={(e) => setForm({ ...form, bodyFont: e.target.value })} />
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn-gold">
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save Branding"}
      </button>
      <p className="text-xs text-neutral-500">Applies globally; individual pages can still override block-level colors.</p>
    </div>
  );
}
