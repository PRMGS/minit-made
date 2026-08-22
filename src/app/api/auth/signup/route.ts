import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { linkAuthUserToRecord } from "@/lib/accountLink";
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
  const result = await linkAuthUserToRecord(admin, { id: user.id, email: user.email });

  switch (result.status) {
    case "linked":
    case "already-linked":
      return NextResponse.json({ success: true, role: result.role });
    case "claimed":
      return NextResponse.json({ error: ARTIST_ERRORS.generic }, { status: 409 });
    case "error":
      return NextResponse.json({ error: ARTIST_ERRORS.generic }, { status: 500 });
    case "not-found":
      return NextResponse.json({ error: ARTIST_ERRORS.noAccountYet }, { status: 404 });
  }
}
