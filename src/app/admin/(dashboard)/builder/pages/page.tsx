import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import NewPageForm from "./NewPageForm";

export default async function AdminBuilderPagesPage() {
  const { supabase } = await requireAdmin();
  const { data: pages } = await supabase.from("pages").select("*").order("slug");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pages</h1>
      <NewPageForm />
      <div className="card divide-y divide-border">
        {(pages ?? []).map((p) => (
          <Link key={p.id} href={`/admin/builder/pages/${p.id}`} className="p-4 flex justify-between items-center text-sm block hover:bg-white/5">
            <div>
              <p className="font-semibold">{p.title}</p>
              <p className="text-neutral-500">/{p.slug}</p>
            </div>
            <span className={`text-xs uppercase px-2 py-1 rounded-full border ${p.status === "published" ? "border-green-500 text-green-400" : "border-neutral-600 text-neutral-500"}`}>
              {p.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
