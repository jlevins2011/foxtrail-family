import Link from "next/link";
import { brand } from "@/config/brand";
export function SiteHeader() {
  return (
    <header className="site-nav">
      <Link className="wordmark" href="/">
        <span className="brand-dot">✦</span>
        {brand.name}
      </Link>
      <nav aria-label="Main navigation">
        <Link href="/games">The games</Link>
        <Link href="/library">Play</Link>
        <Link href="/dashboard" className="parent-link">
          Parent space ↗
        </Link>
      </nav>
    </header>
  );
}
