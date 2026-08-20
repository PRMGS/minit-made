import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getCurrentArtist() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/artist/login");

  const { data: artist } = await supabase
    .from("artists")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!artist) redirect("/artist/login");
  return { supabase, artist };
}

export async function getCurrentCrew() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/crew/login");

  const { data: crew } = await supabase
    .from("crew_members")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!crew) redirect("/crew/login");
  return { supabase, crew };
}

/**
 * Like getCurrentCrew, but hands back the missing case instead of redirecting.
 *
 * A signed-in user with no crew_members row is a real state — it is exactly
 * where someone lands between signing up and an admin adding them — and
 * redirecting them to a login page they are already past is a dead end.
 */
export async function getCrewOrNull() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/crew/login");

  const { data: crew } = await supabase
    .from("crew_members")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return { supabase, crew, email: user.email ?? null };
}

// For API route handlers — never call redirect() outside a page/layout render.
export async function requireAdminApi() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: admin } = await supabase
    .from("admin_users")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!admin) return null;
  return { supabase, admin };
}

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: admin } = await supabase
    .from("admin_users")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!admin) redirect("/admin/login");
  return { supabase, admin };
}
