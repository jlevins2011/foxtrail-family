import { consentValid, launchGaps, localPrivacy } from "@/lib/platform/privacy";
import { randomBytes } from "node:crypto";
import { hash } from "@/lib/platform/model";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { session } from "@/lib/platform/security";
import {
  family,
  ownedChild,
  resolvePlan,
  allBanks,
  wallet,
  entitlement,
  GAME_IDS,
  type GameId,
} from "@/lib/platform/model";
import { database } from "@/lib/platform/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ game: string; asset: string[] }> },
) {
  const { game, asset } = await params;
  const viewer = await getViewer();
  if (!viewer) return new Response("Sign in first.", { status: 401 });
  if(!viewer.emailVerified || !viewer.email || !consentValid(viewer.userId,viewer.email) || (!localPrivacy() && launchGaps().length))return new Response("Parent permission is required.",{status:403});
  const f = family(viewer.userId),
    s = await session("child", f.id);
  if (!s) return new Response("Choose your profile.", { status: 403 });
  if (!GAME_IDS.includes(game as GameId))
    return new Response("Not found", { status: 404 });
  if (!entitlement(f).unlocked)
    return new Response("Full adventure requires a trial or membership.", {
      status: 402,
    });
  const child = ownedChild(f, s.child);
  const islandLease = database()
    .prepare(
      "SELECT expires FROM sessions WHERE family=? AND child=? AND kind='island' AND expires>? ORDER BY expires DESC LIMIT 1",
    )
    .get(f.id, child.id, Date.now()) as { expires: number } | undefined;
  if (game === "lumen-isles" && child.timedPlay && !islandLease)
    return new Response("Earned playtime is required.", { status: 403 });
  if (asset.some((x) => x === ".." || x.includes("\\") || x.startsWith(".")))
    return new Response("Not found", { status: 404 });
  const root = resolve("game-dist", game),
    file = resolve(root, ...asset);
  if (!file.startsWith(root + sep))
    return new Response("Not found", { status: 404 });
  try {
    let content = await readFile(file);
    const ext = extname(file);
    const headers = {
      "Content-Type":
        (
          {
            ".html": "text/html; charset=utf-8",
            ".js": "text/javascript; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".svg": "image/svg+xml",
            ".png": "image/png",
            ".webp": "image/webp",
            ".jpg": "image/jpeg",
            ".woff2": "font/woff2",
            ".json": "application/json",
          } as Record<string, string>
        )[ext] ?? "application/octet-stream",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
    };
    if (ext === ".html") {
      const plan = resolvePlan(child, game as GameId);
      const banks = allBanks(f.id).filter(
        (b) =>
          plan.subjects.includes(b.subject) &&
          (plan.bankIds.length
            ? plan.bankIds.includes(b.id)
            : b.family === "official" &&
              child.grade >= b.gradeMin &&
              child.grade <= b.gradeMax),
      );
      const row = database()
        .prepare(
          "SELECT data FROM game_saves WHERE family=? AND child=? AND game=?",
        )
        .get(f.id, child.id, game) as { data: string } | undefined;
      const ticket = randomBytes(32).toString("base64url");
      database()
        .prepare("INSERT INTO sessions VALUES(?,?,?,?,?)")
        .run(
          hash(ticket),
          f.id,
          "game:" + game,
          child.id,
          Date.now() + 2 * 3600000,
        );
      const boot = {
        game,
        ticket,
        timedPlay: child.timedPlay,
        leaseExpires: islandLease?.expires ?? 0,
        child: {
          id: child.id,
          name: child.name,
          grade: child.grade,
          avatar: child.avatar,
        },
        plan,
        banks,
        wallet: wallet(f.id, child.id),
        save: row ? JSON.parse(row.data) : {},
      };
      const json = JSON.stringify(boot).replace(/</g, "\\u003c");
      content = Buffer.from(
        content
          .toString()
          .replace(
            "<head>",
            "<head><script>window.__FAMILY__=" +
              json +
              ';</script><script src="/game-bridge.js"></script>',
          ),
      );
    }
    return new Response(content, { headers });
  } catch {
    return NextResponse.json(
      { error: "Game release is not installed. Run the game packaging step." },
      { status: 503 },
    );
  }
}
