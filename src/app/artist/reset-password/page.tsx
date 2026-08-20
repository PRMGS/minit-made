"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/errors";

/**
 * Where a password-reset link actually lands.
 *
 * /auth/callback exchanges the recovery code for a session before redirecting
 * here, so this page always runs with the artist signed in — middleware bounces
 * anyone who arrives without a live session back to the login page.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Those two don't match. Type the same password in both boxes.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(friendlyAuthError(updateError.message));
      setSaving(false);
      return;
    }

    router.push("/artist/dashboard");
    router.refresh();
  }

  return (
    <main className="flex-1 max-w-sm mx-auto w-full px-6 py-24">
      <h1 className="text-2xl font-bold mb-2">Set a New Password</h1>
      <p className="text-sm text-neutral-400 mb-6">
        Pick something you&apos;ll remember — at least 8 characters. We&apos;ll take you straight to
        your dashboard.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="new-password" className="block text-sm text-neutral-400 mb-1">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-sm text-neutral-400 mb-1">
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={saving} className="btn-gold w-full">
          {saving ? "Saving…" : "Save Password"}
        </button>
      </form>
    </main>
  );
}
