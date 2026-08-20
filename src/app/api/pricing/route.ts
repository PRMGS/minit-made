import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculatePricing } from "@/lib/pricing";
import type { AddOnType, FormatId } from "@/lib/constants";
import { ARTIST_ERRORS, safeApiError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  const { format, addOns } = (await req.json()) as { format: FormatId; addOns: AddOnType[] };
  if (!format) {
    return NextResponse.json({ error: "format is required" }, { status: 400 });
  }
  try {
    const supabase = createAdminClient();
    const pricing = await calculatePricing(supabase, format, addOns ?? []);
    return NextResponse.json(pricing);
  } catch (e) {
    return NextResponse.json(
      { error: safeApiError("pricing", e, ARTIST_ERRORS.pricingUnavailable) },
      { status: 400 }
    );
  }
}
