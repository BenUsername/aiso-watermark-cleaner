import type { Metadata } from "next";
import { Spline_Sans } from "next/font/google";
import "./globals.css";

const splineSans = Spline_Sans({ subsets: ["latin"], display: "swap", variable: "--font-spline" });

const siteUrl = "https://aiso-watermark-cleaner-git-more-th-4f477a-bts-projects-abf9912d.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "More Than ChatGPT | Tel Aviv field notes",
  description: "Specific, dated Tel Aviv field notes about Friday opening hours, cheap beer, bills, healthcare and local workarounds.",
  alternates: { canonical: siteUrl },
  openGraph: {
    title: "More Than ChatGPT",
    description: "The answer after the generic answer. Concrete Tel Aviv field notes with real prices, locations and dates.",
    type: "website",
    url: siteUrl,
    images: ["/more-than-chatgpt-og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "More Than ChatGPT",
    description: "Concrete Tel Aviv field notes that generic answers miss.",
    images: ["/more-than-chatgpt-og.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={splineSans.variable}>{children}</body>
    </html>
  );
}
