import type { Metadata } from "next";
import ArtistHeader from "./ArtistHeader";

/** Personal data behind a login — never index it. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function ArtistLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col">
      <ArtistHeader />
      <div className="max-w-5xl mx-auto w-full px-6 py-10 flex-1">{children}</div>
    </div>
  );
}
