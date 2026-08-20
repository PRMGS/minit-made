import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { siteUrlSafe } from "@/lib/env";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const DESCRIPTION =
  "Book a real filmed performance. Hip-hop, R&B, grime and freestyle artists — show up, do your thing, walk away with footage that puts your name where it belongs.";

/**
 * metadataBase makes every relative OG and canonical URL absolute, which is what
 * social scrapers need. Without it a shared link renders as a bare URL with no
 * card — on Instagram and X, which is where this audience actually shares.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrlSafe()),
  title: {
    default: "Minit Made — Your Moment, Filmed",
    template: "%s — Minit Made",
  },
  description: DESCRIPTION,
  applicationName: "Minit Made",
  openGraph: {
    type: "website",
    siteName: "Minit Made",
    title: "Minit Made — Your Moment, Filmed",
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Minit Made — Your Moment, Filmed",
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-black text-foreground">{children}</body>
    </html>
  );
}
