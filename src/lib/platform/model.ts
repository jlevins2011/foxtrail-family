import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { database, atomic } from "./db";
export const GAME_IDS = [
  "sumtrail",
  "camp-compass",
  "keytrail",
  "lumen-isles",
] as const;
export type GameId = (typeof GAME_IDS)[number];
export const SUBJECTS = [
  "math",
  "geography",
  "typing",
  "spelling",
  "reading",
  "science",
  "history",
] as const;
export type Subject = (typeof SUBJECTS)[number];
export const CAPABILITIES: Record<GameId, readonly Subject[]> = {
  sumtrail: ["math"],
  "camp-compass": ["geography"],
  keytrail: ["typing", "spelling", "reading"],
  "lumen-isles": SUBJECTS,
};
export const AVATARS = ["🦊", "🐻", "🐰", "🦉", "🐢", "🐱"];
export type Plan = {
  subjects: Subject[];
  bankIds: string[];
  syllabus?: string;
};
export type Child = {
  id: string;
  name: string;
  avatar: string;
  grade: number;
  pinHash: string;
  plan: Plan;
  overrides: Partial<Record<GameId, Plan>>;
  timedPlay: boolean;
  minutesPerCredit: number;
  created: number;
};
export type Family = {
  id: string;
  pinHash: string;
  children: Child[];
  trialStart: number;
  trialUsed: boolean;
  checkoutId?: string;
  checkoutPlan?: string;
  checkoutExpires?: number;
  billing?: {
    status: string;
    customer: string;
    subscription: string;
    periodEnd: number;
    plan: string;
  };
};
export type Question = {
  id: string;
  prompt: string;
  answer: string;
  explanation: string;
  choices?: string[];
};
export type Bank = {
  id: string;
  title: string;
  subject: Subject;
  gradeMin: number;
  gradeMax: number;
  questions: Question[];
  family: string;
  share?: string;
  source?: string;
  updated: number;
};
export class Problem extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function text(value: unknown, label: string, max = 120) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    throw new Problem(`${label} must be 1–${max} characters.`);
  return value.trim();
}
export function number(value: unknown, min: number, max: number) {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < min ||
    value > max
  )
    throw new Problem(`Choose a whole number from ${min} to ${max}.`);
  return value;
}
export function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
export function pinHash(pin: unknown) {
  if (typeof pin !== "string" || !/^\d{6,10}$/.test(pin))
    throw new Problem("Use a PIN of 6–10 digits.");
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(pin, salt, 32).toString("hex");
}
export function pinMatches(pin: unknown, stored: string) {
  if (typeof pin !== "string" || !/^\d{4,10}$/.test(pin) || !stored)
    return false;
  const [salt, key] = stored.split(":");
  const actual = scryptSync(pin, salt, 32);
  const expected = Buffer.from(key, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export function childPin(pin: unknown) {
  if (typeof pin !== "string" || !/^\d{4}$/.test(pin))
    throw new Problem("Child PINs have four digits.");
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(pin, salt, 32).toString("hex");
}
export function family(id: string): Family {
  const row = database()
    .prepare("SELECT data FROM families WHERE id=?")
    .get(id) as { data: string } | undefined;
  if (row) return JSON.parse(row.data);
  const f: Family = {
    id,
    pinHash: "",
    children: [],
    trialStart: Date.now(),
    trialUsed: false,
  };
  saveFamily(f);
  return f;
}
export function saveFamily(f: Family) {
  database()
    .prepare(
      "INSERT INTO families VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated=excluded.updated",
    )
    .run(f.id, JSON.stringify(f), Date.now());
}
export function safeFamily(f: Family) {
  return {
    ...f,
    pinHash: undefined,
    hasPin: !!f.pinHash,
    children: f.children.map((c) => ({ ...c, pinHash: undefined })),
    billing: f.billing
      ? {
          status: f.billing.status,
          periodEnd: f.billing.periodEnd,
          plan: f.billing.plan,
        }
      : null,
  };
}
export function ownedChild(f: Family, id: unknown) {
  const c = f.children.find((c) => c.id === id);
  if (!c) throw new Problem("Child profile not found.", 404);
  return c;
}
export function rate(key: string, max = 8, ms = 15 * 60 * 1000) {
  atomic(() => {
    const row = database()
      .prepare("SELECT attempts,reset FROM limits WHERE key=?")
      .get(key) as { attempts: number; reset: number } | undefined;
    const now = Date.now();
    if (row && row.reset > now && row.attempts >= max)
      throw new Problem("Too many attempts. Please try again later.", 429);
    database()
      .prepare(
        "INSERT INTO limits VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET attempts=excluded.attempts,reset=excluded.reset",
      )
      .run(
        key,
        row && row.reset > now ? row.attempts + 1 : 1,
        row && row.reset > now ? row.reset : now + ms,
      );
  });
}
export function validatePlan(value: unknown): Plan {
  const v = value as Plan;
  if (
    !v ||
    !Array.isArray(v.subjects) ||
    v.subjects.some((s) => !SUBJECTS.includes(s)) ||
    !Array.isArray(v.bankIds) ||
    v.bankIds.length > 30 ||
    v.bankIds.some((id) => typeof id !== "string")
  )
    throw new Problem("Choose valid subjects and question banks.");
  return {
    subjects: [...new Set(v.subjects)],
    bankIds: [...new Set(v.bankIds)],
    syllabus:
      typeof v.syllabus === "string" ? v.syllabus.trim().slice(0, 2000) : "",
  };
}
export function resolvePlan(c: Child, game: GameId) {
  const plan = c.overrides[game] ?? c.plan;
  return {
    subjects: plan.subjects.filter((s) => CAPABILITIES[game].includes(s)),
    bankIds: plan.bankIds,
    syllabus: plan.syllabus ?? "",
  };
}
export function validateBank(
  raw: unknown,
  owner: string,
  id: string = randomUUID(),
): Bank {
  const b = raw as Bank;
  if (!b || !SUBJECTS.includes(b.subject))
    throw new Problem("Choose a subject.");
  const gradeMin = number(b.gradeMin, 0, 5),
    gradeMax = number(b.gradeMax, gradeMin, 5);
  if (
    !Array.isArray(b.questions) ||
    b.questions.length < 1 ||
    b.questions.length > 500
  )
    throw new Problem("A bank needs 1–500 questions.");
  const questions = b.questions.map((q) => ({
    id: randomUUID(),
    prompt: text(q.prompt, "Question", 500),
    answer: text(q.answer, "Answer", 200),
    explanation:
      typeof q.explanation === "string" ? q.explanation.slice(0, 600) : "",
    ...(Array.isArray(q.choices) &&
    q.choices.length >= 2 &&
    q.choices.length <= 6
      ? { choices: q.choices.map((c) => text(c, "Choice", 200)) }
      : {}),
  }));
  return {
    id,
    title: text(b.title, "Title", 100),
    subject: b.subject,
    gradeMin,
    gradeMax,
    questions,
    family: owner,
    updated: Date.now(),
  };
}
export function allBanks(owner: string): Bank[] {
  return (
    database()
      .prepare(
        "SELECT data,share FROM banks WHERE family=? OR family='official'",
      )
      .all(owner) as { data: string; share: string | null }[]
  ).map((r) => ({ ...JSON.parse(r.data), share: r.share ?? undefined }));
}
export function bankById(owner: string, id: string) {
  return allBanks(owner).find((b) => b.id === id);
}
export function putBank(b: Bank) {
  database()
    .prepare(
      "INSERT INTO banks(id,family,data,share) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,share=excluded.share",
    )
    .run(b.id, b.family, JSON.stringify(b), b.share ?? null);
}
export const TREASURES = [
  {
    id: "scholar-lantern",
    name: "Scholar’s lantern",
    cost: 10,
    description: "A learning-exclusive lantern for your island.",
  },
  {
    id: "tideglass-lamp",
    name: "Tideglass lamp",
    cost: 30,
    description: "A learning-exclusive blue light for your island home.",
  },
  {
    id: "starlight-lamp",
    name: "Starlight lamp",
    cost: 60,
    description: "A violet light earned through your learning adventures.",
  },
];
export function wallet(owner: string, child: string) {
  const r = database()
    .prepare(
      "SELECT COALESCE(SUM(correct),0) credits,COUNT(*) answers FROM rewards WHERE family=? AND child=? AND game!='lumen-isles'",
    )
    .get(owner, child) as { credits: number; answers: number };
  const play = database()
    .prepare(
      "SELECT COALESCE(SUM(correct),0) spent FROM rewards WHERE family=? AND child=? AND game='lumen-isles'",
    )
    .get(owner, child) as { spent: number };
  return {
    ...r,
    minutesSpent: play.spent,
    treasures: TREASURES.filter((t) => r.credits >= t.cost),
  };
}
export function entitlement(f: Family) {
  const now = Date.now();
  if (
    f.billing &&
    ["active", "trialing"].includes(f.billing.status) &&
    f.billing.periodEnd > now
  )
    return { unlocked: true, label: f.billing.status };
  const left = Math.max(
    0,
    Math.ceil((f.trialStart + 14 * 86400000 - now) / 86400000),
  );
  return {
    unlocked: left > 0,
    label: left ? `${left} trial days left` : "Free plan",
    trialDaysLeft: left,
  };
}
