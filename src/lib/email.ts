import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  addOnLabel,
  contentTypeLabel,
  formatLabel,
  formatMoney,
  formatShootDate,
  formatSlotTime,
  submissionStatusLabel,
} from "@/lib/constants";
import { requireEnv, siteUrl } from "@/lib/env";

// Lazy: `next build` must not require secrets, but a missing key must still throw
// a named error rather than becoming a placeholder that fails silently at send time.
let _resend: Resend | null = null;
function resendClient(): Resend {
  if (!_resend) _resend = new Resend(requireEnv("RESEND_API_KEY"));
  return _resend;
}
const from = () => requireEnv("EMAIL_FROM");

/** Branded shell so every email reads as one product, not a receipt printer. */
function shell(body: string) {
  return `
  <div style="margin:0;padding:32px 16px;background:#000000;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#0a0a0a;border:1px solid #262626;border-radius:12px;padding:32px;">
      <div style="font-size:18px;font-weight:800;letter-spacing:-0.5px;color:#f5f5f5;margin-bottom:28px;">
        MINIT <span style="color:#ffd700;">MADE</span>
      </div>
      ${body}
    </div>
    <div style="max-width:560px;margin:16px auto 0;text-align:center;color:#525252;font-size:11px;">
      Minit Made
    </div>
  </div>`;
}

/**
 * Escapes user-supplied values before they go into email HTML.
 *
 * Every interpolation in this file goes through this or a label helper. Two
 * templates previously interpolated an artist name — and a URL straight into an
 * href — unescaped.
 */
