"use client";

import { useEffect } from "react";
import Link from "next/link";
import { SUPPORT_EMAIL } from "@/lib/errors";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[render error]", error);
  }, [error]);

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-24">
      <div className="text-center max-w-md">
        <p className="text-xs uppercase tracking-[0.3em] text-gold mb-4">Hit a Snag</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">Something Broke</h1>
        <p className="text-neutral-400 mb-8">
          That&apos;s on us, not you. Nothing you&apos;ve submitted was lost — try again, and if it
          keeps happening reach us at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-gold">{SUPPORT_EMAIL}</a>.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset} className="btn-gold">Try Again</button>
          <Link
            href="/"
            className="border border-border rounded-lg px-6 py-3 text-neutral-200 hover:border-gold transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
