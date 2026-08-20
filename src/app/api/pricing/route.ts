import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculatePricing } from "@/lib/pricing";
import { ARTIST_ERRORS, safeApiError } from "@/lib/errors";
import { parseJson } from "@/lib/apiRequest";
import { pricingSchema } from "@/lib/apiSchemas";

export async function POST(req: NextRequest) {
  const parsed = await parseJson(req, pricingSchema, ARTIST_ERRORS.pricingUnavailable);
  if (!parsed.ok) return parsed.response;
  const { format, addOns } = parsed.data;

  try {
    const supabase = createAdminClient();
    const pricing = await calculatePricing(supabase, format, addOns);
    return NextResponse.json(pricing);
  } catch (e) {
    return NextResponse.json(
      { error: safeApiError("pricing", e, ARTIST_ERRORS.pricingUnavailable) },
      { status: 400 }
    );
  }
}
