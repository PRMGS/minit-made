import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const ctx = await requireAdminApi();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { supabase } = ctx;
  const body = await req.json();

  const { data, error } = await supabase
    .from("shoot_batches")
    .insert({
      format: body.format,
      shoot_date: body.shoot_date,
      location: body.location,
      max_artists: body.max_artists ?? 8,
      week_number: body.week_number ?? null,
      month: body.month ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ batch: data });
}