function esc(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only ever emit links we built ourselves; anything else becomes inert. */
function safeUrl(raw: string | null | undefined): string {
  const value = String(raw ?? "").trim();
  return /^https?:\/\//i.test(value) ? esc(value) : "#";
}

function button(href: string, label: string) {
  return `<a href="${safeUrl(href)}" style="display:inline-block;background:#ffd700;color:#000000;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;">${esc(label)}</a>`;
}

const H1 = "font-size:26px;font-weight:800;color:#ffd700;margin:0 0 16px;letter-spacing:-0.5px;";
const P = "font-size:15px;line-height:1.6;color:#d4d4d4;margin:0 0 16px;";
const LABEL = "color:#737373;";
const FINE = "font-size:12px;line-height:1.6;color:#737373;margin:24px 0 0;padding-top:16px;border-top:1px solid #262626;";

export type SendOutcome = { status: "sent" | "failed" | "skipped"; detail?: string };

/**
 * Sends once and records the outcome.
 *
 * Every send writes an `email_deliveries` row so a bounce leaves a trace, and a
 * prior `sent` row short-circuits so a webhook redelivery cannot double-send.
 * Partial unique indexes on (booking_id, email_type) and (content_id, email_type)
 * back this up in the database, which the read-then-write check alone could not
 * do under two concurrent redeliveries.
 */
async function recordedSend(params: {
  emailType: string;
  recipient: string;
  subject: string;
  html: string;
  bookingId?: string | null;
  contentId?: string | null;
}): Promise<SendOutcome> {
  const { emailType, recipient, subject, html, bookingId = null, contentId = null } = params;
  const supabase = createAdminClient();

  const key = bookingId ? "booking_id" : "content_id";
  const keyValue = bookingId ?? contentId;
  if (!keyValue) return { status: "failed", detail: "no booking or content reference" };

  const { data: existing } = await supabase
    .from("email_deliveries")
    .select("id")
    .eq(key, keyValue)
    .eq("email_type", emailType)
    .eq("status", "sent")
    .maybeSingle();
  if (existing) return { status: "skipped", detail: "already sent" };

  const { data, error } = await resendClient().emails.send(
    { from: from(), to: recipient, subject, html },
    { idempotencyKey: `${emailType}-${keyValue}` }
  );

  if (error) {
    console.error("[email] send failed", { emailType, keyValue, error });
    await supabase.from("email_deliveries").insert({
      booking_id: bookingId,
      content_id: contentId,
      recipient,
      email_type: emailType,
      status: "failed",
      error: String(error.message ?? error),
    } as never);
    return { status: "failed", detail: String(error.message ?? error) };
  }

  const { error: logError } = await supabase.from("email_deliveries").insert({
    booking_id: bookingId,
    content_id: contentId,
    recipient,
    email_type: emailType,
    status: "sent",
    provider_id: data?.id ?? null,
  } as never);

  // A unique-index collision means a concurrent send won the race; the artist
  // still got exactly one email, which is the point.
  if (logError && logError.code !== "23505") {
    console.error("[email] delivery log failed after a successful send", { emailType, keyValue, logError });
  }

  return { status: "sent", detail: data?.id };
}

export type BookingConfirmationData = {
  artistName: string;
  format: string;
  shootDate: string | null;
  location: string | null;
  submissionStatus: string;
  addOns: { type: string; price: number }[];
  totalPrice: number;
  /** Magic-link URL that signs the artist straight into their dashboard. */
  dashboardUrl: string;
};

/** Pure HTML builder — kept separate from sending so it can be previewed and tested. */
export function buildBookingConfirmationHtml(data: BookingConfirmationData) {
  const { artistName, format, shootDate, location, submissionStatus, addOns, totalPrice, dashboardUrl } = data;

  const row = (label: string, value: string) =>
    `<p style="${P}"><span style="${LABEL}">${label}:</span> ${value}</p>`;

  return shell(`
    <h1 style="${H1}">You're In.</h1>
    <p style="${P}">Hey ${esc(artistName)} &mdash; your spot is locked. Here's everything you need.</p>

    ${row("Format", esc(formatLabel(format)))}
    ${row("Date", esc(formatShootDate(shootDate, "We'll be in touch")))}
    ${row("Location", esc(location) || "We&rsquo;ll be in touch")}
    ${row("Call time", "We'll send your exact time before the shoot")}
    ${row("Your track", esc(submissionStatusLabel(submissionStatus)))}

    ${
      addOns.length
        ? `<p style="${P}"><span style="${LABEL}">You added:</span></p>
           <ul style="margin:0 0 16px;padding-left:20px;color:#d4d4d4;font-size:15px;line-height:1.8;">
             ${addOns.map((a) => `<li>${esc(addOnLabel(a.type))} &mdash; ${esc(formatMoney(a.price))}</li>`).join("")}
           </ul>`
        : ""
    }
    ${row("Total paid", esc(formatMoney(totalPrice)))}

    <p style="${P}">Come ready to perform. Everything else is on us.</p>
    ${button(dashboardUrl, "Go to Your Dashboard")}
    <p style="font-size:12px;color:#737373;margin:12px 0 0;">
      Link expired? <a href="${safeUrl(`${siteUrl()}/artist/access`)}" style="color:#ffd700;">Get a new one</a>.
    </p>

    <p style="${FINE}">
      All purchases are non-refundable, and add-ons are final once payment completes.
      Cancellations 7 or more days before your shoot can be rebooked; cancellations
      within 7 days forfeit the booking.
    </p>
  `);
}

export async function sendBookingConfirmationEmail(
  bookingId: string,
  dashboardUrl?: string
): Promise<SendOutcome> {
  const supabase = createAdminClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, artists(*), shoot_batches(*), add_on_orders(*), music_submissions(*)")
    .eq("id", bookingId)
    .single();

  if (!booking || !booking.artists) {
    console.error("[email] confirmation skipped — booking or artist missing", { bookingId });
    return { status: "failed", detail: "booking or artist not found" };
  }

  return recordedSend({
    emailType: "booking_confirmation",
    recipient: booking.artists.email,
    subject: "You're in — Minit Made",
    bookingId,
    html: buildBookingConfirmationHtml({
      artistName: booking.artists.artist_name,
      format: booking.format,
      shootDate: booking.shoot_batches?.shoot_date ?? null,
      location: booking.shoot_batches?.location ?? null,
      submissionStatus: booking.music_submissions?.[0]?.submission_status ?? "submitted",
      addOns: (booking.add_on_orders ?? []).map((a) => ({ type: a.add_on_type, price: a.price_at_purchase })),
      totalPrice: booking.total_price,
      dashboardUrl: dashboardUrl ?? `${siteUrl()}/artist/access`,
    }),
  });
}

/**
 * "Your shoot is locked in."
 *
 * The booking page promises "we'll send your exact time before the shoot" and
 * nothing ever did — assigning a batch and call time notified no one. Keyed on a
 * distinct email_type so it can be sent once per booking alongside the
 * confirmation.
 */
export async function sendShootScheduledEmail(bookingId: string): Promise<SendOutcome> {
  const supabase = createAdminClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, format, assigned_slot_time, artists(artist_name, email), shoot_batches(shoot_date, location)")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking?.artists?.email) {
    return { status: "failed", detail: "booking or artist email not found" };
  }
  if (!booking.shoot_batches) {
    return { status: "skipped", detail: "no shoot assigned yet" };
  }

  const row = (label: string, value: string) =>
    `<p style="${P}"><span style="${LABEL}">${label}:</span> ${value}</p>`;

  return recordedSend({
    emailType: "shoot_scheduled",
    recipient: booking.artists.email,
    subject: "Your shoot date — Minit Made",
    bookingId,
    html: shell(`
      <h1 style="${H1}">You're Locked In.</h1>
      <p style="${P}">Hey ${esc(booking.artists.artist_name)} &mdash; here's where and when.</p>
      ${row("Format", esc(formatLabel(booking.format)))}
      ${row("Date", esc(formatShootDate(booking.shoot_batches.shoot_date)))}
      ${row("Location", esc(booking.shoot_batches.location))}
      ${row("Call time", esc(formatSlotTime(booking.assigned_slot_time, "We'll confirm this shortly")))}
      <p style="${P}">Arrive 30 minutes before your call time. Bring any wardrobe changes and be ready
      to perform your submitted track live.</p>
      ${button(`${siteUrl()}/artist/bookings/${booking.id}`, "View My Booking")}
      <p style="${FINE}">
        Cancellations 7 or more days before your shoot can be rebooked; cancellations
        within 7 days forfeit the booking.
      </p>
    `),
  });
}

