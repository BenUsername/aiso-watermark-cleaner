import type { Metadata } from "next";
import { Spline_Sans } from "next/font/google";
import { CANONICAL_SITE_URL } from "@/lib/site";
import "./globals.css";

const splineSans = Spline_Sans({ subsets: ["latin"], display: "swap", variable: "--font-spline" });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.getaiso.com"),
  title: "AI watermark cleaner | Free text hygiene tool by Aiso",
  description: "Remove invisible Unicode marks and normalize unusual spacing in text you own. Free, transparent, and open source.",
  alternates: { canonical: CANONICAL_SITE_URL },
  openGraph: {
    title: "Clean invisible AI marks from text you own",
    description: "A free, transparent text hygiene tool by Aiso.",
    type: "website",
    url: CANONICAL_SITE_URL,
  },
  twitter: { card: "summary_large_image", title: "AI watermark cleaner", description: "Clean invisible Unicode marks and unusual spacing from text you own." },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={splineSans.variable}>{children}</body>
    </html>
  );
}
