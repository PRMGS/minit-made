import type { Metadata } from "next";
import ApplyClient from "./ApplyClient";
import { availablePreviews } from "@/lib/formatPreviews";

export const metadata: Metadata = {
  title: "Apply to Perform",
  description:
    "Pick your format, send us your track, and lock a spot on the next shoot. Hanging Mic, Running Gun, Mic'd Up Cypher or City on Fire.",
  openGraph: {
    title: "Apply to Perform — Minit Made",
    description:
      "Pick your format, send us your track, and lock a spot on the next shoot.",
  },
};

export default function ApplyPage() {
  return <ApplyClient previews={availablePreviews()} />;
}
