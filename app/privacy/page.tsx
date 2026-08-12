import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy policy | Aiso watermark cleaner", description: "How Aiso stores and deletes text submitted to the free watermark cleaner." };

export default function PrivacyPage() {
  return (
    <main>
      <SiteHeader />
      <article className="legal-page">
        <span className="status-pill">Effective August 12, 2026</span>
        <h1>Privacy policy</h1>
        <p className="legal-lede">The short version: when you choose to clean text, we store the original text, the cleaned copy, your selected source, change counts, consent record, and timestamps for 30 days. Do not submit secrets or sensitive personal information.</p>

        <h2>1. What this policy covers</h2>
        <p>This policy covers the Aiso watermark cleaner website and its cleaning API. Aiso operates the service and acts as the controller for the information described here.</p>

        <h2>2. What we collect</h2>
        <ul>
          <li>The original text you submit and the cleaned text returned to you.</li>
          <li>The source category you choose, such as Claude, ChatGPT, Gemini, another source, or prefer not to say.</li>
          <li>Technical cleaning counts, such as input length and the number of characters removed or replaced.</li>
          <li>Your ownership and storage consent, the time of submission, the planned deletion date, and a one-way hash of your deletion token.</li>
          <li>Basic hosting and security logs processed by our hosting provider, which may include an IP address, user agent, request path, and timestamp.</li>
        </ul>
        <p>We do not add your name, email address, account ID, or IP address to the MongoDB cleaning record. The tool does not require an account.</p>

        <h2>3. Why we use it</h2>
        <p>We use cleaning records to provide the result, troubleshoot failures, understand which text hygiene problems occur, protect the service, and improve the free tool. The legal basis for storing the submitted text is your consent. You can withdraw that consent by deleting the record using the control returned after cleaning, or by contacting us.</p>

        <h2>4. Required consent</h2>
        <p>Storage is part of this free tool. If you do not want the original and cleaned text stored for the retention period, do not submit it. The cleaning button stays unavailable until you confirm ownership or authorization and storage consent.</p>

        <h2>5. Retention and deletion</h2>
        <p>Cleaning records are assigned a deletion date 30 days after creation and are automatically removed by a database time-to-live rule. Database cleanup can occur shortly after that date rather than at the exact second. The result screen also gives your browser a private deletion token that can delete the record sooner. If you clear browser storage or lose that token, email us with enough detail to locate the record.</p>

        <h2>6. Service providers and transfers</h2>
        <p>We use MongoDB Atlas for database hosting and Vercel for application hosting. Those providers process information on our behalf and may process it in countries outside yours. Their contractual and technical safeguards apply to that processing. We do not sell submitted text.</p>

        <h2>7. Security</h2>
        <p>We use encrypted network connections, restricted database credentials, automatic expiry, and deletion tokens. No internet service is risk-free. Do not submit passwords, private keys, health information, payment data, confidential client material, or other information that would cause harm if disclosed.</p>

        <h2>8. Your rights</h2>
        <p>Depending on where you live, you may have rights to access, correct, delete, restrict, object to, or receive a copy of your personal information, and to complain to a data protection authority. Contact <a href="mailto:privacy@getaiso.com">privacy@getaiso.com</a>. We may need information that lets us locate your record without collecting more data than necessary.</p>

        <h2>9. Changes</h2>
        <p>We may update this policy when the tool or its data practices change. The effective date above will be updated when we do.</p>

        <h2>10. Contact</h2>
        <p>Privacy questions: <a href="mailto:privacy@getaiso.com">privacy@getaiso.com</a><br />General support: <a href="mailto:support@getaiso.com">support@getaiso.com</a></p>
      </article>
      <SiteFooter />
    </main>
  );
}
