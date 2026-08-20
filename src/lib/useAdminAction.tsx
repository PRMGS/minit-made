"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseJsonResponse, toFriendlyMessage } from "@/lib/errors";

const FAILED = "That didn't save. Check your connection and try again.";

/**
 * One way to run an admin mutation and actually see it fail.
 *
 * Five handlers used to fire a PATCH or DELETE, ignore the response and call
 * router.refresh(). When the request failed the UI silently reverted to the
 * server value — indistinguishable from the click not registering.
 */
export function useAdminAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(
    input: string,
    init?: RequestInit,
    options?: { refresh?: boolean; failureMessage?: string }
  ): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(input, init);
      await parseJsonResponse(res, options?.failureMessage ?? FAILED);
      if (options?.refresh !== false) router.refresh();
      return true;
    } catch (e) {
      setError(toFriendlyMessage(e, options?.failureMessage ?? FAILED));
      return false;
    } finally {
      setBusy(false);
    }
  }

  function json(body: unknown, method: "POST" | "PATCH" = "PATCH"): RequestInit {
    return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
  }

  return { run, json, busy, error, setError };
}

/** Consistent, announced error banner for the admin surfaces. */
export function ActionError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="p-3 rounded-lg border border-red-500/50 bg-red-500/10 text-red-300 text-sm"
    >
      {message}
    </div>
  );
}
