"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TEMPLATES } from "@/lib/templates";

export default function NewPageForm() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState("blank");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const chosen = TEMPLATES.find((t) => t.key === template);
    const res = await fetch("/api/admin/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, title, blocks: chosen?.blocks() ?? [] }),
    });
    const data = await res.json();
    if (data.error) setError(data.error);
    else router.push(`/admin/builder/pages/${data.page.id}`);
  }

  return (
    <form onSubmit={submit} className="card p-4 flex flex-wrap gap-3 items-end">
      <div>
        <label className="block text-xs text-neutral-500 mb-1">URL slug</label>
        <input required className="input" placeholder="help" value={slug} onChange={(e) => setSlug(e.target.value)} />
      </div>
      <div>
        <label className="block text-xs text-neutral-500 mb-1">Title</label>
        <input required className="input" placeholder="Help Page" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="block text-xs text-neutral-500 mb-1">Template</label>
        <select className="input" value={template} onChange={(e) => setTemplate(e.target.value)}>
          {TEMPLATES.map((t) => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn-gold">Create Page</button>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </form>
  );
}
