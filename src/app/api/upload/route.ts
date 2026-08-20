import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireAdminApi } from "@/lib/auth";
import { randomUUID } from "crypto";
import { ARTIST_ERRORS, safeApiError } from "@/lib/errors";

export const runtime = "nodejs";

/**
 * Per-bucket upload rules.
 *
 * `music-submissions` is deliberately open: an applicant uploads their track at
 * step 3 of the wizard, before checkout and before any account exists, so a
 * session requirement here would break the funnel outright. It is protected by
 * rate limit, MIME allowlist and size cap instead.
 *
 * Everything else has an authenticated caller and now says so. Previously only
 * `page-assets` was checked, which left anonymous writes into two buckets.
 *
 * Caps and MIME lists mirror the bucket configuration in Supabase, so a file
 * that passes here cannot then be rejected by storage with an unhelpful error.
 */
const BUCKETS = {
  "music-submissions": {
    access: "public",
    maxBytes: 100 * 1024 * 1024,
    mime: ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/aac", "audio/flac"],
  },
  "profile-images": {
    access: "session",
    maxBytes: 5 * 1024 * 1024,
    mime: ["image/png", "image/jpeg", "image/webp", "image/gif"],
  },
  "page-assets": {
    access: "admin",
    maxBytes: 10 * 1024 * 1024,
    mime: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
  },
} as const;

type BucketName = keyof typeof BUCKETS;

function isBucket(value: unknown): value is BucketName {
  return typeof value === "string" && value in BUCKETS;
}

/**
 * Rate limit for the one endpoint that accepts anonymous writes. In-memory and
 * therefore per-instance — same trade-off as the magic-link throttle, and enough
 * to stop this being used as free file hosting.
 */
const uploads = new Map<string, { count: number; bytes: number; first: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FILES_PER_WINDOW = 10;
const MAX_BYTES_PER_WINDOW = 250 * 1024 * 1024;

function rateLimited(ip: string, size: number): boolean {
  const now = Date.now();
  const entry = uploads.get(ip);

  if (!entry || now - entry.first > WINDOW_MS) {
    uploads.set(ip, { count: 1, bytes: size, first: now });
    return false;
  }

  entry.count += 1;
  entry.bytes += size;
  return entry.count > MAX_FILES_PER_WINDOW || entry.bytes > MAX_BYTES_PER_WINDOW;
}

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (e) {
    // A dropped connection mid-upload throws here, before any handler logic runs.
    return NextResponse.json(
      { error: safeApiError("upload:body", e, ARTIST_ERRORS.uploadFailed) },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  const bucket = formData.get("bucket");

  if (!(file instanceof File) || !isBucket(bucket)) {
    return NextResponse.json({ error: ARTIST_ERRORS.invalidFile }, { status: 400 });
  }

  const rules = BUCKETS[bucket];

  if (rules.access === "admin") {
    const ctx = await requireAdminApi();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } else if (rules.access === "session") {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: ARTIST_ERRORS.signedOut }, { status: 401 });
  }

  if (file.size > rules.maxBytes) {
    return NextResponse.json(
      { error: ARTIST_ERRORS.fileTooLarge(rules.maxBytes) },
      { status: 400 }
    );
  }

  if (!(rules.mime as readonly string[]).includes(file.type)) {
    return NextResponse.json({ error: ARTIST_ERRORS.invalidFile }, { status: 400 });
  }

  if (rules.access === "public" && rateLimited(clientIp(req), file.size)) {
    return NextResponse.json({ error: ARTIST_ERRORS.uploadRateLimited }, { status: 429 });
  }

  const supabase = createAdminClient();
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const path = `pending/${randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json(
      { error: safeApiError("upload", error, ARTIST_ERRORS.uploadFailed) },
      { status: 500 }
    );
  }

  if (bucket === "profile-images" || bucket === "page-assets") {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl, path });
  }

  const { data: signed } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60 * 24 * 365);

  return NextResponse.json({ url: signed?.signedUrl ?? path, path });
}
