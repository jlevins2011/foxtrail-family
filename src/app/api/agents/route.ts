import { NextResponse } from "next/server";
import { database, log } from "@/lib/platform/db";
import {
  hash,
  rate,
  Problem,
  validateBank,
  putBank,
  allBanks,
} from "@/lib/platform/model";
export const runtime = "nodejs";
async function run(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
    if (!token) throw new Problem("Agent key required.", 401);
    const row = database()
      .prepare("SELECT id,data FROM agents WHERE hash=?")
      .get(hash(token)) as { id: string; data: string } | undefined;
    if (!row) throw new Problem("Invalid key.", 401);
    const agent = JSON.parse(row.data);
    if (agent.expires < Date.now()) throw new Problem("Key expired.", 401);
    rate("agent:" + row.id, 60, 60000);
    const action = new URL(req.url).searchParams.get("action") ?? "catalog";
    const scope =
      req.method === "POST"
        ? "catalog:write"
        : action === "reports"
          ? "reports:read"
          : "catalog:read";
    if (!agent.scopes.includes(scope))
      throw new Problem("Permission denied.", 403);
    let result: unknown;
    if (req.method === "POST") {
      const raw = await req.text();
      if (raw.length > 700000) throw new Problem("Payload too large.", 413);
      const bank = validateBank(JSON.parse(raw), "official");
      putBank(bank);
      result = { bank };
    } else if (action === "reports") {
      result = database()
        .prepare(
          "SELECT game,COUNT(*) answers,SUM(correct) credits FROM rewards WHERE game!='lumen-isles' GROUP BY game",
        )
        .all();
    } else result = allBanks("official");
    log("agent:" + row.id, scope, "Agent API request");
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Problem ? e.message : "Request failed." },
      { status: e instanceof Problem ? e.status : 500 },
    );
  }
}
export const GET = run;
export const POST = run;
