import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of service | Aiso watermark cleaner", description: "Rules for using Aiso's free text watermark cleaner." };

export default function TermsPage() {
  return (
    <main>
      <SiteHeader />
      <article className="legal-page">
        <span className="status-pill">Effective August 12, 2026</span>
        <h1>Terms of service</h1>
        <p className="legal-lede">Use this tool for privacy and text hygiene on content you own or are authorized to process. Cleaning a mark does not make AI-assisted text human-written.</p>

        <h2>1. The service</h2>
        <p>Aiso provides a free web tool that removes certain invisible Unicode characters and normalizes certain lookalike spaces and characters. The deterministic cleaner does not certify that statistical, secret-key, file, image, or provider-specific provenance systems can no longer identify the text.</p>

        <h2>2. Your permission to use content</h2>
        <p>You may submit only text that you own or are legally authorized to process. You remain responsible for the text, the clean copy, and how you use or disclose it.</p>

        <h2>3. Prohibited uses</h2>
        <p>Do not use the service for academic fraud, impersonation, infringement, evasion of a legal disclosure duty, violation of a platform rule, or a false claim that AI-assisted work is human-written. Do not submit unlawful content, malware instructions intended to harm others, or data you are not allowed to share.</p>

        <h2>4. Storage</h2>
        <p>Using the cleaning action requires agreement to the storage described in our <a href="/privacy">privacy policy</a>. Cleaning records are scheduled for automatic deletion after 30 days and may be deleted sooner with the deletion token returned to your browser.</p>

        <h2>5. Availability and limits</h2>
        <p>The service is provided as available and without a promise that it will be uninterrupted, error-free, or accepted by a particular detector or platform. Review the output before using it. Some Unicode cleaning options can change emoji sequences, complex-script joins, full-width text, or intentionally formatted characters.</p>

        <h2>6. Open-source code and attribution</h2>
        <p>The website source is made available under its repository license. Parts of the cleaning logic are adapted from Guillaume Meyer&apos;s MIT-licensed watermarks-remover project. Third-party notices remain part of the source distribution.</p>

        <h2>7. Changes and suspension</h2>
        <p>We may change, limit, or suspend the service to protect users, respond to legal obligations, or maintain the product. We may update these terms by posting a new effective date.</p>

        <h2>8. Contact</h2>
        <p>Questions about these terms: <a href="mailto:legal@getaiso.com">legal@getaiso.com</a></p>
      </article>
      <SiteFooter />
    </main>
  );
}
