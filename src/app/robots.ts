import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/games", "/games/", "/unlock", "/install", "/privacy"],
        disallow: [
          "/dashboard",
          "/library",
          "/api/",
          "/sign-in",
          "/sign-up",
          "/unlock/success",
          "/unlock/canceled",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
