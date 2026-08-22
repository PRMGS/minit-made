import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatLabel, formatSlotTime } from "@/lib/constants";
import { requireEnv } from "@/lib/env";

/**
 * One-way projection: Minit Made -> Google Calendar, never the reverse. Every
 * function here either reads shoot_batches to build an event, or writes back
 * only the two sync bookkeeping columns (google_calendar_event_id,
 * google_calendar_sync_error) on the batch it just synced — nothing here ever
 * reads from Google to mutate booking/scheduling state.
 *
 * All Google calls use plain fetch, not the `googleapis` package — that
 * package's Node HTTP transport (gaxios) has the same workerd-hanging risk
 * that forced src/lib/stripe.ts onto Stripe.createFetchHttpClient().
 */

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";

export type SyncOutcome = { status: "synced" | "skipped" | "failed"; detail?: string };

type CalendarIntegration = {
  singleton: boolean;
  refresh_token: string;
  calendar_id: string;
  connected_by: string;
  connected_at: string;
};

/** Reads the single shared studio integration row. Null means not connected — the normal case for most of this app's lifetime. */
export async function getIntegration(): Promise<CalendarIntegration | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("calendar_integrations")
    .select("*")
    .eq("singleton", true)
    .maybeSingle();
  return data ?? null;
}

export async function saveIntegration(params: {
  refreshToken: string;
  calendarId: string;
  connectedBy: string;
}): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("calendar_integrations")
    .upsert(
      {
        singleton: true,
        refresh_token: params.refreshToken,
        calendar_id: params.calendarId,
        connected_by: params.connectedBy,
        connected_at: new Date().toISOString(),
      } as never,
      { onConflict: "singleton" }
    );
}

/** Disconnects and clears every batch's stale event id — a reconnect creates a new calendar with new ids. */
export async function clearIntegration(): Promise<void> {
  const admin = createAdminClient();
  const integration = await getIntegration();
  if (integration?.refresh_token) {
    await revokeToken(integration.refresh_token);
  }
  await admin.from("calendar_integrations").delete().eq("singleton", true);
  await admin
    .from("shoot_batches")
    .update({ google_calendar_event_id: null, google_calendar_sync_error: null } as never)
    .not("google_calendar_event_id", "is", null);
}

async function revokeToken(token: string): Promise<void> {
  try {
    await fetch(`${GOOGLE_REVOKE_URL}?token=${encodeURIComponent(token)}`, { method: "POST" });
  } catch (e) {
    // Best-effort — the integration row is deleted regardless.
    console.warn("[googleCalendar] token revoke failed", e);
  }
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken: string | null } | null> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: requireEnv("GOOGLE_OAUTH_CLIENT_ID"),
      client_secret: requireEnv("GOOGLE_OAUTH_CLIENT_SECRET"),
    }),
  });
  if (!res.ok) {
    console.error("[googleCalendar] code exchange failed", { status: res.status, body: await res.text() });
    return null;
  }
  const data = (await res.json()) as { access_token: string; refresh_token?: string };
  return { accessToken: data.access_token, refreshToken: data.refresh_token ?? null };
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: requireEnv("GOOGLE_OAUTH_CLIENT_ID"),
      client_secret: requireEnv("GOOGLE_OAUTH_CLIENT_SECRET"),
    }),
  });
  if (!res.ok) {
    console.error("[googleCalendar] token refresh failed", { status: res.status, body: await res.text() });
    return null;
  }
  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

/** Creates the dedicated "Minit Made Shoots" calendar on the connecting account so studio events never mix with personal ones. */
export async function createDedicatedCalendar(accessToken: string): Promise<{ id: string } | null> {
  const res = await fetch(`${CALENDAR_API}/calendars`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      summary: "Minit Made Shoots",
      description: "Auto-managed by the Minit Made admin dashboard. Do not edit events here directly — changes will be overwritten on the next sync.",
      timeZone: "America/New_York",
    }),
  });
  if (!res.ok) {
    console.error("[googleCalendar] calendar creation failed", { status: res.status, body: await res.text() });
    return null;
  }
  return res.json();
}

