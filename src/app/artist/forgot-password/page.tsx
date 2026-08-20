"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/errors";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/artist/reset-password`,
    });
    if (resetError) {
      setError(friendlyAuthError(resetError.message));
      return;
    }
    setSent(true);
  }

  return (
    <main className="flex-1 max-w-sm mx-auto w-full px-6 py-24">
      <h1 className="text-2xl font-bold mb-6">Reset Password</h1>
      {sent ? (
        <p className="text-neutral-300">Check your email for a reset link.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" required placeholder="Email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" className="btn-gold w-full">Send Reset Link</button>
        </form>
      )}
    </main>
  );
}
