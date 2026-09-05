import type { Metadata, Viewport } from "next";
import { Fraunces, Nunito } from "next/font/google";
import { brand, theme, themeCssVars } from "@/config/brand";
import { Providers } from "@/components/Providers";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { SetupBanner } from "@/components/SetupBanner";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: brand.name,
    template: `%s · ${brand.shortName}`,
  },
  description: brand.description,
  applicationName: brand.shortName,
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
    <html
      lang="en"
      className={`${nunito.variable} ${fraunces.variable} h-full antialiased`}
      style={themeCssVars}
    >
      <body className="flex min-h-full flex-col bg-cream text-bark">
        <Providers>
          <SetupBanner />
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <ServiceWorkerRegister />
        </Providers>
      </body>
    </html>
  );
}
