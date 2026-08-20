"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SUPPORT_EMAIL } from "@/lib/errors";

/**
 * Polls briefly while the webhook settles, then stops and hands the artist a
 * next step rather than spinning forever.
 */
export default function ConfirmationPoller({
  bookingId,
  sessionId,
}: {
  bookingId: string;
  sessionId: string;
}) {
  const router = useRouter();
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const started = Date.now();

    const tick = async () => {
      if (cancelled) return;
      if (Date.now() - started > 30_000) {
        setGaveUp(true);
        return;
      }
      try {
        const res = await fetch(
          `/api/bookings/${bookingId}/status?session_id=${encodeURIComponent(sessionId)}`
        );
        const data = await res.json().catch(() => ({}));
        if (!cancelled && data.confirmed) {
          router.refresh();
          return;
        }
      } catch {
        // keep trying until the deadline
      }
      if (!cancelled) setTimeout(tick, 3000);
    };

    const id = setTimeout(tick, 2000);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [bookingId, sessionId, router]);

  if (!gaveUp) {
    return <p className="text-sm text-neutral-500">Checking…</p>;
  }

  return (
    <p className="text-sm text-neutral-400">
      This is taking longer than usual. Your payment went through — check your email, and if
      nothing lands, reach us at{" "}
      <a href={`mailto:${SUPPORT_EMAIL}`} className="text-gold">
        {SUPPORT_EMAIL}
      </a>
      .
    </p>
  );
}
