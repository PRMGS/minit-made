import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format");
  if (!format) {
    return NextResponse.json({ error: "format is required" }, { status: 400 });
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("shoot_batches")
    .select("id, shoot_date, location, format, status")
    .eq("format", format)
    .eq("status", "open")
    .order("shoot_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: safeApiError("batches", error) }, { status: 500 });
  }
  return NextResponse.json({ batch: data });
}
