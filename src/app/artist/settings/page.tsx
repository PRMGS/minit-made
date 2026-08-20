"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/errors";
import { useRouter } from "next/navigation";

export default function ArtistSettingsPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setStatus(error ? friendlyAuthError(error.message) : "Password updated.");
    setPassword("");
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/artist/login");
  }

  return (
    <div className="max-w-sm space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      <form onSubmit={handlePasswordChange} className="space-y-3">
        <label className="block text-sm text-neutral-400">New Password</label>
        <input type="password" minLength={8} required className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        {status && <p className="text-sm text-neutral-400">{status}</p>}
        <button type="submit" className="btn-gold">Update Password</button>
      </form>

      <button onClick={handleLogout} className="border border-border rounded-lg px-4 py-2 text-sm hover:border-gold">
        Log Out
      </button>
    </div>
  );
}
