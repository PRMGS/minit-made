import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ARTIST_ERRORS, safeApiError } from "@/lib/errors";
import { parseJson } from "@/lib/apiRequest";
import { crewTaskSchema } from "@/lib/apiSchemas";

// RLS restricts updates to the crew member assigned to this order.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const parsed = await parseJson(req, crewTaskSchema, "That isn't a status we recognise.");
  if (!parsed.ok) return parsed.response;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: ARTIST_ERRORS.signedOut }, { status: 401 });

  const { error } = await supabase
    .from("add_on_orders")
    .update({ production_status: parsed.data.production_status })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: safeApiError("crew:task", error) }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
