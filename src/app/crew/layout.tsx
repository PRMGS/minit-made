import type { Metadata } from "next";
import CrewHeader from "./CrewHeader";

/** Personal data behind a login — never index it. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function CrewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col">
      <CrewHeader />
      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">{children}</div>
    </div>
  );
}
