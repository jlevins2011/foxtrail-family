import { requireConsent, consentValid } from "@/lib/platform/privacy";
import {readJson} from "@/lib/platform/http";
import { NextResponse } from "next/server";
import { randomUUID, randomBytes } from "node:crypto";
import { getViewer } from "@/lib/auth";
import { database, atomic, log } from "@/lib/platform/db";
import {
  family,
  saveFamily,
  safeFamily,
  ownedChild,
  rate,
  pinHash,
  pinMatches,
  childPin,
  validatePlan,
  validateBank,
  allBanks,
  putBank,
  bankById,
  text,
  number,
  Problem,
  GAME_IDS,
  AVATARS,
  resolvePlan,
  wallet,
  entitlement,
  hash,
  type Child,
  type GameId,
  type Bank,
} from "@/lib/platform/model";
import {
  issue,
  revoke,
  session,
  requireParent,
  requireOwner,
  sameOrigin,
  LOCAL_TEST,
} from "@/lib/platform/security";
import { seedBanks } from "@/lib/platform/seeds";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const ok = (v: unknown, status = 200) =>
  NextResponse.json(v, { status, headers: { "Cache-Control": "no-store" } });
async function handle(
  req: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  try {
    const path = (await ctx.params).path.join("/");
    const method = req.method;
    if (method !== "GET") sameOrigin(req);
    const b=method!=="GET"?await readJson(req):{};
    if (path === "test-login" && method === "POST") {
      if (!LOCAL_TEST()) throw new Problem("Not found.", 404);
      await issue("local-family", "test", null, 86400);
      return ok({ ok: true });
    }
    const viewer = await getViewer();
    if (!viewer) throw new Problem("Sign in to your family account.", 401);
    seedBanks();
    let f = family(viewer.userId);
    if (path === "gate" && method === "GET")
      return ok({
        hasPin: !!f.pinHash,
        unlocked: !!(await session("parent", f.id)),
        isTest: viewer.isDevPreview,
      });
    if (path === "gate" && method === "POST") {
      rate("parent-pin:" + f.id);
      if (f.pinHash) {
        if (!pinMatches(b.pin, f.pinHash))
          throw new Problem("That PIN did not match.", 403);
      } else {
        if (await session("child", f.id))
          throw new Problem("Parent sign-in required.", 403);
        f.pinHash = pinHash(b.pin);
        saveFamily(f);
      }
      await issue(f.id, "parent");
      await revoke("child");
      log(f.id, "parent.unlock", "Parent space unlocked");
      return ok({ ok: true });
    }
    if (path === "lock" && method === "POST") {
      await revoke("parent");
      return ok({ ok: true });
    }
    if (database().prepare("SELECT id FROM privacy_requests WHERE family=?").get(f.id) && !["gate","lock","state","export","owner"].includes(path))throw new Problem("This account has a pending deletion request. Contact the operator.",403);
    if ((path === "children" && method === "POST") || ["select","play","challenge","answer","playtime","native-session","save"].includes(path)) { if(!viewer.emailVerified || !viewer.email)throw new Problem("A parent must verify the account email before children can play.",403);requireConsent(f.id,viewer.email); }
    if (path === "library" && method === "GET")
      return ok({
        children: (consentValid(f.id,viewer.email)?f.children:[]).map((c) => ({
          id: c.id,
          name: c.name,
          avatar: c.avatar,
          grade: c.grade,
          wallet: wallet(f.id, c.id),
          timedPlay: c.timedPlay,
        })),
        entitlement: entitlement(f),
        needsSetup: !f.pinHash,
      });
    if (path === "select" && method === "POST") {
      const c = ownedChild(f, b.childId);
      rate("child-pin:" + f.id + ":" + c.id);
      if (!(await session("parent", f.id)) && !pinMatches(b.pin, c.pinHash))
        throw new Problem("That child PIN did not match.", 403);
      await issue(f.id, "child", c.id, 8 * 3600);
      await revoke("parent");
      await revoke("island");
      return ok({ ok: true });
    }
    if (path === "play" && method === "GET") {
      const s = await session("child", f.id);
      if (!s) throw new Problem("Choose your profile first.", 403);
      const c = ownedChild(f, s.child);
      const game = new URL(req.url).searchParams.get("game") as GameId;
      if (!GAME_IDS.includes(game)) throw new Problem("Unknown game.");
      const plan = resolvePlan(c, game);
      const banks = allBanks(f.id).filter(
        (bank) =>
          plan.subjects.includes(bank.subject) &&
          (plan.bankIds.length
            ? plan.bankIds.includes(bank.id)
            : bank.family === "official" &&
              c.grade >= bank.gradeMin &&
              c.grade <= bank.gradeMax),
      );
      const w = wallet(f.id, c.id);
      return ok({
        child: { id: c.id, name: c.name, avatar: c.avatar, grade: c.grade },
        game,
        plan,
        banks: banks.map((bank) => ({
          id: bank.id,
          title: bank.title,
          subject: bank.subject,
          questions: bank.questions,
        })),
        wallet: w,
        timedPlay: c.timedPlay,
        minutesAvailable: Math.max(
          0,
          w.credits * c.minutesPerCredit - w.minutesSpent,
        ),
        entitlement: entitlement(f),
      });
    }
    if (path === "challenge" && method === "POST") {
      const s = await session("child", f.id);
      if (!s) throw new Problem("Choose your profile first.", 403);
      const c = ownedChild(f, s.child);
      if (b.childId !== c.id)
        throw new Problem("Your active profile changed. Reopen the game.", 409);
      const game = b.game as GameId;
      if (!GAME_IDS.includes(game)) throw new Problem("Unknown game.");
      rate("challenge:" + f.id + ":" + c.id, 120, 3600000);
      const plan = resolvePlan(c, game);
      const banks = allBanks(f.id).filter(
        (bank) =>
          plan.subjects.includes(bank.subject) &&
          (plan.bankIds.length
            ? plan.bankIds.includes(bank.id)
            : bank.family === "official" &&
              c.grade >= bank.gradeMin &&
              c.grade <= bank.gradeMax),
      );
      let pool = banks.flatMap((bank) =>
        bank.questions.map((q) => ({ ...q, subject: bank.subject })),
      );
      if (!entitlement(f).unlocked) pool = pool.slice(0, 5);
      if (!pool.length)
        throw new Problem(
          "No matching questions. Ask a parent to assign a compatible bank.",
        );
      const q = pool[Math.floor(Math.random() * pool.length)];
      const id = randomUUID();
      database()
        .prepare(
          "INSERT INTO challenges(id,family,child,game,data,created) VALUES(?,?,?,?,?,?)",
        )
        .run(id, f.id, c.id, game, JSON.stringify(q), Date.now());
      return ok({
        id,
        prompt: q.subject === "typing" ? q.answer : q.prompt,
        subject: q.subject,
        choices: q.choices,
      });
    }
    if (path === "answer" && method === "POST") {
      const s = await session("child", f.id);
      if (!s) throw new Problem("Choose your profile first.", 403);
      const answer = text(b.answer, "Answer", 200);
      const result = atomic(() => {
        const row = database()
          .prepare(
            "SELECT * FROM challenges WHERE id=? AND family=? AND child=?",
          )
          .get(String(b.id), f.id, s.child!) as
          | {
              id: string;
              data: string;
              game: GameId;
              created: number;
              answered: number;
            }
          | undefined;
        if (!row || row.answered || Date.now() - row.created > 600000)
          throw new Problem(
            "This question has expired or was already answered.",
            409,
          );
        if (Date.now() - row.created < 700)
          throw new Problem("Take a moment to read the question.");
        const q = JSON.parse(row.data);
        const norm = (x: string) =>
          x.trim().toLocaleLowerCase().replace(/\s+/g, " ");
        const correct = norm(answer) === norm(q.answer);
        database()
          .prepare("UPDATE challenges SET answered=1 WHERE id=?")
          .run(row.id);
        const today = database()
          .prepare(
            "SELECT COALESCE(SUM(correct),0) total FROM rewards WHERE family=? AND child=? AND game!='lumen-isles' AND created>?",
          )
          .get(f.id, s.child!, Date.now() - 86400000) as { total: number };
        const credit =
          correct && row.game !== "lumen-isles" && today.total < 100 ? 1 : 0;
        database()
          .prepare("INSERT INTO rewards VALUES(?,?,?,?,?,?)")
          .run(row.id, f.id, s.child!, row.game, credit, Date.now());
        return {
          correct,
          answer: q.answer,
          explanation: q.explanation,
          credit,
          wallet: wallet(f.id, s.child!),
        };
      });
      return ok(result);
    }
    if (path === "playtime" && method === "POST") {
      const s = await session("child", f.id);
      if (!s) throw new Problem("Choose your profile first.", 403);
      const c = ownedChild(f, s.child);
      if (b.childId !== c.id)
        throw new Problem("Your active profile changed.", 409);
      if (!entitlement(f).unlocked)
        throw new Problem("Full island play needs a trial or membership.", 402);
      const r = atomic(() => {
        const now = Date.now();
        const lease = database()
          .prepare(
            "SELECT expires FROM sessions WHERE family=? AND child=? AND kind='island' AND expires>? ORDER BY expires DESC LIMIT 1",
          )
          .get(f.id, c.id, now) as { expires: number } | undefined;
        if (lease && lease.expires > now + 5000)
          return { ok: true, seconds: Math.ceil((lease.expires - now) / 1000) };
        const w = wallet(f.id, c.id);
        if (c.timedPlay && w.credits * c.minutesPerCredit - w.minutesSpent < 1)
          throw new Problem(
            "Time for a learning trail! Earn another minute to keep exploring.",
            402,
          );
        if (c.timedPlay)
          database()
            .prepare("INSERT INTO rewards VALUES(?,?,?,?,?,?)")
            .run(randomUUID(), f.id, c.id, "lumen-isles", 1, now);
        const expires = Math.max(now, lease?.expires ?? 0) + 60000;
        database()
          .prepare("INSERT INTO sessions VALUES(?,?,?,?,?)")
          .run(
            hash(randomBytes(32).toString("hex")),
            f.id,
            "island",
            c.id,
            expires,
          );
        return { ok: true, seconds: Math.ceil((expires - now) / 1000) };
      });
      return ok(r);
    }
    if (path === "native-session" && method === "POST") {
      const s = await session("child", f.id);
      if (!s || b.childId !== s.child)
        throw new Problem("Your active profile changed.", 409);
      const game = b.game as GameId;
      if (!GAME_IDS.includes(game) || game === "lumen-isles")
        throw new Problem("Only learning games earn discovery credits.");
      const ticket = database()
        .prepare(
          "SELECT family,child,expires FROM sessions WHERE token=? AND kind=?",
        )
        .get(hash(String(b.ticket)), "game:" + game) as
        | { family: string; child: string; expires: number }
        | undefined;
      if (
        !ticket ||
        ticket.family !== f.id ||
        ticket.child !== s.child ||
        ticket.expires < Date.now()
      )
        throw new Problem("Reopen the game to sync its learning record.", 403);
      const record = b.record as {
        id: string;
        lessonId: string;
        correct: number;
        errors: number;
        durationMs: number;
        passed: boolean;
        startedAt: number;
      };
      if (!record) throw new Problem("Missing learning record.");
      const lesson = text(record.lessonId, "Lesson", 100),
        id = text(record.id, "Session", 100);
      const correct = number(record.correct, 0, 2000),
        errors = number(record.errors, 0, 2000),
        duration = number(record.durationMs, 0, 7200000);
      if (
        !Number.isFinite(record.startedAt) ||
        record.startedAt < Date.now() - 7200000 ||
        record.startedAt > Date.now() + 5000
      )
        throw new Problem("This record is too old to earn new credits.");
      rate("native:" + f.id + ":" + s.child, 60, 3600000);
      const result = atomic(() => {
        const event = "native:" + game + ":" + s.child + ":" + id;
        if (
          database()
            .prepare("SELECT id FROM native_records WHERE id=?")
            .get(event)
        )
          return { credit: 0, alreadyRecorded: true };
        const total = database()
          .prepare(
            "SELECT COALESCE(SUM(correct),0) total FROM rewards WHERE family=? AND child=? AND event LIKE 'native:%' AND created>?",
          )
          .get(f.id, s.child!, Date.now() - 86400000) as { total: number };
        const sameLesson = database()
          .prepare(
            "SELECT id FROM native_records WHERE family=? AND child=? AND game=? AND lesson=? AND created>?",
          )
          .get(f.id, s.child!, game, lesson, Date.now() - 86400000);
        const credit =
          !sameLesson &&
          record.passed === true &&
          correct >= 5 &&
          duration >= 10000 &&
          Date.now() - (ticket.expires - 2 * 3600000) >= 10000 &&
          total.total < 30
            ? Math.min(3, Math.floor(correct / 5), 30 - total.total)
            : 0;
        database()
          .prepare("INSERT INTO native_records VALUES(?,?,?,?,?,?,?)")
          .run(
            event,
            f.id,
            s.child!,
            game,
            lesson,
            JSON.stringify({
              correct,
              errors,
              duration,
              passed: record.passed === true,
              verification: "game-reported",
            }),
            Date.now(),
          );
        database()
          .prepare("INSERT INTO rewards VALUES(?,?,?,?,?,?)")
          .run(event, f.id, s.child!, game, credit, Date.now());
        return { credit, alreadyRecorded: false };
      });
      return ok(result);
    }
    if (path === "save" && (method === "GET" || method === "POST")) {
      const s = await session("child", f.id);
      if (!s) throw new Problem("Choose your profile first.", 403);
      const game = (
        method === "GET" ? new URL(req.url).searchParams.get("game") : b.game
      ) as GameId;
      if (!GAME_IDS.includes(game)) throw new Problem("Unknown game.");
      if (method === "GET") {
        const r = database()
          .prepare(
            "SELECT data FROM game_saves WHERE family=? AND child=? AND game=?",
          )
          .get(f.id, s.child!, game) as { data: string } | undefined;
        return ok({ data: r ? JSON.parse(r.data) : null });
      }
      if (b.childId !== s.child)
        throw new Problem("Your active profile changed. Reopen the game.", 409);
      const data = JSON.stringify(b.data);
      if (data.length > 600000) throw new Problem("Save is too large.", 413);
      database()
        .prepare(
          "INSERT INTO game_saves VALUES(?,?,?,?,?) ON CONFLICT(family,child,game) DO UPDATE SET data=excluded.data,updated=excluded.updated",
        )
        .run(f.id, s.child!, game, data, Date.now());
      return ok({ ok: true });
    }
    await requireParent();
    if (path === "state" && method === "GET")
      return ok({
        consentRequired: !consentValid(f.id,viewer.email),
        family: safeFamily(f),
        banks: allBanks(f.id),
        entitlement: entitlement(f),
        wallets: Object.fromEntries(
          f.children.map((c) => [c.id, wallet(f.id, c.id)]),
        ),
        isOwner:
          (LOCAL_TEST() && viewer.isDevPreview) ||
          (process.env.FOXTRAIL_OWNER_IDS ?? "").split(",").includes(f.id),
      });
    if (path === "children" && method === "POST") {
      atomic(() => {
        f = family(f.id);
        if (!b.id && f.children.length >= 6)
          throw new Problem("Your family has room for six children.");
        const old = b.id ? ownedChild(f, b.id) : null;
        const plan = validatePlan(b.plan);
        const overrides: Child["overrides"] = {};
        if (b.overrides && typeof b.overrides === "object")
          for (const [g, v] of Object.entries(b.overrides)) {
            if (!GAME_IDS.includes(g as GameId))
              throw new Problem("Unknown game override.");
            overrides[g as GameId] = validatePlan(v);
          }
        for (const pl of [plan, ...Object.values(overrides)])
          for (const id of pl.bankIds)
            if (!bankById(f.id, id))
              throw new Problem("A selected question bank is unavailable.");
        const c: Child = {
          id: old?.id ?? randomUUID(),
          name: text(b.name, "Name", 30),
          avatar: AVATARS.includes(String(b.avatar))
            ? String(b.avatar)
            : AVATARS[0],
          grade: number(b.grade, 0, 5),
          pinHash: b.pin ? childPin(b.pin) : (old?.pinHash ?? childPin(b.pin)),
          plan,
          overrides,
          timedPlay: b.timedPlay === true,
          minutesPerCredit: number(b.minutesPerCredit ?? 1, 1, 10),
          created: old?.created ?? Date.now(),
        };
        if (old) f.children = f.children.map((x) => (x.id === c.id ? c : x));
        else f.children.push(c);
        saveFamily(f);
      });
      log(f.id, "child.save", "Child learning profile updated");
      return ok({ ok: true });
    }
    if (path === "children" && method === "DELETE") {
      const c = ownedChild(f, b.id);
      atomic(() => {
        f.children = f.children.filter((x) => x.id !== c.id);
        saveFamily(f);
        for (const table of [
          "challenges",
          "rewards",
          "game_saves",
          "sessions",
          "native_records",
        ])
          database()
            .prepare(`DELETE FROM ${table} WHERE family=? AND child=?`)
            .run(f.id, c.id);
      });
      log(f.id, "child.delete", "Child and learning records deleted");
      return ok({ ok: true });
    }
    if (path === "pin" && method === "POST") {
      if (!pinMatches(b.currentPin, f.pinHash))
        throw new Problem("Current PIN did not match.", 403);
      f.pinHash = pinHash(b.pin);
      saveFamily(f);
      database()
        .prepare("DELETE FROM sessions WHERE family=? AND kind='parent'")
        .run(f.id);
      await issue(f.id, "parent");
      return ok({ ok: true });
    }
    if (path === "banks" && method === "POST") {
      rate("bank-write:" + f.id, 60, 3600000);
      const old = b.id ? bankById(f.id, String(b.id)) : null;
      if (b.id && (!old || old.family !== f.id))
        throw new Problem("Make a copy to edit this bank.", 403);
      const bank = validateBank(b, f.id, old?.id);
      bank.share = old?.share;
      putBank(bank);
      log(f.id, "bank.save", bank.id);
      return ok({ bank });
    }
    if (path === "banks" && method === "DELETE") {
      const old = bankById(f.id, String(b.id));
      if (!old || old.family !== f.id)
        throw new Problem("Bank not found.", 404);
      database()
        .prepare("DELETE FROM banks WHERE id=? AND family=?")
        .run(old.id, f.id);
      return ok({ ok: true });
    }
    if (path === "share" && method === "POST") {
      if(!LOCAL_TEST() && b.enabled!==false)throw new Problem("Question banks are private during the initial launch.",403);
      const bank = bankById(f.id, String(b.id));
      if (!bank || bank.family !== f.id)
        throw new Problem("Only your own banks can be shared.", 403);
      bank.share =
        b.enabled === false
          ? undefined
          : (bank.share ?? randomBytes(8).toString("hex"));
      putBank(bank);
      return ok({ code: bank.share ?? null });
    }
    if (path === "import" && method === "POST") {
      if(!LOCAL_TEST())throw new Problem("Bank sharing is not available during the initial launch.",403);
      rate("share-import:" + f.id, 30, 3600000);
      const row = database()
        .prepare("SELECT data FROM banks WHERE share=?")
        .get(text(b.code, "Share code", 30).toLowerCase()) as
        | { data: string }
        | undefined;
      if (!row) throw new Problem("That sharing code is unavailable.", 404);
      const src = JSON.parse(row.data) as Bank;
      const bank = validateBank(src, f.id);
      bank.source = src.id;
      putBank(bank);
      return ok({ bank });
    }
    if (path === "copy" && method === "POST") {
      const src = bankById(f.id, String(b.id));
      if (!src) throw new Problem("Bank not found.", 404);
      const bank = validateBank({ ...src, title: src.title + " (copy)" }, f.id);
      putBank(bank);
      return ok({ bank });
    }
    if (path === "export" && method === "GET") {
      const saves = database()
        .prepare(
          "SELECT child,game,data,updated FROM game_saves WHERE family=?",
        )
        .all(f.id);
      const rewards = database()
        .prepare(
          "SELECT child,game,correct,created FROM rewards WHERE family=?",
        )
        .all(f.id);
      const nativeRecords = database()
        .prepare(
          "SELECT child,game,lesson,data,created FROM native_records WHERE family=?",
        )
        .all(f.id);
      return ok({
        nativeRecords,
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        family: safeFamily(f),
        banks: allBanks(f.id).filter((x) => x.family === f.id),
        saves,
        rewards,
      });
    }
    if (path === "owner" && method === "GET") {
      await requireOwner();
      return ok({
        agents: (
          database().prepare("SELECT data FROM agents").all() as {
            data: string;
          }[]
        ).map((r) => JSON.parse(r.data)),
        audit: database()
          .prepare(
            "SELECT actor,action,detail,created FROM audit ORDER BY id DESC LIMIT 100",
          )
          .all(),
        official: allBanks("official"),
        setup: {
          auth: !!process.env.CLERK_SECRET_KEY,
          billing: !!process.env.STRIPE_SECRET_KEY,
          webhook: !!process.env.STRIPE_WEBHOOK_SECRET,
          origin: process.env.NEXT_PUBLIC_APP_URL ?? "Local testing",
        },
      });
    }
    if (path === "owner/agents" && method === "POST") {
      await requireOwner();
      const scopes = Array.isArray(b.scopes) ? b.scopes : [];
      if (
        scopes.some(
          (s) =>
            !["reports:read", "catalog:read", "catalog:write"].includes(
              String(s),
            ),
        )
      )
        throw new Problem("Unknown permission.");
      const id = randomUUID(),
        key = "ft_agent_" + randomBytes(32).toString("base64url");
      const agent = {
        id,
        name: text(b.name, "Agent name", 60),
        scopes,
        expires: Date.now() + number(b.days ?? 30, 1, 90) * 86400000,
        revoked: false,
      };
      database()
        .prepare("INSERT INTO agents VALUES(?,?,?)")
        .run(id, hash(key), JSON.stringify(agent));
      log(f.id, "agent.create", agent.name);
      return ok({ agent, key });
    }
    if (path === "owner/agents" && method === "DELETE") {
      await requireOwner();
      database().prepare("DELETE FROM agents WHERE id=?").run(String(b.id));
      log(f.id, "agent.revoke", String(b.id));
      return ok({ ok: true });
    }
    if (path === "owner/banks" && method === "POST") {
      await requireOwner();
      const old = b.id ? bankById("official", String(b.id)) : null;
      if (b.id && !old) throw new Problem("Official bank not found.", 404);
      const bank = validateBank(b, "official", old?.id);
      putBank(bank);
      log(f.id, "official.save", bank.id);
      return ok({ bank });
    }
    throw new Problem("Not found.", 404);
  } catch (e) {
    if (e instanceof Problem) return ok({ error: e.message }, e.status);
    console.error(
      "Family request failed",
      e instanceof Error ? e.message : "Unknown error",
    );
    return ok(
      { error: "We could not finish that action. Please try again." },
      500,
    );
  }
}
export const GET = handle;
export const POST = handle;
export const DELETE = handle;
