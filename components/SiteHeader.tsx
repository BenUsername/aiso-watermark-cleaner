import Image from "next/image";
import { GitFork } from "lucide-react";
import Link from "next/link";
import { BASE_PATH } from "@/lib/site";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <a className="brand" href="https://www.getaiso.com" aria-label="Aiso home">
        <Image src={`${BASE_PATH}/aiso-feather.png`} alt="" width={26} height={26} priority />
        <span className="wordmark">aiso</span>
        <span className="brand-divider" />
        <span className="product-name">watermark cleaner</span>
      </a>
      <nav aria-label="Primary navigation">
        <a href="https://www.getaiso.com/tools">All tools</a>
        <Link href="/privacy">Privacy</Link>
        <a className="github-link" href="https://github.com/BenUsername/aiso-watermark-cleaner" target="_blank" rel="noreferrer">
          <GitFork aria-hidden="true" /> Source
        </a>
      </nav>
    </header>
  );
}
