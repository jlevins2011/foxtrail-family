/* Family host bridge v1. Loaded only by the authenticated game endpoint. */
(() => {
  "use strict";
  const boot = window.__FAMILY__;
  if (!boot) return;
  const memory = Object.assign({}, boot.save || {});
  const recorded = new Set();
  const retryRecords = new Map();
  for (const value of Object.values(memory)) {
    try {
      const state = JSON.parse(value);
      for (const child of state.children || [])
        for (const r of child.sessions || []) recorded.add(r.id);
    } catch {}
  }
  const native = Storage.prototype;
  const get = native.getItem,
    set = native.setItem,
    remove = native.removeItem;
  const isGame = (k) => /^(sumtrail|keytrail|camp-compass|lumen)[._]/.test(k);
  let pending;
  let dirty = false;
  let saving = false;
  function status(ok) {
    if (window.parent !== window)
      window.parent.postMessage(
        { type: "family-save-status", ok },
        location.origin,
      );
  }
  let flight = null;
  function flush() {
    if (flight) return flight.then((ok) => (ok && dirty ? flush() : ok));
    if (!dirty) return Promise.resolve(true);
    dirty = false;
    const body = JSON.stringify({
      game: boot.game,
      childId: boot.child.id,
      data: memory,
    });
    flight = (async () => {
      try {
        const r = await fetch("/api/family/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: new Blob([body]).size < 60000,
        });
        if (!r.ok) throw new Error("Save failed");
        status(true);
        return true;
      } catch {
        dirty = true;
        status(false);
        return false;
      } finally {
        flight = null;
      }
    })();
    return flight;
  }

  native.getItem = function (k) {
    return isGame(k) ? (memory[k] ?? null) : get.call(this, k);
  };
  native.setItem = function (k, v) {
    if (!isGame(k)) return set.call(this, k, v);
    memory[k] = String(v);
    if (boot.game !== "lumen-isles") {
      try {
        const state = JSON.parse(String(v));
        for (const child of state.children || [])
          for (const record of child.sessions || [])
            if (!recorded.has(record.id)) {
              retryRecords.set(record.id, record);
            }
      } catch {}
    }
    dirty = true;
    clearTimeout(pending);
    pending = setTimeout(flush, 500);
  };
  native.removeItem = function (k) {
    if (!isGame(k)) return remove.call(this, k);
    delete memory[k];
    dirty = true;
    clearTimeout(pending);
    pending = setTimeout(flush, 500);
  };
  const c = boot.child,
    key = {
      sumtrail: "sumtrail.v1",
      keytrail: "keytrail.v1",
      "camp-compass": "camp-compass.v1",
    }[boot.game];
  if (key) {
    let state;
    try {
      state = JSON.parse(memory[key] || "null");
    } catch {}
    state = state || {
      version: 1,
      children: [],
      settings: {
        sound: true,
        highContrast: false,
        showKeyboard: true,
        alwaysShowLabels: true,
      },
    };
    let child = (state.children || []).find((x) => x.id === c.id) || {
      id: c.id,
      createdAt: Date.now(),
      completedLessons: {},
      sessions: [],
      factsFound: [],
      journal: [],
      campsCleared: [],
    };
    Object.assign(child, {
      name: c.name,
      coat: "ember",
      gradeBand: c.grade <= 1 ? "k-1" : c.grade === 5 ? "5+" : String(c.grade),
      startWorldId: [
        "ember-grove",
        "ember-grove",
        "pine-bridge",
        "multiplying-meadow",
        "division-hollow",
        "night-sum",
      ][c.grade],
    });
    state.children = [child];
    state.activeChildId = c.id;
    state.parentPin = "managed-by-family";
    memory[key] = JSON.stringify(state);
  }
  if (boot.game === "lumen-isles") {
    let fam;
    try {
      fam = JSON.parse(memory.lumen_family_v1 || "null");
    } catch {}
    fam = fam || {
      version: 2,
      custom: [],
      overrides: {},
      assignments: {},
      promoSnooze: {},
      settings: {},
    };
    fam.profiles = [
      {
        id: c.id,
        studentId: c.id,
        name: c.name,
        emoji: c.avatar,
        color: "#4a9d9a",
        grade: c.grade === 0 ? "K" : String(c.grade),
        setupConfirmed: true,
        createdAt: Date.now(),
      },
    ];
    fam.settings.pin = "managed-by-family";
    memory.lumen_family_v1 = JSON.stringify(fam);
    memory.lumen_last_player = c.id;
  }
  window.addEventListener("message", (e) => {
    if (
      e.origin === location.origin &&
      e.source === parent &&
      e.data?.type === "family-flush"
    )
      void flush();
  });
  async function sendRecords() {
    for (const [id, record] of retryRecords) {
      try {
        const r = await fetch("/api/family/native-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            game: boot.game,
            childId: boot.child.id,
            ticket: boot.ticket,
            record,
          }),
        });
        if (r.ok || r.status === 400) {
          recorded.add(id);
          retryRecords.delete(id);
        }
      } catch {}
    }
  }
  setInterval(() => void sendRecords(), 1500);
  window.addEventListener("pagehide", () => {
    void flush();
  });
  setInterval(() => void flush(), 5000);
  const assigned = boot.plan?.bankIds?.length
    ? boot.banks.flatMap((b) => b.questions)
    : [];
  const maths = assigned.map((q) => {
    const m = q.prompt
      .trim()
      .match(/^(\d{1,3})\s*([+−×÷*\/x-])\s*(\d{1,3})(?:\s*=\s*\?)?$/);
    if (!m) return null;
    const a = Number(m[1]),
      b = Number(m[3]),
      op = {
        "+": "add",
        "−": "sub",
        "-": "sub",
        "×": "mul",
        "*": "mul",
        x: "mul",
        "÷": "div",
        "/": "div",
      }[m[2]];
    const answer =
      op === "add"
        ? a + b
        : op === "sub"
          ? a - b
          : op === "mul"
            ? a * b
            : b
              ? a / b
              : NaN;
    if (
      a > 144 ||
      b > 144 ||
      !Number.isInteger(answer) ||
      answer < 0 ||
      answer > 9999 ||
      Number(q.answer) !== answer
    )
      return null;
    return {
      id: "family-" + q.id,
      a,
      b,
      op,
      answer,
      prompt: q.prompt,
      tip: q.explanation || q.prompt + " = " + q.answer,
    };
  });
  window.FamilyHost = {
    boot,
    flush,
    assigned,
    mathFacts: maths.length && maths.every(Boolean) ? maths : [],
    practice: () =>
      parent.postMessage({ type: "family-practice" }, location.origin),
    parent: () => {
      void flush();
      window.top.location.assign("/dashboard");
    },
    library: () => {
      void flush();
      window.top.location.assign("/library");
    },
  };
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register = () =>
      Promise.reject(new Error("Game caching is managed by the family host."));
  }
  window.addEventListener("load", () => {
    if (boot.game !== "lumen-isles") return;
    const curricula = boot.banks.map((bank) => ({
      id: bank.id,
      name: bank.title,
      subject: "quiz",
      grade: c.grade === 0 ? "K" : String(c.grade),
      icon: "✦",
      tiers: [
        {
          name: bank.title,
          facts: bank.questions.map((q) => ({
            q: q.prompt,
            a: q.answer,
            choices:
              q.choices ||
              [
                q.answer,
                ...bank.questions
                  .filter((x) => x.answer !== q.answer)
                  .map((x) => x.answer),
              ].slice(0, 4),
            ref: q.explanation,
          })),
        },
      ],
    }));
    FamilyServices.useProvider({
      assignmentsFor: () =>
        curricula.map((x) => ({
          cid: x.id,
          weight: 1,
          enabled: true,
          autoGrade: false,
        })),
      curriculum: (id) => curricula.find((x) => x.id === id),
      allCurricula: () => curricula,
      nudgeMinutes: () => 5,
      promotionSnoozedAt: () => 0,
    });
    Parent.show = FamilyHost.parent;
    Parent.showSetup = FamilyHost.parent;
    if (boot.timedPlay) {
      let deadline = boot.leaseExpires,
        checking = false,
        stopped = false;
      const halt = (message) => {
        if (stopped) return;
        stopped = true;
        Store.saveNow();
        Game.stop();
        const panel = document.createElement("div");
        panel.style.cssText =
          "position:fixed;inset:0;background:#143747;color:white;z-index:999999;padding:12vh 10vw;font:22px system-ui";
        const title = document.createElement("h1");
        title.textContent = "Time for a learning trail";
        const info = document.createElement("p");
        info.textContent = message;
        const button = document.createElement("button");
        button.textContent = "Back to your games";
        button.style.cssText = "padding:16px;margin-top:24px";
        button.onclick = () => window.top.location.assign("/play");
        panel.append(title, info, button);
        document.body.append(panel);
      };
      setInterval(async () => {
        if (stopped) return;
        if (Date.now() > deadline) {
          halt(
            "Earn more island time in your learning games. Your island is saved.",
          );
          return;
        }
        if (deadline - Date.now() > 5000 || checking) return;
        checking = true;
        try {
          const r = await fetch("/api/family/playtime", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ childId: c.id }),
          });
          const data = await r.json();
          if (!r.ok) throw new Error(data.error);
          deadline = Date.now() + data.seconds * 1000;
        } catch (e) {
          halt(e.message || "Reconnect to check your island time.");
        } finally {
          checking = false;
        }
      }, 1000);
    }

    Store.family.profiles = [
      Object.assign(Store.family.profiles[0], {
        name: c.name,
        grade: c.grade === 0 ? "K" : String(c.grade),
        setupConfirmed: true,
      }),
    ];
    const originalLoad = Store.load;
    Store.load = function (profile) {
      const r = originalLoad(profile);
      const tools = Store.data.player.tools;
      ["scholar-lantern", "tideglass-lamp", "starlight-lamp"].forEach((id) => {
        tools["family-" + id] = boot.wallet.treasures.some((t) => t.id === id);
      });
      return r;
    };
  });
})();