/**
 * "Your moment is live."
 *
 * This is the payoff the whole product exists to deliver, and it previously
 * happened in silence — an admin flipped the status and the artist found out
 * only if they happened to open their dashboard.
 */
export async function sendContentLiveEmail(contentId: string): Promise<SendOutcome> {
  const supabase = createAdminClient();

  const { data: content } = await supabase
    .from("content_items")
    .select("id, title, content_type, youtube_url, status, artists(artist_name, email)")
    .eq("id", contentId)
    .maybeSingle();

  if (!content?.artists?.email) {
    return { status: "failed", detail: "content or artist email not found" };
  }
  if (content.status !== "live") {
    return { status: "skipped", detail: `status is ${content.status}` };
  }

  const watchUrl = content.youtube_url || `${siteUrl()}/artist/content`;

  return recordedSend({
    emailType: "content_live",
    recipient: content.artists.email,
    subject: "Your moment is live — Minit Made",
    contentId,
    html: shell(`
      <h1 style="${H1}">It's Live.</h1>
      <p style="${P}">Hey ${esc(content.artists.artist_name)},</p>
      <p style="${P}">
        <strong>${esc(content.title)}</strong> &mdash; ${esc(contentTypeLabel(content.content_type))} &mdash;
        is up. Go watch it, then go share it.
      </p>
      ${button(watchUrl, "Watch It")}
      <p style="font-size:12px;color:#737373;margin:12px 0 0;">
        Everything of yours lives at
        <a href="${safeUrl(`${siteUrl()}/artist/content`)}" style="color:#ffd700;">your dashboard</a>.
      </p>
    `),
  });
}

/**
 * Operational alert for cases a human must resolve (orphan payment, unclaimed
 * slot, amount mismatch). Never throws — an alert failure must not affect the
 * webhook response for an already-captured payment.
 */
export async function sendOpsAlert(subject: string, lines: string[]): Promise<void> {
  const body = lines.map((l) => `<p style="${P}">${esc(l)}</p>`).join("");
  try {
    await resendClient().emails.send({
      from: from(),
      to: from(),
      subject: `[Minit Made ops] ${subject}`,
      html: shell(`<h1 style="${H1}">${esc(subject)}</h1>${body}`),
    });
  } catch (e) {
    console.error("[ops-alert] failed to send", { subject, lines, error: e });
  }
}

export async function sendMagicLinkEmail(email: string, artistName: string, url: string) {
  await resendClient().emails.send({
    from: from(),
    to: email,
    subject: "Your sign-in link — Minit Made",
    html: shell(`
      <h1 style="${H1}">Here's Your Way In.</h1>
      <p style="${P}">Hey ${esc(artistName)},</p>
      <p style="${P}">Tap below to get straight into your dashboard. This link works once and expires within the hour.</p>
      ${button(url, "Open My Dashboard")}
      <p style="${FINE}">If you didn't ask for this, you can ignore it &mdash; nothing changes until the link is used.</p>
    `),
  });
}
