"use client";

import { useState } from "react";
import { ARTIST_ERRORS, parseJsonResponse, toFriendlyMessage } from "@/lib/errors";
import { formatMoney } from "@/lib/constants";

export default function ResumePayment({ bookingId, total }: { bookingId: string; total: number }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resume() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/resume`, { method: "POST" });
      const data = await parseJsonResponse(res, ARTIST_ERRORS.checkoutFailed);
      if (!data.url) throw new Error("missing checkout url");
      window.location.href = String(data.url);
    } catch (e) {
      setError(toFriendlyMessage(e, ARTIST_ERRORS.checkoutFailed));
      setBusy(false);
    }
  }

  return (
    <section className="card p-5 border-gold space-y-3">
      <h2 className="font-bold text-gold">Almost There</h2>
      <p className="text-sm text-neutral-300">
        This spot isn&apos;t locked until payment goes through. Everything you filled in is saved —
        pick up right where you left off.
      </p>
      {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
      <button onClick={resume} disabled={busy} className="btn-gold text-sm">
        {busy ? "Taking you to payment…" : `Finish Payment — ${formatMoney(total)}`}
      </button>
    </section>
  );
}
