"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const child = path === "/library" || path === "/play" || path.startsWith("/play/");
  return child ? <main className="kid-app">{children}<div className="kid-privacy"><Link href="/privacy">Privacy & parent choices</Link></div></main> : <><SiteHeader /><main className="flex-1">{children}</main><SiteFooter /></>;
}
