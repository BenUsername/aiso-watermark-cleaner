import Image from "next/image";
import { GitFork } from "lucide-react";
import Link from "next/link";
import { BASE_PATH } from "@/lib/site";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Aiso watermark cleaner home">
        <Image src={`${BASE_PATH}/aiso-feather.png`} alt="" width={26} height={26} priority />
        <span className="wordmark">aiso</span>
        <span className="brand-divider" />
        <span className="product-name">watermark cleaner</span>
      </Link>
      <nav aria-label="Primary navigation">
        <Link href="/privacy">Privacy</Link>
        <a className="github-link" href="https://github.com/BenUsername/aiso-watermark-cleaner" target="_blank" rel="noreferrer">
          <GitFork aria-hidden="true" /> Source
        </a>
      </nav>
    </header>
  );
}
