import geography from "./geography.json";
import { putBank, bankById, type Bank } from "./model";
export function seedBanks() {
  const mk = (
    id: string,
    title: string,
    subject: Bank["subject"],
    lo: number,
    hi: number,
    rows: string[][],
  ) => {
    if (bankById("official", id)) return;
    putBank({
      id,
      title,
      subject,
      gradeMin: lo,
      gradeMax: hi,
      family: "official",
      updated: Date.now(),
      questions: rows.map(([prompt, answer, explanation], i) => ({
        id: `${id}-${i}`,
        prompt,
        answer,
        explanation: explanation ?? "",
      })),
    });
  };
  mk("us-capitals", "The 50 state capitals", "geography", 0, 5, geography);
  mk(
    "math-k1",
    "Number explorers · K–1",
    "math",
    0,
    1,
    Array.from({ length: 40 }, (_, i) => {
      const a = i % 10,
        b = Math.floor(i / 10) + 1;
      return [
        `${a} + ${b}`,
        String(a + b),
        `Start at ${a}. Count forward ${b} more.`,
      ];
    }),
  );
  mk(
    "math-23",
    "Growing number sense · 2–3",
    "math",
    2,
    3,
    Array.from({ length: 48 }, (_, i) => {
      const a = (i % 12) + 1,
        b = Math.floor(i / 12) + 2;
      return [
        `${a} × ${b}`,
        String(a * b),
        `${a} groups of ${b} make ${a * b}.`,
      ];
    }),
  );
  mk(
    "math-45",
    "Multiplication & division · 4–5",
    "math",
    4,
    5,
    Array.from({ length: 60 }, (_, i) => {
      const a = (i % 12) + 1,
        b = Math.floor(i / 12) + 3;
      return [
        `${a * b} ÷ ${b}`,
        String(a),
        `Share ${a * b} equally into ${b} groups.`,
      ];
    }),
  );
  mk(
    "typing-01",
    "First words",
    "typing",
    0,
    2,
    [
      "cat",
      "dog",
      "sun",
      "map",
      "red",
      "hat",
      "fox",
      "run",
      "big",
      "fun",
      "hop",
      "sit",
      "cup",
      "bed",
      "pet",
      "log",
      "bus",
      "ant",
      "can",
      "top",
    ].map((w) => [
      "Type this word",
      w,
      "Take your time. Accuracy comes first.",
    ]),
  );
  mk(
    "typing-35",
    "Woodland sentences",
    "typing",
    3,
    5,
    [
      "The fox follows the trail.",
      "A lantern lights our camp.",
      "We can learn something new.",
      "The river runs to the sea.",
      "Small steps lead to big adventures.",
      "I can try again.",
    ].map((w) => [
      "Type this sentence",
      w,
      "Use both hands and watch your accuracy.",
    ]),
  );
  mk("spelling-12", "Everyday spelling", "spelling", 1, 2, [
    ["Spell the word for the animal that says meow.", "cat"],
    ["Spell the opposite of night.", "day"],
    ["Spell the number after one.", "two"],
    ["Spell the color of grass.", "green"],
    ["Spell what you read.", "book"],
    ["Spell the star that lights our day.", "sun"],
  ]);
}
