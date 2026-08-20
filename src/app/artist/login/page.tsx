"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/errors";
import Link from "next/link";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) {
      setError(friendlyAuthError(loginError.message));
      setLoading(false);
      return;
    }
    router.push(params.get("next") ?? "/artist/dashboard");
    router.refresh();
  }

  return (
    <main className="flex-1 max-w-sm mx-auto w-full px-6 py-24">
      <h1 className="text-2xl font-bold mb-6">Artist Login</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input type="email" required placeholder="Email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" required placeholder="Password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="btn-gold w-full">
          {loading ? "Logging in…" : "Log In"}
        </button>
      </form>
      <p className="text-sm text-neutral-500 mt-6">
        No account yet? <Link href="/artist/signup" className="text-gold">Sign up</Link>
      </p>
      <p className="text-sm text-neutral-500 mt-2">
        <Link href="/artist/forgot-password" className="text-gold">Forgot password?</Link>
      </p>
    </main>
  );
}

export default function ArtistLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
