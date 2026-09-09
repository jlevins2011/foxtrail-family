import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
const code = readFileSync("public/game-bridge.js", "utf8");
function run(game = "sumtrail", save = {}, extra = {}) {
  const handlers = {};
  class Storage {
    data = {};
    getItem(k) {
      return this.data[k] ?? null;
    }
    setItem(k, v) {
      this.data[k] = v;
    }
    removeItem(k) {
      delete this.data[k];
    }
  }
  const storage = new Storage();
  let requests = [];
  const context = {
    Blob,
    Storage,
    localStorage: storage,
    location: { origin: "https://family.test" },
    navigator: {},
    console,
    setTimeout: () => 1,
    clearTimeout: () => {},
    setInterval: () => 1,
    fetch: async (url, options) => {
      requests.push({ url, body: JSON.parse(options.body) });
      return { ok: true };
    },
    parent: { postMessage() {} },
    window: {
      __FAMILY__: {
        game,
        child: { id: "child-A", name: "Juniper", grade: 3, avatar: "🦊" },
        save,
        plan: {},
        banks: [],
        wallet: { treasures: [] },
        ...extra,
      },
      addEventListener: (name, fn) => (handlers[name] = fn),
    },
  };
  context.window.parent = context.parent;
  context.window.top = { location: { assign() {} } };
  vm.runInNewContext(code, context);
  return { context, storage, requests, handlers };
}
test("shared identity and grade hydrate native math state", () => {
  const r = run();
  const s = JSON.parse(r.storage.getItem("sumtrail.v1"));
  assert.equal(s.activeChildId, "child-A");
  assert.equal(s.children.length, 1);
  assert.equal(s.children[0].gradeBand, "3");
  assert.equal(s.parentPin, "managed-by-family");
});
test("server save remains the source of truth and existing progress survives", () => {
  const s = {
    "sumtrail.v1": JSON.stringify({
      children: [
        {
          id: "child-A",
          name: "Old",
          sessions: [{ id: "prior" }],
          completedLessons: { one: { stars: 3 } },
        },
      ],
      settings: { sound: false },
    }),
  };
  const r = run("sumtrail", s);
  const child = JSON.parse(r.storage.getItem("sumtrail.v1")).children[0];
  assert.equal(child.name, "Juniper");
  assert.equal(child.completedLessons.one.stars, 3);
});
test("save includes game and child identity for server isolation", async () => {
  const r = run();
  r.storage.setItem("sumtrail.v1", "{}");
  await r.context.window.FamilyHost.flush();
  assert.equal(r.requests[0].body.childId, "child-A");
  assert.equal(r.requests[0].body.game, "sumtrail");
});
test("unrelated storage keys are not uploaded as game saves", async () => {
  const r = run();
  r.storage.setItem("not-a-game", "private");
  r.storage.setItem("sumtrail.v1", "{}");
  await r.context.window.FamilyHost.flush();
  assert.equal(r.requests[0].body.data["not-a-game"], undefined);
});
test("Lumen gets only the selected child and a managed parent boundary", () => {
  const r = run("lumen-isles");
  const s = JSON.parse(r.storage.getItem("lumen_family_v1"));
  assert.equal(s.profiles.length, 1);
  assert.equal(s.profiles[0].id, "child-A");
  assert.equal(s.settings.pin, "managed-by-family");
});

test("large saves use normal requests instead of the 64KB keepalive limit", async () => {
  const r = run();
  let keepalive;
  r.context.fetch = async (u, o) => {
    keepalive = o.keepalive;
    return { ok: true };
  };
  r.storage.setItem("sumtrail.v1", "x".repeat(80000));
  assert.equal(await r.context.window.FamilyHost.flush(), true);
  assert.equal(keepalive, false);
});
test("explicit compatible math banks hydrate real fact models", () => {
  const r = run(
    "sumtrail",
    {},
    {
      plan: { bankIds: ["bank"] },
      banks: [
        {
          questions: [
            {
              id: "q",
              prompt: "8 × 4",
              answer: "32",
              explanation: "Eight groups of four.",
            },
          ],
        },
      ],
    },
  );
  assert.equal(r.context.window.FamilyHost.mathFacts[0].answer, 32);
  assert.equal(r.context.window.FamilyHost.mathFacts[0].op, "mul");
});
test("unsupported or incorrect math expressions use the assigned trail instead", () => {
  const r = run(
    "sumtrail",
    {},
    {
      plan: { bankIds: ["bank"] },
      banks: [{ questions: [{ id: "q", prompt: "8 × 4", answer: "99" }] }],
    },
  );
  assert.equal(r.context.window.FamilyHost.mathFacts.length, 0);
});
test("native Home waits for a successful save and returns to game launcher", async () => {
  const r=run(); const events=[];
  r.storage.setItem("sumtrail.v1", "{}");
  r.context.fetch=async()=>{events.push("saved"); return {ok:true};};
  r.context.window.top.location.assign=path=>events.push(path);
  await r.context.window.FamilyHost.library();
  assert.deepEqual(events,["saved","/play"]);
});
test("failed save keeps a child inside the game instead of navigating away", async () => {
  const r=run(); let navigated=false;
  r.storage.setItem("sumtrail.v1", "{}");
  r.context.fetch=async()=>({ok:false});
  r.context.window.top.location.assign=()=>{navigated=true;};
  await r.context.window.FamilyHost.library();
  assert.equal(navigated,false);
});
