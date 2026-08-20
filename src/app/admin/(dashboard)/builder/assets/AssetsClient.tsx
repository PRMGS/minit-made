"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Asset = { name: string; url: string };

export default function AssetsClient({ assets }: { assets: Asset[] }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function upload(files: FileList) {
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "page-assets");
      await fetch("/api/upload", { method: "POST", body: fd });
    }
    setUploading(false);
    router.refresh();
  }

  function copy(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="space-y-6">
      <label className="card p-8 flex flex-col items-center justify-center border-dashed cursor-pointer hover:border-gold">
        <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => e.target.files && upload(e.target.files)} />
        <span className="text-neutral-400 text-sm">{uploading ? "Uploading…" : "Click to upload images"}</span>
      </label>

      <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {assets.map((a) => (
          <div key={a.name} className="card p-2">
            <img src={a.url} alt={a.name} className="rounded aspect-square object-cover w-full mb-2" />
            <button onClick={() => copy(a.url)} className="text-xs text-gold w-full text-left truncate hover:underline">
              {copied === a.url ? "Copied!" : "Copy URL"}
            </button>
          </div>
        ))}
        {!assets.length && <p className="text-neutral-500 text-sm col-span-full">No assets uploaded yet.</p>}
      </div>
    </div>
  );
}
