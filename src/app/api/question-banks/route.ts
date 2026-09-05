import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { listQuestionBanks, questionBanksComingSoon } from "@/lib/question-banks/store";

export const runtime = "nodejs";

export async function GET() {
  const viewer = await getViewer();
  const banks = viewer ? await listQuestionBanks(viewer.userId) : [];
  return NextResponse.json({
    ...questionBanksComingSoon(),
    familyId: viewer?.userId ?? null,
    banks,
  });
}

export async function POST() {
  return NextResponse.json(
    {
      error: "Question bank create is not implemented yet. Schema only.",
      ...questionBanksComingSoon(),
    },
    { status: 501 },
  );
}
