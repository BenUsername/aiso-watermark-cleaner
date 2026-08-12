import type { Metadata } from "next";
import { Spline_Sans } from "next/font/google";
import "./globals.css";

const splineSans = Spline_Sans({ subsets: ["latin"], display: "swap", variable: "--font-spline" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://aiso-watermark-cleaner.vercel.app"),
  title: "AI watermark cleaner | Free text hygiene tool by Aiso",
  description: "Remove invisible Unicode marks and normalize unusual spacing in text you own. Free, transparent, and open source.",
  openGraph: {
    title: "Clean invisible AI marks from text you own",
    description: "A free, transparent text hygiene tool by Aiso.",
    type: "website",
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
