"use client";
import { usePathname } from "next/navigation";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const child = path === "/library" || path === "/play" || path.startsWith("/play/");
  return child ? <main className="kid-app">{children}</main> : <><SiteHeader /><main className="flex-1">{children}</main><SiteFooter /></>;
}
