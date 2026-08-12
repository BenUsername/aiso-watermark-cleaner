import type { Metadata } from "next";
import { Spline_Sans } from "next/font/google";
import { CANONICAL_SITE_URL } from "@/lib/site";
import "./globals.css";

const splineSans = Spline_Sans({ subsets: ["latin"], display: "swap", variable: "--font-spline" });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.getaiso.com"),
  title: "AI watermark remover | Free text and file cleanup by Aiso",
  description: "Inspect and clean invisible Unicode, statistical text marks, C2PA, EXIF, XMP, and document metadata from content you own.",
  alternates: { canonical: CANONICAL_SITE_URL },
  openGraph: {
    title: "Clean AI provenance from text and files you own",
    description: "A free web implementation of the open-source watermarks-remover workflow by Aiso.",
    type: "website",
    url: CANONICAL_SITE_URL,
  },
  twitter: { card: "summary_large_image", title: "AI watermark remover", description: "Inspect and clean supported text and file provenance channels." },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={splineSans.variable}>{children}</body>
    </html>
  );
}
