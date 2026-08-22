import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export type LinkResult =
  | { status: "linked" | "already-linked"; role: "artists" | "crew_members" }
  | { status: "claimed" }
  | { status: "not-found" }
  | { status: "error" };

/**
 * Links a signed-in auth user to their pre-existing artist/crew record by
 * email. Identity comes from the caller-verified `user`, never a request
 * body — see the history at src/app/api/auth/signup/route.ts for why.
 *
 * Idempotent: safe to call on every auth callback hit, not just signup.
 */
export async function linkAuthUserToRecord(
  admin: AdminClient,
  user: { id: string; email: string }
): Promise<LinkResult> {
  for (const table of ["artists", "crew_members"] as const) {
    const { data: existing } = await admin
      .from(table)
      .select("id, auth_user_id")
      .eq("email", user.email)
      .maybeSingle();

    if (!existing) continue;

    if (existing.auth_user_id === user.id) {
      return { status: "already-linked", role: table };
    }

    if (existing.auth_user_id) {
      return { status: "claimed" };
    }

    const { error } = await admin
      .from(table)
      .update({ auth_user_id: user.id } as never)
      .eq("id", existing.id)
      .is("auth_user_id", null);

    if (error) {
      console.error("[auth:link] failed", { table, id: existing.id, error });
      return { status: "error" };
    }

    return { status: "linked", role: table };
  }

  return { status: "not-found" };
}
