import Link from "next/link";
import { brand } from "@/config/brand";
import { AuthControls } from "@/components/AuthControls";
import { PipMark } from "@/components/PipMark";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-pine/10 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
        <Link href="/" className="flex min-h-11 items-center gap-2.5">
          <PipMark size={36} />
          <span className="leading-tight">
            <span className="block font-display text-lg text-pine">
              {brand.name}
            </span>
            <span className="hidden text-xs text-mist sm:block">
              {brand.tagline}
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/#games"
            className="hidden min-h-11 items-center rounded-full px-3 text-sm font-semibold text-pine hover:bg-parchment/80 sm:inline-flex"
          >
            Games
          </Link>
          <Link
            href="/unlock"
            className="hidden min-h-11 items-center rounded-full px-3 text-sm font-semibold text-pine hover:bg-parchment/80 md:inline-flex"
          >
            Unlock
          </Link>
          <AuthControls />
        </nav>
      </div>
    </header>
  );
}
