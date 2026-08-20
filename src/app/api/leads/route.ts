import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeApiError } from "@/lib/errors";
import { parseJson } from "@/lib/apiRequest";
import { leadSchema } from "@/lib/apiSchemas";

const BAD_EMAIL = "That email doesn't look right. Check it and try again.";

export async function POST(req: NextRequest) {
  const parsed = await parseJson(req, leadSchema, BAD_EMAIL);
  if (!parsed.ok) return parsed.response;
  const { email, source } = parsed.data;

  const supabase = createAdminClient();
  const { error } = await supabase.from("leads").insert({ email, source: source ?? "landing_page" });

  if (error) {
    // A repeat signup is not a failure worth showing anyone.
    if (error.code === "23505") return NextResponse.json({ success: true });
    return NextResponse.json({ error: safeApiError("leads", error) }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
