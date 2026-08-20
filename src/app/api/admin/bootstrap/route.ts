import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseJson } from "@/lib/apiRequest";
import { bootstrapSchema } from "@/lib/apiSchemas";
import { timingSafeEqual } from "crypto";

export const runtime = "nodejs";

/** Constant-time compare so the secret can't be recovered a byte at a time. */
function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * One-time setup route to create the first admin account.
 *
 * Guarded three ways: ADMIN_BOOTSTRAP_SECRET must be set and match in constant
 * time, and the route self-disables once any admin exists — so a secret left in
 * the environment after setup cannot be replayed to mint a second admin.
 */
export async function POST(req: NextRequest) {
  const expected = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJson(req, bootstrapSchema, "Valid email and 8+ char password required");
  if (!parsed.ok) return parsed.response;
  const { secret, email, password, name } = parsed.data;

  if (!secretMatches(secret, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { count } = await supabase.from("admin_users").select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "Bootstrap is closed — an admin already exists. Add further admins from the dashboard." },
      { status: 409 }
    );
  }

  const { data: userData, error: userErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (userErr || !userData.user) {
    return NextResponse.json({ error: userErr?.message ?? "Could not create user" }, { status: 500 });
  }

  const { error: adminErr } = await supabase
    .from("admin_users")
    .insert({ auth_user_id: userData.user.id, email, name: name ?? email });

  if (adminErr) {
    return NextResponse.json({ error: adminErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
