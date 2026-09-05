import Link from "next/link";
import { brand } from "@/config/brand";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-pine/10 bg-pine text-snow">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-8">
        <div className="max-w-md">
          <p className="font-display text-xl">{brand.name}</p>
          <p className="mt-2 text-sm leading-6 text-parchment/90">
            A parent-held family hub. No ads, no chat, no child emails on this
            site. Rename the brand in <code>src/config/brand.ts</code>.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm font-semibold">
          <Link className="hover:underline" href="/privacy">
            Privacy
          </Link>
          <Link className="hover:underline" href="/install">
            Add to Home Screen
          </Link>
          <Link className="hover:underline" href="/unlock">
            Unlock the family
          </Link>
          <Link className="hover:underline" href="/dashboard">
            Parent dashboard
          </Link>
        </div>
      </div>
    </footer>
  );
}
