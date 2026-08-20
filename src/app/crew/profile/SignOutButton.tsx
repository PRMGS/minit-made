"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    // router.push rather than window.location.href: this is an internal route.
    router.push("/crew/login");
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      className="border border-border rounded-lg px-4 py-2 text-sm hover:border-gold"
    >
      Log Out
    </button>
  );
}
