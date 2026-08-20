import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeApiError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  const { email, source } = (await req.json()) as { email: string; source?: string };
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "That email doesn't look right. Check it and try again." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("leads").insert({ email, source: source ?? "landing_page" });
  if (error) {
    return NextResponse.json({ error: safeApiError("leads", error) }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
