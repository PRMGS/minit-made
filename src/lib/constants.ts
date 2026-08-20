export const FORMATS = [
  {
    id: "hanging_mic",
    name: "Hanging Mic",
    description: "Studio performance with microphone and V-flat",
  },
  {
    id: "running_gun",
    name: "Running Gun",
    description: "Street-style performance at an approved location",
  },
  {
    id: "mic_d_up_cypher",
    name: "Mic'd Up Cypher",
    description: "Group freestyle/cypher performance",
  },
  {
    id: "city_on_fire",
    name: "City on Fire",
    description: "Featured city spotlight performance",
  },
] as const;

export type FormatId = (typeof FORMATS)[number]["id"];

export const ADD_ON_TYPES = [
  { id: "bts", label: "BTS", priceField: "bts_price" },
  { id: "broll", label: "B-Roll", priceField: "broll_price" },
  { id: "audio_mix", label: "Audio Mix", priceField: "audio_mix_price" },
  { id: "mix_master", label: "Mix + Master", priceField: "audio_mix_master_base_price" },
  { id: "photoshoot", label: "Professional Photoshoot", priceField: "photoshoot_price" },
  { id: "epk_basic", label: "Basic EPK", priceField: "epk_basic_price" },
  { id: "epk_full", label: "Full EPK", priceField: "epk_full_price" },
  { id: "interview", label: "Interview", priceField: "interview_price" },
] as const;

export type AddOnType = (typeof ADD_ON_TYPES)[number]["id"];

export const INTERVIEW_QUESTIONS = [
  { key: "q1_what_minit_made_means", question: "What does Minit Made mean to you?" },
  { key: "q2_inspiration", question: "What inspires you?" },
  { key: "q3_collab_with", question: "Who would you collaborate with?" },
  { key: "q4_whats_next", question: "What's next?" },
  { key: "q5_why_minit_made", question: "Why Minit Made?" },
  { key: "q6_representing_city", question: "How are you representing your city?" },
  { key: "q7_sound_one_word", question: "Describe your sound in one word." },
] as const;

export const TERMS_VERSION = "1.0";

export const BOOKING_STATUSES = [
  "pending",
  "payment_pending",
  "confirmed",
  "scheduled",
  "completed",
  "content_ready",
  "cancelled",
] as const;

export function formatMoney(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: "Getting Started",
  payment_pending: "Almost There",
  confirmed: "You're In",
  scheduled: "Locked In",
  completed: "Shot Complete",
  content_ready: "Content Live",
  cancelled: "Cancelled",
};

export function bookingStatusLabel(status: string) {
  return BOOKING_STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

/**
 * Formats a DATE column ("YYYY-MM-DD") for artists.
 * Parsed component-wise on purpose: `new Date("2026-09-02")` is UTC midnight,
 * which renders as the previous day in any negative-offset timezone.
 */
export function formatShootDate(date: string | null | undefined, fallback = "Date TBD") {
  if (!date) return fallback;
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return fallback;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatSlotTime(iso: string | null | undefined, fallback: string) {
  if (!iso) return fallback;
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return fallback;
  return dt.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatLabel(format: string) {
  return FORMATS.find((f) => f.id === format)?.name ?? format.replace(/_/g, " ");
}

export function addOnLabel(addOn: string) {
  return ADD_ON_TYPES.find((a) => a.id === addOn)?.label ?? addOn.replace(/_/g, " ");
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  performance: "Performance",
  freestyle: "Freestyle",
  cypher: "Cypher",
  city_spotlight: "City Spotlight",
  bts: "Behind The Scenes",
  broll: "B-Roll",
  interview: "Interview",
};

export function contentTypeLabel(type: string) {
  return CONTENT_TYPE_LABELS[type] ?? type.replace(/_/g, " ");
}

const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  pending: "Waiting on You",
  submitted: "In Review",
  reviewed: "Reviewed",
  approved: "Approved",
  needs_revision: "Needs a Tweak",
};

export function submissionStatusLabel(status: string) {
  return SUBMISSION_STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

const PRODUCTION_STATUS_LABELS: Record<string, string> = {
  pending: "Queued",
  in_production: "In The Works",
  ready: "Ready",
  delivered: "Delivered",
};

export function productionStatusLabel(status: string) {
  return PRODUCTION_STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}
