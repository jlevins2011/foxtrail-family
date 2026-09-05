import type { MetadataRoute } from "next";
import { games, hubPathForGame } from "@/config/games";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const publicPaths = [
    "/",
    "/games",
    ...games.map((game) => hubPathForGame(game)),
    "/unlock",
    "/install",
    "/privacy",
  ];

  return publicPaths.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.startsWith("/games") ? 0.8 : 0.5,
  }));
}
