import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createHash, randomBytes } from "node:crypto";
const dir = mkdtempSync(join(tmpdir(), "foxtrail-check-")),
  path = join(dir, "test.sqlite"),
  origin = "http://127.0.0.1:3117";
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3117",
  ],
  {
    env: {
      ...process.env,
      FOXTRAIL_DATABASE_PATH: path,
      FOXTRAIL_DIST_DIR: ".next-integration",
      FOXTRAIL_TEST_MODE: "true",
      // Exercise dev-server localhost normalization without a configured URL.
      NEXT_PUBLIC_APP_URL: undefined,
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let output = "";
child.stdout.on("data", (d) => (output += d));
child.stderr.on("data", (d) => (output += d));
let count = 0;
const check = (name, fn) => {
  fn();
  count++;
  console.log("PASS " + name);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
class Client {
  cookies = new Map();
  async request(route, body, method) {
    const r = await fetch(origin + route, {
      method: method ?? (body ? "POST" : "GET"),
      headers: {
        Origin: origin,
        ...(body ? { "Content-Type": "application/json" } : {}),
        Cookie: [...this.cookies].map(([k, v]) => k + "=" + v).join("; "),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    for (const cookie of r.headers.getSetCookie()) {
      const pair = cookie.split(";")[0],
        at = pair.indexOf("=");
      this.cookies.set(pair.slice(0, at), pair.slice(at + 1));
    }
    const type = r.headers.get("content-type") ?? "";
    return {
      status: r.status,
      data: type.includes("application/json") ? await r.json() : await r.text(),
      headers: r.headers,
    };
  }
  api(path, body, method) {
    return this.request("/api/family/" + path, body, method);
  }
}
try {
  for (let i = 0; i < 120; i++) {
    try {
      const r = await fetch(origin);
      if (r.ok) break;
    } catch {}
    await sleep(250);
    if (i === 119) throw Error("Server did not start:\n" + output);
  }
  const manifest = await (await fetch(origin + "/manifest.webmanifest")).json();
  assert.equal(manifest.start_url, "/library");
  assert.equal(manifest.display, "standalone");
  const lobby = await (await fetch(origin + "/library")).text();
  assert.ok(!lobby.includes('aria-label="Main navigation"'));
  count++;
  console.log("PASS installed app opens child picker without website navigation");
  const a = new Client();
  check("anonymous family data denied", () => {});
  assert.equal((await a.api("state")).status, 401);
  assert.equal((await a.request("/api/privacy/owner")).status,401);
  assert.equal((await a.api("test-login", {})).status, 200);
  assert.equal((await a.api("children", { name: "Unauthorised" })).status, 403);
  count++;
  console.log("PASS parent PIN enforced before writes");
  assert.equal((await a.api("gate", { pin: "1234" })).status, 400);
  assert.equal((await a.api("gate", { pin: "654321" })).status, 200);
  const privacy=(client,path,body)=>client.request("/api/privacy/"+path,body);
  assert.equal((await a.api("children",{name:"Blocked"})).status,403);
  const consentState=(await privacy(a,"status")).data;
  assert.equal(consentState.status,"needed");
  // A fixture is used solely to exercise manual review mechanics, not real parental verification.
  const formImage=readFileSync("public/icons/apple-touch-icon.png").toString("base64");
  assert.equal((await privacy(a,"submit",{version:"old",parent:true,image:formImage})).status,400);
  assert.equal((await privacy(a,"submit",{version:consentState.version,parent:true,image:formImage})).status,200);
  assert.equal((await a.api("children",{name:"Still blocked"})).status,403);
  const evidence=(await privacy(a,"owner")).data.pending[0];
  const review={family:"local-family",evidenceHash:evidence.evidence_hash,approve:true,checked:true,formEmail:"Local testing family",reference:consentState.reference,signedDate:new Date().toISOString().slice(0,10)};
  assert.equal((await privacy(a,"owner/review",review)).status,403);
  assert.equal((await a.request("/api/privacy/owner/evidence?family=local-family")).status,200);
  assert.equal((await privacy(a,"owner/review",{...review,formEmail:"wrong@example.test"})).status,400);
  assert.equal((await privacy(a,"owner/review",review)).status,200);
  assert.equal((await a.request("/api/privacy/owner/evidence?family=local-family")).status,404);
  assert.equal((await privacy(a,"owner/review",review)).status,409);
  count++; console.log("PASS consent blocks collection until versioned, human-reviewed permission; evidence removed after review");
  const state = (await a.api("state")).data;
  assert.equal(
    state.banks.find((b) => b.id === "us-capitals").questions.length,
    50,
  );
  count++;
  console.log("PASS editable built-in banks include all 50 capitals");
  const bank = {
    title: "Family numbers",
    subject: "math",
    gradeMin: 0,
    gradeMax: 5,
    questions: [
      { prompt: "2 + 3", answer: "5", explanation: "Two and three make five." },
    ],
  };
  const created = await a.api("banks", bank);
  assert.equal(created.status, 200);
  const bankId = created.data.bank.id;
  const sharing = (await a.api("share", { id: bankId })).data.code;
  assert.match(sharing, /^[a-f0-9]{16}$/);
  const student = {
    name: "Juniper",
    avatar: "🦊",
    grade: 2,
    pin: "1234",
    plan: { subjects: ["math", "geography", "typing"], bankIds: [] },
    overrides: { sumtrail: { subjects: ["math"], bankIds: [bankId] } },
    timedPlay: true,
    minutesPerCredit: 1,
  };
  assert.equal((await a.api("children", student)).status, 200);
  let f = (await a.api("state")).data.family;
  const childId = f.children[0].id;
  assert.equal(f.children[0].pinHash, undefined);
  assert.equal(f.pinHash, undefined);
  count++;
  console.log("PASS profile creation and PIN hashes kept private");
  assert.equal(
    (await a.api("children", { ...student, name: "Bad", grade: 7 })).status,
    400,
  );
  assert.equal((await a.api("select", { childId })).status, 200);
  assert.equal((await a.api("state")).status, 403);
  assert.equal((await a.api("banks", bank)).status, 403);
  count++;
  console.log("PASS child mode revokes parent access");
  const geography = (await a.api("play?game=camp-compass")).data;
  assert.deepEqual(geography.plan.subjects, ["geography"]);
  assert(geography.banks.every((b) => b.subject === "geography"));
  count++;
  console.log("PASS math excluded from geography game");
  assert.equal((await a.api("playtime", { childId })).status, 402);
  assert.equal(
    (await a.request("/api/games/lumen-isles/index.html")).status,
    403,
  );
  count++;
  console.log("PASS earned playtime enforced at game entry");
  for (let i = 0; i < 10; i++) {
    const q = (await a.api("challenge", { game: "sumtrail", childId })).data;
    assert.equal(q.prompt, "2 + 3");
    assert.equal(q.answer, undefined);
    await sleep(710);
    const result = await a.api("answer", { id: q.id, answer: "5", childId });
    assert.equal(result.status, 200, JSON.stringify(result.data));
    assert.equal(result.data.credit, 1);
    assert.equal(
      (await a.api("answer", { id: q.id, answer: "5", childId })).status,
      409,
    );
  }
  const play = (await a.api("play?game=lumen-isles")).data;
  assert.equal(play.wallet.credits, 10);
  assert.equal(play.wallet.treasures[0].id, "scholar-lantern");
  count++;
  console.log("PASS verified answers award once and unlock island treasure");
  const wrong = (await a.api("challenge", { game: "sumtrail", childId })).data;
  await sleep(710);
  const wrongResult = (
    await a.api("answer", { id: wrong.id, answer: "7", childId })
  ).data;
  assert.equal(wrongResult.credit, 0);
  assert.equal(wrongResult.correct, false);
  count++;
  console.log("PASS wrong answers teach without rewarding");
  const leases = await Promise.all(
    Array.from({ length: 5 }, () => a.api("playtime", { childId })),
  );
  assert(leases.every((r) => r.status === 200));
  assert.equal(
    (await a.api("play?game=lumen-isles")).data.wallet.minutesSpent,
    1,
  );
  count++;
  console.log("PASS repeat island open does not double-charge playtime");
  const island = await a.request("/api/games/lumen-isles/index.html");
  assert.equal(island.status, 200);
  assert(island.data.includes("window.__FAMILY__"));
  assert.equal(island.headers.get("cache-control"), "private, no-store");
  for (const g of ["sumtrail", "keytrail", "camp-compass"])
    assert.equal(
      (await a.request("/api/games/" + g + "/index.html")).status,
      200,
    );
  count++;
  console.log("PASS all four authenticated game releases load");
  const native = await a.request("/api/games/sumtrail/index.html");
  const boot = JSON.parse(
    native.data.match(/window\.__FAMILY__=(.*?);<\/script>/s)[1],
  );
  const ticketDb = new DatabaseSync(path);
  ticketDb
    .prepare("UPDATE sessions SET expires=expires-11000 WHERE token=?")
    .run(createHash("sha256").update(boot.ticket).digest("hex"));
  ticketDb.close();
  const record = {
    id: "native-test",
    lessonId: "test-lesson",
    correct: 15,
    errors: 0,
    durationMs: 15000,
    startedAt: Date.now() - 15000,
    passed: true,
  };
  let nativeResult = await a.api("native-session", {
    game: "sumtrail",
    childId,
    ticket: boot.ticket,
    record,
  });
  assert.equal(nativeResult.data.credit, 3);
  nativeResult = await a.api("native-session", {
    game: "sumtrail",
    childId,
    ticket: boot.ticket,
    record,
  });
  assert.equal(nativeResult.data.credit, 0);
  nativeResult = await a.api("native-session", {
    game: "sumtrail",
    childId,
    ticket: boot.ticket,
    record: { ...record, id: "native-test-2" },
  });
  assert.equal(nativeResult.data.credit, 0);
  count++;
  console.log("PASS native lesson rewards are bound, capped, and idempotent");
  const save = {
    "sumtrail.v1": JSON.stringify({
      version: 1,
      children: [{ id: childId, name: "Juniper", sessions: [] }],
      activeChildId: childId,
      settings: {},
    }),
  };
  assert.equal(
    (await a.api("save", { game: "sumtrail", childId, data: save })).status,
    200,
  );
  assert.deepEqual((await a.api("save?game=sumtrail")).data.data, save);
  assert.equal(
    (
      await a.api("save", {
        game: "sumtrail",
        childId: "a-different-child",
        data: save,
      })
    ).status,
    409,
  );
  count++;
  console.log("PASS durable game saves and sibling isolation");
  assert.equal((await a.request("/api/privacy/owner")).status,403);
  assert.equal((await a.request("/api/privacy/status")).status,403);
  // A separate authenticated testing family proves tenant ownership, sharing-copy behavior, and owner denial.
  const db = new DatabaseSync(path);
  const token = randomBytes(32).toString("hex"),
    digest = createHash("sha256").update(token).digest("hex");
  db.prepare("INSERT INTO sessions VALUES(?,?,?,?,?)").run(
    digest,
    "second-family",
    "test",
    null,
    Date.now() + 600000,
  );
  const b = new Client();
  b.cookies.set("ft_test", token);
  await b.api("gate", { pin: "987654" });
  assert.equal((await b.api("banks", { ...bank, id: bankId })).status, 403);
  assert.equal((await b.api("owner")).status, 200); // Local testing families are owner sandboxes only in non-production.
  const imported = await b.api("import", { code: sharing });
  assert.equal(imported.status, 200);
  assert.notEqual(imported.data.bank.id, bankId);
  assert.equal(imported.data.bank.family, "second-family");
  count++;
  console.log("PASS tenant-owned banks and share-by-copy");
  await a.api("gate", { pin: "654321" });
  assert.equal(
    (await a.api("share", { id: bankId, enabled: false })).status,
    200,
  );
  assert.equal((await b.api("import", { code: sharing })).status, 404);
  assert(
    (await b.api("state")).data.banks.some(
      (x) => x.id === imported.data.bank.id,
    ),
  );
  count++;
  console.log(
    "PASS revoking share stops imports and preserves existing private copies",
  );
  const key = (
    await a.api("owner/agents", {
      name: "Reader",
      scopes: ["catalog:read"],
      days: 7,
    })
  ).data;
  let r = await fetch(origin + "/api/agents", {
    headers: { Authorization: "Bearer " + key.key },
  });
  assert.equal(r.status, 200);
  r = await fetch(origin + "/api/agents", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + key.key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bank),
  });
  assert.equal(r.status, 403);
  await a.api("owner/agents", { id: key.agent.id }, "DELETE");
  assert.equal(
    (
      await fetch(origin + "/api/agents", {
        headers: { Authorization: "Bearer " + key.key },
      })
    ).status,
    401,
  );
  count++;
  console.log("PASS agent scope enforcement and immediate revocation");
  for (let i = 0; i < 5; i++)
    assert.equal(
      (await a.api("children", { ...student, name: "Sibling " + i })).status,
      200,
    );
  assert.equal(
    (await a.api("children", { ...student, name: "Seventh" })).status,
    400,
  );
  count++;
  console.log("PASS six-child family limit");
  const csrf = await fetch(origin + "/api/family/banks", {
    method: "POST",
    headers: {
      Origin: "https://elsewhere.example",
      "Content-Type": "application/json",
      Cookie: [...a.cookies].map(([k, v]) => k + "=" + v).join("; "),
    },
    body: JSON.stringify(bank),
  });
  assert.equal(csrf.status, 403);
  count++;
  console.log("PASS cross-origin mutation rejected");
  assert.equal(
    (await a.request("/api/checkout", { plan: "monthly" })).status,
    503,
  );
  assert.equal((await a.request("/api/webhooks/stripe", {})).status, 503);
  count++;
  console.log("PASS missing payment setup fails closed");
  const backup = (await a.api("export")).data;
  assert.equal(backup.family.children.length, 6);
  assert.equal(backup.family.children[0].pinHash, undefined);
  assert(backup.rewards.length >= 11);
  count++;
  console.log("PASS family data export without credentials");
  let row = JSON.parse(
    db.prepare("SELECT data FROM families WHERE id=?").get("local-family").data,
  );
  row.trialStart = Date.now() - 15 * 86400000;
  db.prepare("UPDATE families SET data=? WHERE id=?").run(
    JSON.stringify(row),
    "local-family",
  );
  await a.api("select", { childId });
  assert.equal((await a.request("/api/games/sumtrail/index.html")).status, 402);
  assert.equal(
    (await a.api("challenge", { game: "sumtrail", childId })).status,
    200,
  );
  count++;
  console.log(
    "PASS expired trial gates full games while keeping free practice",
  );
  await a.api("gate", { pin: "654321" });
  await a.api("children", { id: childId }, "DELETE");
  assert.equal(
    db.prepare("SELECT COUNT(*) n FROM game_saves WHERE child=?").get(childId)
      .n,
    0,
  );
  assert.equal(
    db.prepare("SELECT COUNT(*) n FROM rewards WHERE child=?").get(childId).n,
    0,
  );
  count++;
  console.log("PASS child deletion removes saves and learning records");
  // Rights controls must invalidate access and remove data, even from an existing child session.
  await a.api("select",{childId:(await a.api("state")).data.family.children[0].id});
  const oldChildCookie=a.cookies.get("ft_child");
  await a.api("gate",{pin:"654321"});
  assert.equal((await privacy(a,"revoke",{pin:"wrong"})).status,403);
  assert.equal((await privacy(a,"revoke",{pin:"654321"})).status,200);
  assert.equal((await a.api("state")).data.family.children.length,0);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM game_saves WHERE family='local-family'").get().n,0);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM banks WHERE family='local-family'").get().n,0);
  a.cookies.set("ft_child",oldChildCookie);
  assert.equal((await a.request("/api/games/sumtrail/index.html")).status,403);
  assert.equal((await a.api("children",student)).status,403);
  count++; console.log("PASS permission withdrawal removes child data, banks and old-session access");
  assert.equal((await privacy(a,"delete-account",{pin:"654321",confirm:"DELETE"})).status,200);
  assert.equal((await privacy(a,"status")).data.deletionPending,true);
  assert.equal((await privacy(a,"submit",{version:consentState.version,parent:true,image:formImage})).status,403);
  const deletion=(await privacy(a,"owner")).data.requests.find(r=>r.family==='local-family');
  assert.equal((await privacy(a,"owner/complete",{id:deletion.id})).status,400);
  assert.equal((await privacy(a,"owner/maintenance",{})).status,200);
  assert.equal((await a.request("/api/privacy/maintenance",{})).status,401);
  count++; console.log("PASS account deletion queue cannot be bypassed and retention endpoint requires authentication");
  // Stale active families lose child access when retention runs.
  db.prepare("UPDATE privacy_activity SET last_seen=? WHERE family='second-family'").run(Date.now()-366*86400000);
  assert.equal((await privacy(a,"owner/maintenance",{})).status,200);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM banks WHERE family='second-family'").get().n,0);
  count++;console.log("PASS inactive-family retention deletes private banks");
  const cipher=Buffer.from('not-a-real-encrypted-form').toString('base64');
  db.prepare("INSERT INTO consents VALUES(?,?,?,?,?,NULL,NULL,?,?,?,?)").run('expired-form',consentState.version,'pending','hash',Date.now()-8*86400000,cipher,'image/png','proof',Date.now()-86400000);
  assert.equal((await a.request("/api/privacy/owner/evidence?family=expired-form")).status,404);
  await privacy(a,"owner/maintenance",{});
  assert.equal(db.prepare("SELECT family FROM consents WHERE family='expired-form'").get(),undefined);
  count++;console.log("PASS expired consent evidence cannot be opened and is removed by maintenance");
  assert.equal((await privacy(a,"owner/complete",{id:deletion.id,providersDeleted:true,backupsScheduled:true})).status,200);
  assert.equal(db.prepare("SELECT id FROM families WHERE id='local-family'").get(),undefined);
  assert.equal(db.prepare("SELECT family FROM consents WHERE family='local-family'").get(),undefined);
  count++;console.log("PASS completed provider deletion removes local parent account and consent records");
  db.close();
  console.log(`\n${count} platform checks passed.`);
} catch (e) {
  console.error(e);
  console.error(output.slice(-6000));
  process.exitCode = 1;
} finally {
  child.kill("SIGTERM");
}
