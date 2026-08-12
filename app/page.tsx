import CleanerWorkbench from "@/components/CleanerWorkbench";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { CheckCircle2, EyeOff, FileCheck2, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main>
      <SiteHeader />
      <section className="hero" aria-labelledby="hero-title">
        <div className="eyebrow"><span />Free text hygiene tool</div>
        <h1 id="hero-title">Clean invisible AI marks from text <em>you own.</em></h1>
        <p className="hero-copy">
          Paste text from Claude, ChatGPT, Gemini, or another model. You get a clean copy with invisible Unicode removed, unusual spaces normalized, and every change counted.
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
          <h2 id="what-it-does">You see exactly what was cleaned.</h2>
          <p>
            This tool removes visible-to-machines Unicode carriers and normalizes spacing. It does not rewrite your ideas, claim your text is human-written, or certify that a provider&apos;s private detector will fail.
          </p>
        </div>
        <div className="fact-grid">
          <article className="fact-card">
            <EyeOff aria-hidden="true" />
            <h3>Invisible characters</h3>
            <p>Zero-width marks, bidirectional controls, tag characters, variation selectors, and other format characters.</p>
          </article>
          <article className="fact-card">
            <FileCheck2 aria-hidden="true" />
            <h3>Unusual spacing</h3>
            <p>Non-breaking, thin, full-width, and other space lookalikes are converted to standard spaces.</p>
          </article>
          <article className="fact-card">
            <ShieldCheck aria-hidden="true" />
            <h3>Honest limits</h3>
            <p>Statistical token watermarks, file metadata, image marks, and secret provider checks are outside this web tool&apos;s scope.</p>
          </article>
        </div>
      </section>

      <section className="source-note" aria-labelledby="built-openly">
        <div>
          <span className="status-pill">Built openly</span>
          <h2 id="built-openly">Based on published text-hygiene research.</h2>
          <p>
            The deterministic cleaning logic is adapted from Guillaume Meyer&apos;s MIT-licensed watermarks-remover project. The source, license, and limits stay visible so you can inspect what runs.
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
