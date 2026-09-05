import { ImageResponse } from "next/og";
import { brand, theme } from "@/config/brand";

export const runtime = "nodejs";
export const alt = brand.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
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
        <div style={{ fontSize: 28, color: theme.ember, fontWeight: 700 }}>
          {brand.shortName}
        </div>
        <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05, marginTop: 16 }}>
          Camp games for curious kids
        </div>
        <div style={{ fontSize: 32, marginTop: 28, color: theme.moss, maxWidth: 900 }}>
          Free demos. 14-day family trial. Then one key for Camp Compass,
          Keytrail, and Lumen Isles.
        </div>
      </div>
    ),
    size,
  );
}
