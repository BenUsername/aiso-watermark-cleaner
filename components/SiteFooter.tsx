import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <strong>Watermark cleaner by Aiso</strong>
        <p>For privacy and text hygiene on content you own.</p>
      </div>
      <nav aria-label="Legal navigation">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <a href="mailto:support@getaiso.com">Contact</a>
      </nav>
      <p className="copyright">© {new Date().getFullYear()} Aiso</p>
    </footer>
  );
}
