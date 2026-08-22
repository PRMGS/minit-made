"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/errors";

export default function CrewSignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/crew/dashboard` },
    });
    if (signUpError || !data.user) {
      setError(friendlyAuthError(signUpError?.message));
      setLoading(false);
      return;
    }

    if (!data.session) {
      setPendingConfirmation(true);
      setLoading(false);
      return;
    }

    const linkRes = await fetch("/api/auth/signup", { method: "POST" });
    const linkData = await linkRes.json();
    if (!linkRes.ok) {
      setError(linkData.error);
      setLoading(false);
      return;
    }

    router.push("/crew/dashboard");
  }

  return (
    <main className="flex-1 max-w-sm mx-auto w-full px-6 py-24">
      <h1 className="text-2xl font-bold mb-2">Set Up Your Crew Account</h1>
      <p className="text-sm text-neutral-400 mb-6">Use the email admin added you with.</p>
      {pendingConfirmation ? (
        <p className="text-sm text-neutral-300">
          Check your email to confirm your account, then log in.
        </p>
      ) : (
        <form onSubmit={handleSignup} className="space-y-4">
          <input type="email" required placeholder="Email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" required minLength={8} placeholder="Password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn-gold w-full">
            {loading ? "Creating account…" : "Set Up Account"}
          </button>
        </form>
      )}
    </main>
  );
}
