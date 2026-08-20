import { requireAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import PageEditorClient from "./PageEditorClient";

export default async function AdminPageEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: page } = await supabase.from("pages").select("*").eq("id", id).single();
  if (!page) notFound();

  return <PageEditorClient page={page} />;
}
