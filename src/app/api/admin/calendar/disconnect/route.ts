import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { clearIntegration } from "@/lib/googleCalendar";

export async function POST() {
  const ctx = await requireAdminApi();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await clearIntegration();
  return NextResponse.json({ success: true });
}
