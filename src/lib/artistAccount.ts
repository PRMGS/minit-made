import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/env";

/**
 * Turns a paying artist into an account they can actually sign into.
 *
 * Checkout only ever wrote an `artists` row, so a paying artist hit a login wall
 * for an account that never existed. We provision the auth user here (payment
 * proves control of the email) and mint a magic link, which is keyed to the
 * booking email by construction and therefore cannot mismatch.
 *
 * Every function is best-effort: an auth hiccup must never fail a webhook for a
 * payment that is already captured.
 */

/** Finds an existing auth user by email, paging through the admin list. */
async function findAuthUserByEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string
): Promise<string | null> {
  const target = email.toLowerCase();
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users?.length) return null;
    const hit = data.users.find((u) => u.email?.toLowerCase() === target);
    if (hit) return hit.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

/**
 * Creates (or finds) the auth user and links it to the artist row.
 * Returns the auth user id, or null if provisioning failed.
 */
export async function provisionArtistAccount(params: {
  artistId: string;
  email: string;
}): Promise<string | null> {
  const { artistId, email } = params;
  const admin = createAdminClient();

  try {
    let userId: string | null = null;

    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true, // paying proved control of this address
      user_metadata: { role: "artist" },
    });

    if (created?.user) {
      userId = created.user.id;
    } else if (error) {
      // Already registered is the expected path for a repeat booker.
      userId = await findAuthUserByEmail(admin, email);
      if (!userId) {
        console.error("[artistAccount] could not create or find auth user", { email, error });
        return null;
      }
    }

    if (!userId) return null;

    // Link server-side only, and never steal a row that is already claimed.
    const { error: linkError } = await admin
      .from("artists")
      .update({ auth_user_id: userId } as never)
      .eq("id", artistId)
      .is("auth_user_id", null);

    if (linkError) {
      console.error("[artistAccount] link failed", { artistId, error: linkError });
    }

    return userId;
  } catch (e) {
    console.error("[artistAccount] provisioning threw", { artistId, email, error: e });
    return null;
  }
}

/**
 * Mints a one-click sign-in URL we deliver ourselves through Resend, so the email
 * keeps Minit Made branding and one sending domain.
 * Returns null on failure; callers fall back to the /artist/access page.
 */
export async function createMagicLinkUrl(
  email: string,
  next = "/artist/dashboard"
): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${siteUrl()}/auth/callback` },
    });

    const tokenHash = data?.properties?.hashed_token;
    if (error || !tokenHash) {
      console.error("[artistAccount] generateLink failed", { email, error });
      return null;
    }

    const url = new URL(`${siteUrl()}/auth/callback`);
    url.searchParams.set("token_hash", tokenHash);
    url.searchParams.set("type", "magiclink");
    url.searchParams.set("next", next);
    return url.toString();
  } catch (e) {
    console.error("[artistAccount] magic link threw", { email, error: e });
    return null;
  }
}

/** Convenience for the webhook: provision, then mint a link. Never throws. */
export async function provisionAndCreateAccessLink(params: {
  artistId: string;
  email: string;
}): Promise<string | null> {
  const userId = await provisionArtistAccount(params);
  if (!userId) return null;
  return createMagicLinkUrl(params.email);
}
