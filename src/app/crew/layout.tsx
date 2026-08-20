import Link from "next/link";

export default function CrewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-border sticky top-0 bg-black z-10">
        <nav className="px-4 py-4 flex items-center justify-between gap-3">
          <Link href="/crew/dashboard" className="font-extrabold text-lg tracking-tight whitespace-nowrap">
            MINIT <span className="text-gold">MADE</span>
          </Link>
          <div className="flex gap-4 sm:gap-5 text-sm shrink-0">
            <Link href="/crew/shoots" className="hover:text-gold">Shoots</Link>
            <Link href="/crew/tasks" className="hover:text-gold">Tasks</Link>
            <Link href="/crew/profile" className="hover:text-gold">Profile</Link>
          </div>
        </nav>
      </header>
      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">{children}</div>
    </div>
  );
}
