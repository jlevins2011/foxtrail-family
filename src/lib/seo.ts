import type { Metadata } from "next";
import { brand } from "@/config/brand";
import { getAppUrl } from "@/lib/env";

export function absoluteUrl(path = "/") {
  const base = getAppUrl();
  if (path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageMetadata({
  title,
  description,
  path,
  index = true,
}: {
  title: string;
  description: string;
  path: string;
  index?: boolean;
}): Metadata {
  const url = absoluteUrl(path);
  const ogImage = path.startsWith("/games/")
    ? `${path}/opengraph-image`
    : "/opengraph-image";
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      type: "website",
      locale: brand.locale.replace("-", "_"),
      url,
      siteName: brand.name,
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
