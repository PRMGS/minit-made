import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/lib/auth";
import { randomUUID } from "crypto";
import { ARTIST_ERRORS, safeApiError } from "@/lib/errors";

const ALLOWED_BUCKETS = new Set(["music-submissions", "profile-images", "page-assets"]);
const ADMIN_ONLY_BUCKETS = new Set(["page-assets"]);
const MAX_SIZE = 100 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const bucket = formData.get("bucket") as string | null;

  if (!file || !bucket || !ALLOWED_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: ARTIST_ERRORS.invalidFile }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: ARTIST_ERRORS.fileTooLarge }, { status: 400 });
  }
  if (ADMIN_ONLY_BUCKETS.has(bucket)) {
    const ctx = await requireAdminApi();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const ext = file.name.split(".").pop() ?? "bin";
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
