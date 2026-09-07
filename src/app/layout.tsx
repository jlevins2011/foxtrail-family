import type { Metadata, Viewport } from "next";

import { brand, theme, themeCssVars } from "@/config/brand";
import { Providers } from "@/components/Providers";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: brand.seoTitle,
    template: `%s · ${brand.shortName}`,
  },
  description: brand.description,
  applicationName: brand.shortName,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: brand.name,
    title: brand.seoTitle,
    description: brand.description,
  },
  twitter: {
    card: "summary_large_image",
    title: brand.seoTitle,
    description: brand.description,
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: brand.shortName,
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  themeColor: theme.pine,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" style={themeCssVars}>
      <body className="flex min-h-full flex-col bg-cream text-bark">
        <Providers>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <ServiceWorkerRegister />
        </Providers>
      </body>
    </html>
  );
}
