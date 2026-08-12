import CleanerWorkbench from "@/components/CleanerWorkbench";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { CheckCircle2, EyeOff, FileCheck2, Languages, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main>
      <SiteHeader />
      <section className="hero" aria-labelledby="hero-title">
        <div className="eyebrow"><span />Free multi-layer cleanup tool</div>
        <h1 id="hero-title">Worried AI provenance is traveling with <em>your content?</em></h1>
        <p className="hero-copy">
          Inspect and clean invisible Unicode, best-effort statistical text marks, C2PA, EXIF, XMP, and document metadata from content you own. Paste text or upload a supported file, then see exactly what changed.
        </p>
        <div className="hero-proof" aria-label="Key product facts">
          <span><CheckCircle2 aria-hidden="true" /> No account</span>
          <span><CheckCircle2 aria-hidden="true" /> Free to use</span>
          <span><CheckCircle2 aria-hidden="true" /> Open source</span>
        </div>
      </section>

      <CleanerWorkbench />

      <section className="explainer" aria-labelledby="what-it-does">
        <div>
          <div className="eyebrow"><span />Plain facts</div>
          <h2 id="what-it-does">The complete workflow, with the limits intact.</h2>
          <p>
            This is a hosted web implementation of the open-source watermarks-remover project. It separates deterministic removals from best-effort rewriting and runs a post-clean inspection instead of calling every result undetectable.
          </p>
        </div>
        <div className="fact-grid">
          <article className="fact-card">
            <EyeOff aria-hidden="true" />
            <h3>Layer A: Unicode</h3>
            <p>Inspect offsets and categories, then remove zero-width marks, bidi controls, tag characters, variation selectors, and space lookalikes.</p>
          </article>
          <article className="fact-card">
            <Languages aria-hidden="true" />
            <h3>Layer B: statistical</h3>
            <p>Choose sentence paraphrase, back-translation, or structural regeneration. Rewriting is best-effort and may reduce writing quality.</p>
          </article>
          <article className="fact-card">
            <FileCheck2 aria-hidden="true" />
            <h3>Files and containers</h3>
            <p>Inspect and clean PNG, JPEG, SVG, PDF, DOCX, ODT, HTML, Markdown, and common UTF-8 text formats.</p>
          </article>
        </div>
      </section>

      <section className="limits-section" aria-labelledby="limits-title">
        <div>
          <div className="eyebrow"><span />Residual risk</div>
          <h2 id="limits-title">Cleaning metadata is not proof of human authorship.</h2>
        </div>
        <div className="limits-grid">
          <article><ShieldCheck aria-hidden="true" /><h3>Verifiable here</h3><p>Unicode changes, supported container removals, file size changes, and post-clean findings.</p></article>
          <article><EyeOff aria-hidden="true" /><h3>Best-effort here</h3><p>Statistical text reduction and PDF cleaning without the upstream CLI&apos;s optional exiftool pass.</p></article>
          <article><FileCheck2 aria-hidden="true" /><h3>Out of scope</h3><p>Pixel, audio, and video watermark removal, C2PA soft binding, secret-key detectors, and training backdoors.</p></article>
        </div>
      </section>

      <section className="source-note" aria-labelledby="built-openly">
        <div>
          <span className="status-pill">Source and attribution</span>
          <h2 id="built-openly">The watermarks-remover workflow, implemented for the web.</h2>
          <p>
            Aiso&apos;s hosted tool ports Guillaume Meyer&apos;s MIT-licensed watermarks-remover project into a Next.js interface, including its Layer A, Layer B, file cleaning matrix, inspection-first flow, and residual-risk language. The optional external reverse-SynthID image scorer remains detection-only and is not bundled.
          </p>
        </div>
        <a className="secondary-button" href="https://github.com/guillaumemeyer/watermarks-remover" target="_blank" rel="noreferrer">
          View original project
        </a>
      </section>
      <SiteFooter />
    </main>
  );
}
