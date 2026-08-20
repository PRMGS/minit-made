import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ARTIST_ERRORS } from "@/lib/errors";

/**
 * Links the signed-in auth user to their existing artist/crew record.
 *
 * Identity is derived from the server session ONLY. This previously read
 * `auth_user_id` and `email` straight from the request body with no
 * authorization check, which let anyone POST another artist's email with their
 * own user id and take over that artist's dashboard, bookings and submissions.
 *
 * The body is now ignored entirely, and the update is guarded with
 * `.is("auth_user_id", null)` so a record that is already claimed cannot be
 * relinked to a different account.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: ARTIST_ERRORS.signedOut }, { status: 401 });
  }

  const admin = createAdminClient();

  for (const table of ["artists", "crew_members"] as const) {
    const { data: existing } = await admin
      .from(table)
      .select("id, auth_user_id")
      .eq("email", user.email)
      .maybeSingle();

    if (!existing) continue;

    // Already linked to this user — nothing to do.
    if (existing.auth_user_id === user.id) {
      return NextResponse.json({ success: true, role: table });
    }

    // Claimed by someone else: refuse rather than silently relinking.
    if (existing.auth_user_id) {
      return NextResponse.json({ error: ARTIST_ERRORS.generic }, { status: 409 });
    }

    const { error } = await admin
      .from(table)
      .update({ auth_user_id: user.id } as never)
      .eq("id", existing.id)
      .is("auth_user_id", null);

    if (error) {
      console.error("[auth:link] failed", { table, id: existing.id, error });
      return NextResponse.json({ error: ARTIST_ERRORS.generic }, { status: 500 });
    }

    return NextResponse.json({ success: true, role: table });
  }

  return NextResponse.json({ error: ARTIST_ERRORS.noAccountYet }, { status: 404 });
}