export function calendarOAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("GOOGLE_OAUTH_CLIENT_ID"),
    redirect_uri: redirectUri,
    response_type: "code",
    scope: CALENDAR_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

type EventApiResult = { ok: boolean; eventId?: string; detail?: string; status?: number };

async function createEvent(accessToken: string, calendarId: string, payload: unknown): Promise<EventApiResult> {
  const res = await fetch(`${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    return { ok: false, status: res.status, detail: `create ${res.status}: ${await res.text()}` };
  }
  const data = (await res.json()) as { id: string };
  return { ok: true, eventId: data.id };
}

async function updateEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  payload: unknown
): Promise<EventApiResult> {
  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) {
    return { ok: false, status: res.status, detail: `update ${res.status}: ${await res.text()}` };
  }
  return { ok: true, eventId };
}

async function deleteEvent(accessToken: string, calendarId: string, eventId: string): Promise<EventApiResult> {
  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
  );
  // 404/410 both mean "already gone," which is the outcome we wanted.
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    return { ok: false, status: res.status, detail: `delete ${res.status}: ${await res.text()}` };
  }
  return { ok: true };
}

/** Google's all-day end.date is exclusive, so a one-day event needs shoot_date + 1. Parsed component-wise like formatShootDate — a plain Date(string) is UTC midnight and would drift a day in negative-offset timezones if ever rendered locally instead of just re-serialized. */
function addOneDay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

type BatchForSync = {
  id: string;
  format: string;
  shoot_date: string;
  location: string;
  status: string;
  current_artists: number;
  max_artists: number;
  google_calendar_event_id: string | null;
  shoot_batch_crew: { role: string | null; crew_members: { name: string } | null }[];
  bookings: {
    id: string;
    status: string;
    assigned_slot_time: string | null;
    artists: { artist_name: string } | null;
  }[];
};

/** Pure builder, kept separate from the network call so it can be tested/previewed on its own. */
export function buildBatchEventPayload(batch: BatchForSync) {
  const crewLine = batch.shoot_batch_crew.length
    ? batch.shoot_batch_crew
        .map((c) => `${c.crew_members?.name ?? "Unknown"}${c.role ? ` (${c.role})` : ""}`)
        .join(", ")
    : "None assigned";

  const roster = batch.bookings.filter((b) => b.status !== "cancelled");
  const rosterLines = roster.length
    ? roster
        .map((b) => `• ${b.artists?.artist_name ?? "Unknown artist"} — ${formatSlotTime(b.assigned_slot_time, "call time TBD")}`)
        .join("\n")
    : "No artists booked yet";

  const description = [
    `Status: ${batch.status}`,
    `Artists: ${batch.current_artists}/${batch.max_artists}`,
    `Crew: ${crewLine}`,
    "",
    "Roster:",
    rosterLines,
    "",
    "Synced from the Minit Made admin dashboard — changes made here will be overwritten.",
  ].join("\n");

  return {
    summary: `${formatLabel(batch.format)} Shoot — ${batch.location}`,
    location: batch.location,
    description,
    start: { date: batch.shoot_date },
    end: { date: addOneDay(batch.shoot_date) },
    extendedProperties: { private: { minit_made_batch_id: batch.id } },
  };
}

/**
 * Creates or updates the one Calendar event for a batch. Never throws — every
 * failure path returns {status:"failed"} so a Calendar outage can never break
 * the admin action or webhook that triggered the sync (Architectural rule 5).
 * Failures are also written to google_calendar_sync_error on the batch row so
 * they stay visible after the triggering request is long over (rule 6).
 */
export async function syncBatchToCalendar(batchId: string): Promise<SyncOutcome> {
  try {
    const integration = await getIntegration();
    if (!integration) return { status: "skipped", detail: "not connected" };

    const accessToken = await refreshAccessToken(integration.refresh_token);
    if (!accessToken) return { status: "failed", detail: "token refresh failed" };

    const admin = createAdminClient();
    const { data: batch, error } = await admin
      .from("shoot_batches")
      .select(
        "*, shoot_batch_crew(role, crew_members(name)), bookings(id, status, assigned_slot_time, artists(artist_name))"
      )
      .eq("id", batchId)
      .maybeSingle();

    if (error || !batch) {
      return { status: "failed", detail: error?.message ?? "batch not found" };
    }

    const payload = buildBatchEventPayload(batch as unknown as BatchForSync);
    const calendarId = integration.calendar_id;
    const wasNew = !batch.google_calendar_event_id;

    let outcome = wasNew
      ? await createEvent(accessToken, calendarId, payload)
      : await updateEvent(accessToken, calendarId, batch.google_calendar_event_id!, payload);

    // Event or calendar vanished out from under us (manual deletion in Google's
    // UI, or a stale id) — recreate rather than fail forever.
    if (!outcome.ok && outcome.status === 404 && !wasNew) {
      outcome = await createEvent(accessToken, calendarId, payload);
    }

    if (!outcome.ok) {
      console.error("[googleCalendar] sync failed", { batchId, detail: outcome.detail });
      await admin
        .from("shoot_batches")
        .update({ google_calendar_sync_error: outcome.detail ?? "unknown error" } as never)
        .eq("id", batchId);
      return { status: "failed", detail: outcome.detail };
    }

    if (wasNew && outcome.eventId) {
      // Conditional claim: if a concurrent sync already set an event id first,
      // this matches zero rows and we delete the duplicate we just created.
      const { data: claimed } = await admin
        .from("shoot_batches")
        .update({ google_calendar_event_id: outcome.eventId, google_calendar_sync_error: null } as never)
        .eq("id", batchId)
        .is("google_calendar_event_id", null)
        .select("id");

      if (!claimed?.length) {
        await deleteEvent(accessToken, calendarId, outcome.eventId);
      }
    } else {
      await admin
        .from("shoot_batches")
        .update({
          ...(outcome.eventId && outcome.eventId !== batch.google_calendar_event_id
            ? { google_calendar_event_id: outcome.eventId }
            : {}),
          google_calendar_sync_error: null,
        } as never)
        .eq("id", batchId);
    }

    return { status: "synced" };
  } catch (e) {
    console.error("[googleCalendar] sync threw", { batchId, error: e });
    return { status: "failed", detail: e instanceof Error ? e.message : "unknown error" };
  }
}

/** Deletes a batch's Calendar event — used on hard delete and on cancellation. Never throws, same contract as syncBatchToCalendar. */
export async function deleteBatchCalendarEvent(batchId: string): Promise<SyncOutcome> {
  try {
    const integration = await getIntegration();
    if (!integration) return { status: "skipped", detail: "not connected" };

    const admin = createAdminClient();
    const { data: batch } = await admin
      .from("shoot_batches")
      .select("google_calendar_event_id")
      .eq("id", batchId)
      .maybeSingle();

    if (!batch?.google_calendar_event_id) {
      return { status: "skipped", detail: "no event to delete" };
    }

    const accessToken = await refreshAccessToken(integration.refresh_token);
    if (!accessToken) return { status: "failed", detail: "token refresh failed" };

    const result = await deleteEvent(accessToken, integration.calendar_id, batch.google_calendar_event_id);
    if (!result.ok) {
      console.error("[googleCalendar] delete failed", { batchId, detail: result.detail });
      await admin
        .from("shoot_batches")
        .update({ google_calendar_sync_error: result.detail ?? "unknown error" } as never)
        .eq("id", batchId);
      return { status: "failed", detail: result.detail };
    }

    await admin
      .from("shoot_batches")
      .update({ google_calendar_event_id: null, google_calendar_sync_error: null } as never)
      .eq("id", batchId);

    return { status: "synced" };
  } catch (e) {
    console.error("[googleCalendar] delete threw", { batchId, error: e });
    return { status: "failed", detail: e instanceof Error ? e.message : "unknown error" };
  }
}
