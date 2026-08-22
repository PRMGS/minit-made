"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAdminAction, ActionError } from "@/lib/useAdminAction";

const ERROR_COPY: Record<string, string> = {
  access_denied: "You declined access on Google's consent screen.",
  state_mismatch: "That connection attempt expired or didn't match. Try connecting again.",
  token_exchange_failed: "Google didn't return a usable token. Try connecting again.",
  no_refresh_token:
    "Google didn't grant a refresh token — this happens if Minit Made was already authorized on that account. Remove it at myaccount.google.com/permissions, then connect again.",
  calendar_creation_failed: "Couldn't create the Minit Made Shoots calendar on that account. Try again.",
};

type ResyncResult = { synced: number; skipped: number; failed: number; errors: { batchId: string; detail?: string }[] };

export default function CalendarSettingsClient({
  connected,
  connectedBy,
  connectedAt,
  calendarId,
}: {
  connected: boolean;
  connectedBy: string | null;
  connectedAt: string | null;
  calendarId: string | null;
}) {
  const params = useSearchParams();
  const oauthError = params.get("error");
  const justConnected = params.get("connected") === "1";

  const { run, error, busy } = useAdminAction();
  const [resyncing, setResyncing] = useState(false);
  const [resyncResult, setResyncResult] = useState<ResyncResult | null>(null);

  async function disconnect() {
    setResyncResult(null);
    await run("/api/admin/calendar/disconnect", { method: "POST" }, { failureMessage: "Couldn't disconnect. Try again." });
  }

  async function resync() {
    setResyncing(true);
    setResyncResult(null);
    try {
      const res = await fetch("/api/admin/calendar/resync", { method: "POST" });
      const data = (await res.json()) as ResyncResult;
      setResyncResult(data);
    } finally {
      setResyncing(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      {oauthError && (
        <div role="alert" className="p-3 rounded-lg border border-red-500/50 bg-red-500/10 text-red-300 text-sm">
          {ERROR_COPY[oauthError] ?? "Something went wrong connecting Google Calendar."}
        </div>
      )}
      {justConnected && (
        <div className="p-3 rounded-lg border border-green-500/50 bg-green-500/10 text-green-300 text-sm">
          Connected — the &quot;Minit Made Shoots&quot; calendar is now syncing.
        </div>
      )}

      <div className="card p-5 space-y-3 text-sm">
        <h2 className="font-bold text-gold">Google Calendar</h2>
        <p className="text-neutral-400">
          Every shoot batch is mirrored to one shared &quot;Minit Made Shoots&quot; Google Calendar as it&apos;s created,
          edited, or cancelled here. This dashboard stays the source of truth — Calendar only reflects it.
        </p>

        {connected ? (
          <>
            <p className="text-neutral-300">
              <span className="text-neutral-500">Connected by:</span> {connectedBy}
            </p>
            {connectedAt && (
              <p className="text-neutral-300">
                <span className="text-neutral-500">Since:</span> {new Date(connectedAt).toLocaleString()}
              </p>
            )}
            {calendarId && (
              <p className="text-neutral-500 text-xs break-all">Calendar ID: {calendarId}</p>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={resync} disabled={resyncing} className="btn-gold">
                {resyncing ? "Resyncing…" : "Resync all batches"}
              </button>
              <button
                onClick={disconnect}
                disabled={busy}
                className="border border-border rounded-lg px-4 py-2 text-sm hover:border-red-500 hover:text-red-400"
              >
                {busy ? "Disconnecting…" : "Disconnect"}
              </button>
            </div>
            <ActionError message={error} />
            {resyncResult && (
              <p className="text-xs text-neutral-400 pt-1">
                Synced {resyncResult.synced}, skipped {resyncResult.skipped}, failed {resyncResult.failed}
                {resyncResult.failed > 0 && " — check server logs for details."}
              </p>
            )}
          </>
        ) : (
          <Link href="/api/admin/calendar/connect" className="btn-gold inline-block">
            Connect Google Calendar
          </Link>
        )}
      </div>
    </div>
  );
}
