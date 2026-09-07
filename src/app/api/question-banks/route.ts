import { NextResponse } from "next/server";
import { requireParent } from "@/lib/platform/security";
import { allBanks, Problem } from "@/lib/platform/model";
export const runtime = "nodejs";
export async function GET() {
  try {
    const v = await requireParent();
    return NextResponse.json(
      { banks: allBanks(v.userId) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: e instanceof Problem ? e.status : 500 },
    );
  }
}
