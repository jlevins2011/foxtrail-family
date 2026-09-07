"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { games } from "@/config/games";
import { api } from "./FamilyApp";
type Context = {
  child: { id: string; name: string; avatar: string; grade: number };
  plan: { subjects: string[]; syllabus?: string };
  wallet: { credits: number; treasures: { id: string; name: string }[] };
  timedPlay: boolean;
  minutesAvailable: number;
  entitlement: { unlocked: boolean; label: string };
  banks: { title: string }[];
};
export function PlaySpace({ game }: { game?: string }) {
  const [context, setContext] = useState<Context | null>(null),
    [error, setError] = useState(""),
    [mode, setMode] = useState<"choose" | "practice" | "adventure">("choose"),
    [lease, setLease] = useState(false),
    [saveStatus, setSaveStatus] = useState("");
  const current = games.find((g) => g.id === game);
  const gid = current?.id ?? "sumtrail";
  const refresh = useCallback(async () => {
    try {
      setContext(await api("play?game=" + gid));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [gid]);
  useEffect(() => {
    api("play?game="+gid).then(d=>{setContext(d);setError("");}).catch(e=>setError(e.message));
  }, [gid]);
  useEffect(() => {
    const listener = (e: MessageEvent) => {
      if (
        e.origin !== location.origin ||
        e.source !==
          (document.getElementById("family-game") as HTMLIFrameElement)
            ?.contentWindow
      )
        return;
      if (e.data?.type === "family-save-status")
        setSaveStatus(
          e.data.ok
            ? "Progress saved"
            : "Progress could not save. Keep this page open and try again.",
        );
      if (e.data?.type === "family-practice") {
        setMode("practice");
        setLease(false);
        void refresh();
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [refresh]);
  const activeChildId=context?.child.id;
  useEffect(() => {
    if (gid !== "lumen-isles" || mode !== "adventure" || !activeChildId) return;
    let cancelled = false;
    async function renew() {
      try {
        await api("playtime", { childId: activeChildId });
        if (!cancelled) setLease(true);
      } catch (e) {
        if (!cancelled) {
          setLease(false);
          setMode("choose");
          setError((e as Error).message);
        }
      }
    }
    void renew();
    const timer = setInterval(() => void renew(), 60000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [gid, mode, activeChildId]);
  const back = async () => {
    const frame = document.getElementById(
      "family-game",
    ) as HTMLIFrameElement | null;
    const host = (
      frame?.contentWindow as unknown as {
        FamilyHost?: { flush: () => Promise<boolean> };
      }
    )?.FamilyHost;
    if (host && !(await host.flush())) {
      setError(
        "Your progress has not saved yet. Please reconnect and try again.",
      );
      return;
    }
    setMode("choose");
    setLease(false);
    await refresh();
  };
  if (!context)
    return (
      <div className="workspace">
        <h1>Choose your adventure.</h1>
        <p className="notice">{error || "Opening your family…"}</p>
        <Link className="action" href="/library">
          Choose your profile
        </Link>
      </div>
    );
  if (!current)
    return (
      <div className="workspace">
        <p className="eyebrow">
          {context.child.avatar} Hello, {context.child.name}
        </p>
        <h1>Where will you go today?</h1>
        <p style={{ marginBottom: 24 }}>
          ✦ {context.wallet.credits} discovery credits
        </p>
        <div className="game-grid">
          {games.map((g, i) => (
            <Link
              className={"trail-card trail-" + i}
              key={g.id}
              href={"/play/" + g.id}
            >
              <span className="game-number">{g.subject}</span>
              <h3>{g.name}</h3>
              <p>{g.blurb}</p>
              <span className="trail-link">Let’s go ↗</span>
            </Link>
          ))}
        </div>
        <div className="actions">
          <Link className="text-link" href="/library">
            Switch learner
          </Link>
        </div>
      </div>
    );
  return (
    <div className="workspace">
      <div className="play-bar">
        <Link className="text-link" href="/play">
          ← All games
        </Link>
        <span>
          {context.child.avatar} {context.child.name} · ✦{" "}
          {context.wallet.credits}
        </span>
        {mode !== "choose" && (
          <button className="action secondary" onClick={() => void back()}>
            Back to camp
          </button>
        )}
      </div>
      <p role="status" className="muted">
        {saveStatus}
      </p>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      {mode === "choose" ? (
        <>
          <p className="eyebrow">{current.subject}</p>
          <h1>{current.name}</h1>
          {context.plan.syllabus && (
            <p className="notice">{context.plan.syllabus}</p>
          )}
          <div className="panel-grid">
            <section className="panel">
              <h2>
                {gid === "lumen-isles"
                  ? "Your island is waiting."
                  : "Your learning trail"}
              </h2>
              <p>
                {gid === "lumen-isles"
                  ? "Build a home, explore the islands, and bring your learning treasures along."
                  : "Practice your assigned questions. Each correct answer earns a discovery credit toward special treasures in Lumen Isles."}
              </p>
              {gid !== "lumen-isles" && (
                <p className="muted" style={{ marginTop: 12 }}>
                  {context.banks.map((b) => b.title).join(" · ") ||
                    "No question banks assigned yet."}
                </p>
              )}
              <button
                className="action"
                style={{ marginTop: 24 }}
                onClick={() => {
                  setError("");
                  setMode(gid === "lumen-isles" ? "adventure" : "practice");
                }}
                disabled={
                  gid === "lumen-isles" && !context.entitlement.unlocked
                }
              >
                {gid === "lumen-isles"
                  ? "Explore Lumen Isles →"
                  : "Start assigned trail →"}
              </button>
              {gid === "lumen-isles" && context.timedPlay && (
                <p className="muted" style={{ marginTop: 12 }}>
                  {context.minutesAvailable} earned minutes available
                </p>
              )}
            </section>
            <section className="panel">
              <h2>
                {gid === "lumen-isles"
                  ? "Treasures from your trails"
                  : "The original adventure"}
              </h2>
              {gid === "lumen-isles" ? (
                <>
                  <p>
                    These island lights are only earned by learning in the other
                    games. Find unlocked lights in your building menu.
                  </p>
                  {context.wallet.treasures.length ? (
                    context.wallet.treasures.map((t) => (
                      <span className="badge" key={t.id}>
                        ✦ {t.name}
                      </span>
                    ))
                  ) : (
                    <p className="muted">
                      10 credits · Scholar’s lantern
                      <br />
                      30 credits · Tideglass lamp
                      <br />
                      60 credits · Starlight lamp
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p>
                    Explore the game’s built-in camps and workshops. Your family
                    profile and saved adventure follow you here.
                  </p>
                  <p className="muted">
                    Completed campaign lessons also earn discovery credits: up
                    to three per lesson, once a day. Compatible custom questions
                    also appear inside the game. Other question formats are
                    available on your assigned trail.
                  </p>
                  <button
                    className="action secondary"
                    style={{ marginTop: 24 }}
                    disabled={!context.entitlement.unlocked}
                    onClick={() => setMode("adventure")}
                  >
                    Continue adventure →
                  </button>
                </>
              )}
              {!context.entitlement.unlocked && (
                <p className="notice" style={{ marginTop: 16 }}>
                  Ask a parent about full membership. Your free practice
                  selection is still available.
                </p>
              )}
            </section>
          </div>
        </>
      ) : mode === "practice" ? (
        <Practice
          game={gid}
          childId={context.child.id}
          onReward={() => void refresh()}
        />
      ) : gid === "lumen-isles" && !lease ? (
        <p className="notice">Opening your island…</p>
      ) : (
        <iframe
          id="family-game"
          className="game-frame"
          title={current.name}
          src={"/api/games/" + gid + "/index.html"}
          allow="fullscreen; autoplay"
        />
      )}
    </div>
  );
}
function Practice({
  game,
  childId,
  onReward,
}: {
  game: string;
  childId: string;
  onReward: () => void;
}) {
  const [q, setQ] = useState<{
      id: string;
      prompt: string;
      subject: string;
      choices?: string[];
    } | null>(null),
    [result, setResult] = useState<{
      correct: boolean;
      answer: string;
      explanation: string;
      credit: number;
    } | null>(null),
    [answer, setAnswer] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [steps, setSteps] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const next = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      setQ(await api("challenge", { game, childId }));
      setResult(null);
      setAnswer("");
      setTimeout(() => input.current?.focus(), 10);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [game, childId]);
  useEffect(() => {
    api("challenge",{game,childId}).then(q=>{setQ(q);setResult(null);setAnswer("");}).catch(e=>setError(e.message));
  }, [game,childId]);
  return (
    <section className="panel practice-surface">
      <p className="eyebrow">Your assigned trail · {steps} discoveries</p>
      <div className="trail-progress" aria-label={steps + " discoveries"}>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={i < steps % 10 ? "lit" : ""}>
            ✦
          </span>
        ))}
      </div>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      {q && (
        <>
          <p className="muted">
            {q.subject === "typing" ? "Type this carefully" : q.subject}
          </p>
          <h1 style={{ fontSize: "clamp(28px,4vw,44px)" }}>{q.prompt}</h1>
          {!result ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError("");
                try {
                  const r = await api("answer", { id: q.id, answer, childId });
                  setResult(r);
                  if (r.correct) setSteps((n) => n + 1);
                  onReward();
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {q.choices ? (
                <div className="actions">
                  {q.choices.map((c) => (
                    <button
                      type="button"
                      className={"action " + (answer === c ? "" : "secondary")}
                      aria-pressed={answer === c}
                      key={c}
                      onClick={() => setAnswer(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              ) : null}
              <label>
                Your answer
                <input
                  ref={input}
                  value={answer}
                  maxLength={200}
                  onChange={(e) => setAnswer(e.target.value)}
                  required
                  autoComplete="off"
                  spellCheck={false}
                />
              </label>
              <button className="action" disabled={busy || !answer.trim()}>
                Check answer →
              </button>
            </form>
          ) : (
            <div aria-live="polite">
              <h2>
                {result.correct ? "You did it!" : "Let’s learn this one."}
              </h2>
              <p>
                {result.correct && result.credit
                  ? "✦ One discovery credit earned."
                  : "The answer is " + result.answer + "."}
              </p>
              <p>{result.explanation}</p>
              <button
                className="action"
                style={{ marginTop: 24 }}
                onClick={() => void next()}
                disabled={busy}
              >
                Next discovery →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
