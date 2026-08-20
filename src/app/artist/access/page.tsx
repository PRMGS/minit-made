"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ARTIST_ERRORS } from "@/lib/errors";

function AccessForm() {
  const params = useSearchParams();
  const expired = params.get("expired") === "1";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setMessage(typeof data.error === "string" ? data.error : ARTIST_ERRORS.generic);
        return;
      }
      setStatus("sent");
      setMessage(data.message ?? "If that email is on a booking, a sign-in link is on its way.");
    } catch {
      setStatus("error");
      setMessage(ARTIST_ERRORS.network);
    }
  }

  return (
    <main className="flex-1 max-w-sm mx-auto w-full px-6 py-24">
      <h1 className="text-2xl font-bold mb-2">Get Back In</h1>
      <p className="text-sm text-neutral-400 mb-6">
        {expired
          ? "That link's expired — they only last an hour. Drop your email and we'll send a fresh one."
          : "Use the email you booked with and we'll send you a link straight to your dashboard."}
      </p>

      {status === "sent" ? (
        <p className="text-sm text-green-400">{message}</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {status === "error" && message && <p className="text-red-400 text-sm">{message}</p>}
          <button type="submit" disabled={status === "loading"} className="btn-gold w-full">
            {status === "loading" ? "Sending…" : "Send My Link"}
          </button>
        </form>
      )}

      <p className="text-sm text-neutral-500 mt-6">
        Prefer a password? <Link href="/artist/login" className="text-gold">Sign in</Link>
      </p>
    </main>
  );
}

export default function ArtistAccessPage() {
  return (
    <Suspense>
      <AccessForm />
    </Suspense>
  );
}
