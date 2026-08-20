import { z } from "zod";
import { ADD_ON_TYPES, FORMATS, type AddOnType, type FormatId } from "@/lib/constants";

/**
 * Request schemas for the public API.
 *
 * Two rules shape these. Optional text arrives from the apply form as "" rather
 * than absent, so empty collapses to undefined instead of failing. And every
 * field is length-capped: these endpoints are unauthenticated, and an uncapped
 * `lyrics` is an open invitation to store a novel per request.
 */

const FORMAT_IDS = FORMATS.map((f) => f.id) as unknown as [FormatId, ...FormatId[]];
const ADD_ON_IDS = ADD_ON_TYPES.map((a) => a.id) as unknown as [AddOnType, ...AddOnType[]];

/**
 * Page content is stored in a jsonb column, so validate it as actual JSON
 * rather than `unknown` — this rejects undefined, functions and NaN, which
 * would otherwise be silently dropped or stored as null on serialisation.
 */
type JsonValue = string | number | boolean | null | { [k: string]: JsonValue } | JsonValue[];
const jsonValue: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValue),
    z.record(z.string(), jsonValue),
  ])
);

const required = (max: number) => z.string().trim().min(1).max(max);
const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const leadSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  source: optional(80),
});

export const pricingSchema = z.object({
  format: z.enum(FORMAT_IDS),
  addOns: z.array(z.enum(ADD_ON_IDS)).max(ADD_ON_IDS.length).optional().default([]),
});

export const magicLinkSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
});

/**
 * Interview answers are spelled out rather than accepted as a free record.
 * Checkout spreads this straight into the insert, so an open shape let a caller
 * name any column in `interview_responses` and set it.
 */
export const interviewSchema = z.object({
  q1_what_minit_made_means: optional(5000),
  q2_inspiration: optional(5000),
  q3_collab_with: optional(5000),
  q4_whats_next: optional(5000),
  q5_why_minit_made: optional(5000),
  q6_representing_city: optional(5000),
  q7_sound_one_word: optional(200),
});

export const checkoutSchema = z.object({
  artist: z.object({
    name: required(120),
    artist_name: required(120),
    email: z.string().trim().toLowerCase().email().max(320),
    phone: required(40),
    city: required(120),
    instagram: required(120),
    tiktok: required(120),
    youtube: optional(300),
    spotify: optional(300),
    soundcloud: optional(300),
    apple_music: optional(300),
    bio: optional(2000),
  }),
  format: z.enum(FORMAT_IDS),
  music: z.object({
    song_title: required(200),
    artist_name: required(200),
    spotify_url: optional(500),
    apple_music_url: optional(500),
    youtube_url: optional(500),
    soundcloud_url: optional(500),
    audio_file_url: optional(1000),
    instrumental_file_url: optional(1000),
    lyrics: optional(20000),
    performance_notes: optional(5000),
    explicit_content: z.boolean().optional().default(false),
  }),
  prep: z
    .object({
      performance_vibe: optional(2000),
      special_requests: optional(2000),
      height: optional(40),
      broll_preference: optional(2000),
      production_notes: optional(5000),
    })
    .optional()
    // Spelled out because each key is optional-with-transform, so `{}` does not
    // satisfy the inferred output type.
    .default({
      performance_vibe: undefined,
      special_requests: undefined,
      height: undefined,
      broll_preference: undefined,
      production_notes: undefined,
    }),
  addOns: z.array(z.enum(ADD_ON_IDS)).max(ADD_ON_IDS.length).optional().default([]),
  interview: interviewSchema.optional(),
  // Kept a plain boolean so the route can return its own copy for this one.
  termsAccepted: z.boolean(),
});

export type CheckoutPayload = z.infer<typeof checkoutSchema>;

export const crewTaskSchema = z.object({
  production_status: z.enum(["pending", "in_production", "ready", "delivered"]),
});

export const adminSettingSchema = z.object({
  key: required(120),
  value: z.unknown(),
});

export const adminBatchSchema = z.object({
  format: z.enum(FORMAT_IDS),
  shoot_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD"),
  location: required(200),
  max_artists: z.coerce.number().int().min(1).max(100).optional().default(8),
  week_number: z.coerce.number().int().min(1).max(53).nullish(),
  // `month` is a text column ("September"), not an ordinal.
  month: optional(30),
});

