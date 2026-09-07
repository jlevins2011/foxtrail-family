import { ImageResponse } from "next/og";
import { brand, theme } from "@/config/brand";
import { getGameBySlug } from "@/config/games";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function GameOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = getGameBySlug(slug);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: theme.cream,
          color: theme.pine,
        }}
      >
        <div style={{ fontSize: 26, color: theme.ember, fontWeight: 700 }}>
          {brand.name}
        </div>
        <div
          style={{
            fontSize: 68,
            fontWeight: 700,
            lineHeight: 1.05,
            marginTop: 18,
          }}
        >
          {game?.name ?? "Foxtrail game"}
        </div>
        <div style={{ fontSize: 30, marginTop: 24, color: theme.moss }}>
          {game?.subject ?? "Educational game"} · Free demo · 14-day family
          trial
        </div>
      </div>
    ),
    size,
  );
}
