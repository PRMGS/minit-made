import ApplyClient from "./ApplyClient";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apply to Perform",
  description:
    "Pick your format, send us your track, and lock a spot on the next shoot. Hanging Mic, Running Gun, Mic'd Up Cypher or City on Fire.",
  openGraph: { title: "Apply to Perform — Minit Made", description: "Pick your format, send us your track, and lock a spot on the next shoot. Hanging Mic, Running Gun, Mic'd Up Cypher or City on Fire." },
};

export default function ApplyPage() {
  return <ApplyClient />;
}
