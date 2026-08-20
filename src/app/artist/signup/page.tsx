"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ARTIST_ERRORS, friendlyAuthError, readApiError } from "@/lib/errors";
import Link from "next/link";

export default function ArtistSignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError || !data.user) {
      setError(friendlyAuthError(signUpError?.message));
      setLoading(false);
      return;
    }

    const linkRes = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auth_user_id: data.user.id, email, role: "artist" }),
    });
    const linkData = await linkRes.json();
    if (!linkRes.ok) {
      setError(readApiError(linkData, ARTIST_ERRORS.noAccountYet));
      setLoading(false);
      return;
    }

    router.push("/artist/dashboard");
  }

  return (
    <main className="flex-1 max-w-sm mx-auto w-full px-6 py-24">
      <h1 className="text-2xl font-bold mb-2">Create Your Account</h1>
      <p className="text-sm text-neutral-400 mb-6">
        Use the same email you booked with to unlock your dashboard.
      </p>
      <form onSubmit={handleSignup} className="space-y-4">
        <input type="email" required placeholder="Email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" required minLength={8} placeholder="Password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="btn-gold w-full">
          {loading ? "Creating account…" : "Sign Up"}
        </button>
      </form>
      <p className="text-sm text-neutral-500 mt-6">
        Already have an account? <Link href="/artist/login" className="text-gold">Log in</Link>
      </p>
    </main>
  );
}
