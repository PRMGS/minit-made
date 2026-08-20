"use client";

import { useState } from "react";

export default function EmailCapture({
  label = "Minit Made Updates",
  heading = "Never Miss a Shoot Batch",
}: {
  label?: string;
  heading?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "landing_page" }),
      });
      if (!res.ok) throw new Error("lead submit failed");
      setStatus("done");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="border-t border-border bg-black">
      <div className="max-w-5xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold mb-3">{label}</p>
          <h2 className="text-4xl md:text-5xl font-extrabold">{heading}</h2>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              placeholder="Enter your email"
              className="input flex-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" disabled={status === "loading"} className="btn-gold whitespace-nowrap">
              {status === "loading" ? "Submitting…" : "Notify Me"}
            </button>
          </div>
          {status === "done" && <p className="text-sm text-green-400">You&apos;re on the list.</p>}
          {status === "error" && (
            <p className="text-sm text-red-400">That didn&apos;t go through. Check your email address and try again.</p>
          )}
        </form>
      </div>
    </section>
  );
}
