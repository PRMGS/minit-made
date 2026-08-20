"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";
import Image from "next/image";

type Artist = Database["public"]["Tables"]["artists"]["Row"];

export default function ProfileForm({ artist }: { artist: Artist }) {
  const [form, setForm] = useState({
    artist_name: artist.artist_name,
    bio: artist.bio ?? "",
    city: artist.city ?? "",
    instagram: artist.instagram ?? "",
    tiktok: artist.tiktok ?? "",
    youtube: artist.youtube ?? "",
    spotify: artist.spotify ?? "",
    soundcloud: artist.soundcloud ?? "",
    apple_music: artist.apple_music ?? "",
    profile_image_url: artist.profile_image_url ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  const completeness = Math.round(
    (Object.values(form).filter((v) => v && v.length > 0).length / Object.keys(form).length) * 100
  );

  async function handleImageUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("bucket", "profile-images");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) setForm((f) => ({ ...f, profile_image_url: data.url }));
    setUploading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    await supabase.from("artists").update(form).eq("id", artist.id);
    setSaving(false);
    setSaved(true);
  }

  return (
    <form onSubmit={handleSave} className="space-y-4 max-w-xl">
      <div className="text-xs text-neutral-500">Profile completeness: {completeness}%</div>
      <div className="h-1 bg-border rounded-full overflow-hidden mb-4">
        <div className="h-full bg-gold" style={{ width: `${completeness}%` }} />
      </div>

      {form.profile_image_url && (
        <Image
          src={form.profile_image_url}
          alt="Your profile picture"
          width={96}
          height={96}
          className="w-24 h-24 rounded-full object-cover"
        />
      )}
      <input
        type="file"
        accept="image/*"
        className="input"
        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
      />
      {uploading && <p className="text-xs text-gold">Uploading…</p>}

      <label className="block text-sm text-neutral-400">Artist Name</label>
      <input className="input" value={form.artist_name} onChange={(e) => setForm({ ...form, artist_name: e.target.value })} />

      <label className="block text-sm text-neutral-400">Bio</label>
      <textarea className="input" rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />

      <label className="block text-sm text-neutral-400">City</label>
      <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />

      <label className="block text-sm text-neutral-400">Instagram</label>
      <input className="input" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />

      <label className="block text-sm text-neutral-400">TikTok</label>
      <input className="input" value={form.tiktok} onChange={(e) => setForm({ ...form, tiktok: e.target.value })} />

      <label className="block text-sm text-neutral-400">YouTube</label>
      <input className="input" value={form.youtube} onChange={(e) => setForm({ ...form, youtube: e.target.value })} />

      <label className="block text-sm text-neutral-400">Spotify</label>
      <input className="input" value={form.spotify} onChange={(e) => setForm({ ...form, spotify: e.target.value })} />

      <label className="block text-sm text-neutral-400">SoundCloud</label>
      <input className="input" value={form.soundcloud} onChange={(e) => setForm({ ...form, soundcloud: e.target.value })} />

      <label className="block text-sm text-neutral-400">Apple Music</label>
      <input className="input" value={form.apple_music} onChange={(e) => setForm({ ...form, apple_music: e.target.value })} />

      <button type="submit" disabled={saving} className="btn-gold">
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save Profile"}
      </button>
    </form>
  );
}
