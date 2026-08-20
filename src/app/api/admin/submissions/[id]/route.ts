import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { parseJson } from "@/lib/apiRequest";
import { adminSubmissionSchema } from "@/lib/apiSchemas";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminApi();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = await parseJson(req, adminSubmissionSchema);
  if (!parsed.ok) return parsed.response;

  const { error } = await ctx.supabase
    .from("music_submissions")
    .update({ submission_status: parsed.data.submission_status })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
