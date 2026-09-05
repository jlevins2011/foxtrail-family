import type { GameId } from "@/config/games";

/**
 * Family-scoped reusable lists. One bank can later be opted into by any game.
 * Do not add per-game databases here. Game adapters are intentionally absent.
 */
export type QuestionBankKind = "spelling" | "latin" | "math-facts" | "custom";

export type QuestionItem = {
  id: string;
  prompt: string;
  answer: string;
  hint?: string;
  tags?: string[];
};

export type QuestionBank = {
  id: string;
  familyId: string;
  title: string;
  kind: QuestionBankKind;
  items: QuestionItem[];
  createdAt: string;
  updatedAt: string;
};

/** Later: a game opts into a family bank. Not implemented. */
export type QuestionBankGameOptIn = {
  familyId: string;
  bankId: string;
  gameId: GameId;
};

export const questionBankKinds: {
  kind: QuestionBankKind;
  label: string;
  example: string;
}[] = [
  { kind: "spelling", label: "Spelling", example: "weekly word lists" },
  { kind: "latin", label: "Latin", example: "roots, endings, phrases" },
  { kind: "math-facts", label: "Math facts", example: "times tables, sums" },
  { kind: "custom", label: "Custom", example: "whatever this family is learning" },
];
