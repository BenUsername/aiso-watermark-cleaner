import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of service | Aiso watermark cleaner",
  description: "Rules for using Aiso's free text and file watermark remover.",
  alternates: { canonical: "https://www.getaiso.com/tools/watermark-remover/terms" },
};

export default function TermsPage() {
  return (
    <main>
      <SiteHeader />
      <article className="legal-page">
        <span className="status-pill">Effective August 12, 2026</span>
        <h1>Terms of service</h1>
        <p className="legal-lede">Use this tool for privacy and provenance hygiene on content you own or are authorized to process. Removing supported signals does not make AI-assisted work human-written and does not prove that a private detector will fail.</p>

        <h2>1. The service</h2>
        <p>Aiso provides a free hosted web implementation of Guillaume Meyer&apos;s open-source watermarks-remover workflow. The service includes Layer A Unicode inspection and cleaning, Layer B rewrite modes, and supported metadata cleaning for PNG, JPEG, SVG, PDF, DOCX, ODT, HTML, Markdown, and common UTF-8 text files.</p>

        <h2>2. Your permission to use content</h2>
        <p>You may submit only content that you own or are legally authorized to process. You remain responsible for the input, the cleaned output, and how you use or disclose it.</p>

        <h2>3. Prohibited uses</h2>
        <p>Do not use the service for academic fraud, impersonation, infringement, evasion of a legal disclosure duty, violation of a platform rule, or a false claim that AI-assisted work is human-written. Do not submit unlawful content, malware instructions intended to harm others, or data you are not allowed to share.</p>

        <h2>4. Storage</h2>
        <p>Using a cleaning or hosted rewrite action requires agreement to the storage described in our <Link href="/privacy">privacy policy</Link>. Cleaning records are scheduled for automatic deletion after 30 days and may be deleted sooner with the deletion token returned to your browser. Inspection and Layer B prompt generation do not create a cleaning database record.</p>

        <h2>5. Availability and limits</h2>
        <p>The service is provided as available and without a promise that it will be uninterrupted, error-free, or accepted by a detector or platform. Review every output before using it. Aggressive Unicode options can change complex scripts, full-width text, emoji sequences, or intentional formatting. Layer B substantially rewords content and can reduce tone, precision, or quality. Hosted PDF cleaning is best-effort without the upstream CLI&apos;s optional exiftool pass.</p>

        <h2>6. Residual channels</h2>
        <p>The service does not remove pixel, audio, or video watermarks, C2PA soft binding, secret-key detectors, or training backdoors. The external reverse-SynthID project referenced upstream provides research scoring only and is not bundled. No result is a certification of human authorship or universal undetectability.</p>

        <h2>7. Open-source code and attribution</h2>
        <p>The website source is made available under its repository license. The cleaning workflow is a TypeScript and web adaptation of Guillaume Meyer&apos;s MIT-licensed watermarks-remover project, including its supported layers, file matrix, prompts, and limitations. Third-party notices remain part of the source distribution.</p>

        <h2>8. Changes and suspension</h2>
        <p>We may change, limit, or suspend the service to protect users, respond to legal obligations, or maintain the product. We may update these terms by posting a new effective date.</p>

        <h2>9. Contact</h2>
        <p>Questions about these terms: <a href="mailto:legal@getaiso.com">legal@getaiso.com</a></p>
      </article>
      <SiteFooter />
    </main>
  );
}
