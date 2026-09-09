import { consentValid, activity } from "./privacy";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { database } from "./db";
import { hash, Problem } from "./model";
import { getViewer } from "@/lib/auth";
export const LOCAL_TEST = () =>
  process.env.NODE_ENV !== "production" &&
  process.env.FOXTRAIL_TEST_MODE === "true";
export async function issue(
  family: string,
  kind: string,
  child: string | null = null,
  seconds = 1800,
) {
  const token = randomBytes(32).toString("base64url");
  database()
    .prepare("INSERT INTO sessions VALUES(?,?,?,?,?)")
    .run(hash(token), family, kind, child, Date.now() + seconds * 1000);
  (await cookies()).set("ft_" + kind, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: seconds,
  });
  return token;
}
export async function session(kind: string, owner?: string) {
  const token = (await cookies()).get("ft_" + kind)?.value;
  if (!token) return null;
  const row = database()
    .prepare(
      "SELECT family,child,expires FROM sessions WHERE token=? AND kind=?",
    )
    .get(hash(token), kind) as
    | { family: string; child: string | null; expires: number }
    | undefined;
  if(row && row.expires > Date.now() && kind === "child") { if(!consentValid(row.family))return null; activity(row.family); }
  return row && row.expires > Date.now() && (!owner || owner === row.family)
    ? row
    : null;
}
export async function revoke(kind: string) {
  const jar = await cookies();
  const token = jar.get("ft_" + kind)?.value;
  if (token)
    database().prepare("DELETE FROM sessions WHERE token=?").run(hash(token));
  jar.delete("ft_" + kind);
}
export async function requireParent() {
  const viewer = await getViewer();
  if (!viewer) throw new Problem("Sign in to your family account.", 401);
  if (!(await session("parent", viewer.userId)))
    throw new Problem("Unlock parent space with your PIN.", 403);
  activity(viewer.userId);
  return viewer;
}
export async function requireOwner() {
  const v = await requireParent();
  if (
    !(LOCAL_TEST() && v.isDevPreview) &&
    !(process.env.FOXTRAIL_OWNER_IDS ?? "").split(",").includes(v.userId)
  )
    throw new Problem("Owner access required.", 403);
  return v;
}
export function sameOrigin(request: Request) {
  // Next's development server can normalize request.url to localhost even
  // when the browser used 127.0.0.1. Require the browser's exact Host and port.
  if (LOCAL_TEST()) {
    const host = request.headers.get("host");
    if (host && /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) {
      const localOrigin = `${new URL(request.url).protocol}//${host}`;
      if (request.headers.get("origin") === localOrigin) return;
    }
  }
  const expected =
    process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  if (request.headers.get("origin") !== new URL(expected).origin)
    throw new Problem("This action must start on the family website.", 403);
}