export const adminCrewSchema = z.object({
  name: required(120),
  email: z.string().trim().toLowerCase().email().max(320),
  phone: optional(40),
  roles: z.array(z.string().trim().max(60)).max(20).optional().default([]),
});

export const adminSubmissionSchema = z.object({
  submission_status: z.enum(["pending", "submitted", "reviewed", "approved", "needs_revision"]),
});

export const adminPageSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "lowercase letters, numbers and hyphens only"),
  title: required(200),
  blocks: z.array(jsonValue).optional().default([]),
});

export const adminBatchCrewSchema = z.object({
  batch_id: z.string().uuid(),
  crew_id: z.string().uuid(),
  role: optional(80),
});

export const bootstrapSchema = z.object({
  secret: z.string().min(1),
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(8).max(200),
  name: optional(120),
});

/* -------------------------------------------------------------------------- */
/* Admin                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The status columns are plain text in Postgres with no CHECK constraints, so
 * these enums are the only thing standing between a typo and a row the app can
 * never find again — a content item saved as "Live" disappears from the public
 * gallery, which filters on exactly "live".
 */
const CONTENT_STATUSES = ["pending", "live", "archived"] as const;
const CONTENT_TYPES = [
  "performance",
  "freestyle",
  "cypher",
  "city_spotlight",
  "bts",
  "broll",
  "interview",
] as const;
const PRODUCTION_STATUSES = ["pending", "in_production", "ready", "delivered"] as const;
const BATCH_STATUSES = ["open", "full", "in_progress", "completed", "cancelled"] as const;
const BOOKING_STATUS_VALUES = [
  "pending",
  "payment_pending",
  "confirmed",
  "scheduled",
  "completed",
  "content_ready",
  "cancelled",
] as const;
const PAYMENT_STATUSES = ["pending", "completed", "expired", "refunded"] as const;

/** Forms post "" for an unset id; the column wants null. */
const uuidOrNull = z
  .union([z.string().uuid(), z.literal(""), z.null()])
  .optional()
  .transform((v) => (v ? v : null));

export const adminContentSchema = z.object({
  booking_id: uuidOrNull,
  artist_id: z.string().uuid(),
  format: z.enum(FORMAT_IDS).nullish(),
  title: required(200),
  description: optional(5000),
  youtube_url: optional(500),
  youtube_playlist_url: optional(500),
  thumbnail_url: optional(1000),
  content_type: z.enum(CONTENT_TYPES).optional().default("performance"),
  status: z.enum(CONTENT_STATUSES).optional().default("pending"),
  featured: z.boolean().optional().default(false),
});

export const adminContentPatchSchema = z
  .object({
    status: z.enum(CONTENT_STATUSES),
    featured: z.boolean(),
    youtube_url: optional(500),
    youtube_playlist_url: optional(500),
    title: required(200),
    description: optional(5000),
  })
  .partial();

export const adminBookingPatchSchema = z
  .object({
    status: z.enum(BOOKING_STATUS_VALUES),
    batch_id: uuidOrNull,
    assigned_slot_time: z.string().datetime().nullish(),
    payment_status: z.enum(PAYMENT_STATUSES),
  })
  .partial();

export const adminAddonPatchSchema = z
  .object({
    production_status: z.enum(PRODUCTION_STATUSES),
    assigned_crew_id: uuidOrNull,
    due_date: z
      .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal(""), z.null()])
      .transform((v) => (v ? v : null)),
    notes: optional(5000),
  })
  .partial();

/**
 * Batch PATCH previously passed the request body straight into `update()` with
 * no allowlist at all, so any column on shoot_batches was writable — including
 * current_artists, which is meant to move only through claim_batch_slot.
 */
export const adminBatchPatchSchema = z
  .object({
    status: z.enum(BATCH_STATUSES),
    shoot_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    location: required(200),
    max_artists: z.coerce.number().int().min(1).max(100),
  })
  .partial();

export const adminPagePatchSchema = z
  .object({
    title: required(200),
    meta_description: optional(320),
    content: jsonValue,
    status: z.enum(["draft", "published"]),
  })
  .partial();

export const adminPricingPatchSchema = z
  .object({
    reason: optional(500),
  })
  .catchall(z.unknown());
