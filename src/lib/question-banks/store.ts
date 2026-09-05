import type { QuestionBank } from "@/lib/question-banks/types";

/**
 * Placeholder store. Returns empty lists until a real family database lands.
 * Keep this family-scoped — never a separate catalog per game.
 */
export async function listQuestionBanks(familyId: string): Promise<QuestionBank[]> {
  void familyId;
  return [];
}

export async function getQuestionBank(
  familyId: string,
  bankId: string,
): Promise<QuestionBank | null> {
  void familyId;
  void bankId;
  return null;
}

export function questionBanksComingSoon() {
  return {
    comingSoon: true as const,
    message:
      "Question banks are designed. Creating, editing, and game opt-in are not wired yet.",
  };
}
