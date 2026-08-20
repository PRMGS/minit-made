"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/errors";
import { safeNext } from "@/lib/safeNext";
import Link from "next/link";

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
    router.push(safeNext(params.get("next"), "/crew/dashboard"));
    router.refresh();
  }

  return (
    <main className="flex-1 max-w-sm mx-auto w-full px-6 py-24">
      <h1 className="text-2xl font-bold mb-6">Crew Login</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input type="email" required placeholder="Email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" required placeholder="Password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="btn-gold w-full">
          {loading ? "Logging in…" : "Log In"}
        </button>
      </form>
      <p className="text-sm text-neutral-500 mt-6">
        First time? <Link href="/crew/signup" className="text-gold">Set up your account</Link>
      </p>
    </main>
  );
}

export default function CrewLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
