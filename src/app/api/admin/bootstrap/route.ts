import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// One-time setup route to create the first admin account.
// Protected by ADMIN_BOOTSTRAP_SECRET — set it in .env.local, call this once, then
// consider removing/rotating the secret.
export async function POST(req: NextRequest) {
  const { secret, email, password, name } = (await req.json()) as {
    secret: string;
    email: string;
    password: string;
    name?: string;
  };

  if (!process.env.ADMIN_BOOTSTRAP_SECRET || secret !== process.env.ADMIN_BOOTSTRAP_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: "Valid email and 8+ char password required" }, { status: 400 });
  }

  const supabase = createAdminClient();

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
