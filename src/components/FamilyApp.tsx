"use client";
import {useRouter} from "next/navigation";
import { useEffect, useState, useCallback, type FormEvent } from "react";
import Link from "next/link";
import { PrivacyCenter, PrivacyReview } from "./PrivacyCenter";
import { AgentTools } from "./AgentTools";
import type { Child, Plan, Bank, Subject } from "@/lib/platform/model";
import { games } from "@/config/games";
const subjects: Subject[] = [
  "math",
  "geography",
  "typing",
  "spelling",
  "reading",
  "science",
  "history",
];
const avatars = ["🦊", "🐻", "🐰", "🦉", "🐢", "🐱"];
const capabilities: Record<string, string[]> = {
  sumtrail: ["math"],
  "camp-compass": ["geography"],
  keytrail: ["typing", "spelling", "reading"],
  "lumen-isles": subjects,
};
type SafeChild = Omit<Child, "pinHash">;
type Wallet = {
  credits: number;
  answers: number;
  minutesSpent: number;
  treasures: { id: string; name: string; cost: number; description: string }[];
};
type Data = {
  consentRequired: boolean;
  family: {
    children: SafeChild[];
    hasPin: boolean;
    billing: { status: string; plan: string } | null;
  };
  banks: Bank[];
  wallets: Record<string, Wallet>;
  entitlement: { unlocked: boolean; label: string };
  isOwner: boolean;
};
export async function api(path: string, body?: unknown, method?: string) {
  const response = await fetch("/api/family/" + path, {
    method: method ?? (body ? "POST" : "GET"),
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Please try again.");
  return data;
}
function Notice({ message }: { message: string }) {
  return message ? (
    <p className="notice" role="status">
      {message}
    </p>
  ) : null;
}
function download(value: unknown, name: string) {
  const u = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
export function ParentSpace({ section = "profiles" }: { section?: string }) {
  const [gate, setGate] = useState<{
      hasPin: boolean;
      unlocked: boolean;
    } | null>(null),
    [data, setData] = useState<Data | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const g = await api("gate");
      setGate(g);
      if (g.unlocked) setData(await api("state"));
    } catch (e) {
      setMessage((e as Error).message);
    }
  }, []);
  useEffect(() => {
    api("gate").then(async g=>{setGate(g);if(g.unlocked)setData(await api("state"));}).catch(e=>setMessage(e.message));
  }, []);
  async function unlock(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("gate", { pin: new FormData(e.currentTarget).get("pin") });
      setMessage("");
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setMessage("");
    try {
      await fn();
      await load();
      setMessage("Saved.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!gate?.unlocked)
    return (
      <div className="workspace" style={{ maxWidth: 570 }}>
        <p className="eyebrow">Grown-ups only</p>
        <h1>Your parent space.</h1>
        <Notice message={message} />
        {gate ? (
          <form className="panel" onSubmit={unlock}>
            <h2>{gate.hasPin ? "Welcome back." : "Make a parent PIN."}</h2>
            <p className="muted">
              {gate.hasPin
                ? "Enter your parent PIN to manage profiles, banks, and membership."
                : "Use 6–10 digits. This is separate from the four-digit PINs children use. Keep it just for grown-ups."}
            </p>
            <label style={{ marginTop: 20 }}>
              Parent PIN
              <input
                name="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{6,10}"
                minLength={6}
                maxLength={10}
                required
                autoComplete="off"
              />
            </label>
            <button className="action" disabled={busy}>
              {gate.hasPin ? "Unlock parent space" : "Save parent PIN"}
            </button>
          </form>
        ) : (
          <div className="panel">
            <p>Sign in with your parent account to continue.</p>
            <Link className="action" href="/sign-in">
              Parent sign-in
            </Link>
          </div>
        )}
        <Link className="text-link" href="/library">
          ← Back to the children’s library
        </Link>
      </div>
    );
  if (!data)
    return (
      <div className="workspace">
        <p role="status">Opening your family…</p>
      </div>
    );
  return (
    <div className="workspace">
      <AgentTools />
      <div className="section-heading">
        <div>
          <p className="eyebrow">A home for every learner</p>
          <h1>Parent space</h1>
        </div>
        <button
          className="action secondary"
          onClick={async () => {
            await api("lock", {});
            setData(null);
            setGate({ ...gate, unlocked: false });
          }}
        >
          Lock parent space
        </button>
      </div>
      <nav className="tab-nav" aria-label="Parent navigation">
        <Link href="/dashboard">Children & learning</Link>
        <Link href="/dashboard/question-banks">Question banks</Link>
        <Link href="/dashboard/progress">Progress & rewards</Link>
        <Link href="/dashboard/membership">Membership & privacy</Link>
        <Link href="/dashboard/privacy">Parent permission</Link>
        {data.isOwner && <Link href="/dashboard/owner">Owner controls</Link>}
      </nav>
      <Notice message={message} />
      {data.consentRequired && <p className="notice">Complete <Link href="/dashboard/privacy">Parent permission</Link> before creating child profiles or playing.</p>}
      {section === "privacy" ? <PrivacyCenter/> : section === "profiles" ? (
        data.consentRequired ? <PrivacyCenter/> : <Profiles data={data} act={act} busy={busy} />
      ) : section === "banks" ? (
        <Banks banks={data.banks} act={act} busy={busy} />
      ) : section === "progress" ? (
        <Progress data={data} />
      ) : section === "owner" ? (
        <Owner />
      ) : (
        <Membership data={data} act={act} />
      )}
    </div>
  );
}
function PlanEditor({
  value,
  onChange,
  banks,
  game,
}: {
  value: Plan;
  onChange: (p: Plan) => void;
  banks: Bank[];
  game?: string;
}) {
  const allowed = game ? capabilities[game] : subjects;
  return (
    <>
      <label>
        Course of study or syllabus notes (no personal or sensitive information)
        <textarea
          value={value.syllabus ?? ""}
          maxLength={2000}
          placeholder="For example: this month we are practising multiplication and the western states."
          onChange={(e) => onChange({ ...value, syllabus: e.target.value })}
        />
      </label>
      <p className="muted">Subjects{game ? " supported by this game" : ""}</p>
      <div className="actions" style={{ margin: "12px 0" }}>
        {subjects
          .filter((s) => allowed.includes(s))
          .map((s) => (
            <label className="check-label" key={s}>
              <input
                type="checkbox"
                checked={value.subjects.includes(s)}
                onChange={(e) =>
                  onChange({
                    ...value,
                    subjects: e.target.checked
                      ? [...value.subjects, s]
                      : value.subjects.filter((x) => x !== s),
                  })
                }
              />
              {s}
            </label>
          ))}
      </div>
      <label>
        Question banks{" "}
        <span className="muted">
          Leave all unchecked to use built-in banks for this grade.
        </span>
      </label>
      {banks
        .filter(
          (b) =>
            value.subjects.includes(b.subject) && allowed.includes(b.subject),
        )
        .map((b) => (
          <label className="check-label" key={b.id}>
            <input
              type="checkbox"
              checked={value.bankIds.includes(b.id)}
              onChange={(e) =>
                onChange({
                  ...value,
                  bankIds: e.target.checked
                    ? [...value.bankIds, b.id]
                    : value.bankIds.filter((id) => id !== b.id),
                })
              }
            />
            {b.title}
          </label>
        ))}
    </>
  );
}
function Profiles({
  data,
  act,
  busy,
}: {
  data: Data;
  act: (fn: () => Promise<unknown>) => Promise<void>;
  busy: boolean;
}) {
  const [editing, setEditing] = useState<Partial<SafeChild> | null>(null),
    [pin, setPin] = useState("");
  function start(c?: SafeChild) {
    setEditing(
      c ?? {
        name: "",
        avatar: "🦊",
        grade: 0,
        plan: { subjects: ["math", "geography", "typing"], bankIds: [] },
        overrides: {},
        timedPlay: false,
        minutesPerCredit: 1,
      },
    );
    setPin("");
  }
  const edit = (patch: Partial<SafeChild>) =>
    setEditing((e) => ({ ...e, ...patch }));
  if (editing)
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void act(async () => {
            await api("children", { ...editing, pin });
            setEditing(null);
          });
        }}
      >
        <section className="panel">
          <h2>{editing.id ? "Edit learning profile" : "Meet your learner"}</h2>
          <div className="panel-grid">
            <div>
              <label>
                First name or nickname
                <input
                  value={editing.name}
                  onChange={(e) => edit({ name: e.target.value })}
                  maxLength={30}
                  required
                />
              </label>
              <label>
                Avatar
                <select
                  value={editing.avatar}
                  onChange={(e) => edit({ avatar: e.target.value })}
                >
                  {avatars.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </label>
            </div>
            <div>
              <label>
                Grade
                <select
                  value={editing.grade}
                  onChange={(e) => edit({ grade: Number(e.target.value) })}
                >
                  {[0, 1, 2, 3, 4, 5].map((g) => (
                    <option key={g} value={g}>
                      {g === 0 ? "Kindergarten" : "Grade " + g}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {editing.id
                  ? "New child PIN (leave blank to keep it)"
                  : "Four-digit child PIN"}
                <input
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  pattern="[0-9]{4}"
                  maxLength={4}
                  required={!editing.id}
                  autoComplete="off"
                />
              </label>
            </div>
          </div>
        </section>
        <section className="panel">
          <h2>One learning plan, all their games.</h2>
          <p className="muted">
            Each game uses compatible subjects only. Geography stays geography;
            typing stays typing.
          </p>
          <PlanEditor
            value={editing.plan!}
            onChange={(plan) => edit({ plan })}
            banks={data.banks}
          />
        </section>
        <section className="panel">
          <h2>Make an exception for a game</h2>
          {games.map((g) => (
            <div className="question-row" key={g.id}>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={!!editing.overrides?.[g.id]}
                  onChange={(e) => {
                    const overrides = { ...editing.overrides };
                    if (e.target.checked)
                      overrides[g.id] = {
                        subjects: editing.plan!.subjects.filter((s) =>
                          capabilities[g.id].includes(s),
                        ),
                        bankIds: [],
                      };
                    else delete overrides[g.id];
                    edit({ overrides });
                  }}
                />
                Use a separate plan for {g.name}
              </label>
              {editing.overrides?.[g.id] && (
                <PlanEditor
                  game={g.id}
                  value={editing.overrides[g.id]!}
                  banks={data.banks}
                  onChange={(plan) =>
                    edit({ overrides: { ...editing.overrides, [g.id]: plan } })
                  }
                />
              )}
            </div>
          ))}
        </section>
        <section className="panel">
          <h2>Lumen Isles rewards</h2>
          <p>
            Correct answers in learning trails earn discovery credits. Special
            island treasures can only be earned this way.
          </p>
          <label className="check-label" style={{ marginTop: 20 }}>
            <input
              type="checkbox"
              checked={editing.timedPlay}
              onChange={(e) => edit({ timedPlay: e.target.checked })}
            />
            Require earned playtime for Lumen Isles
          </label>
          {editing.timedPlay && (
            <label>
              Minutes earned for each discovery credit
              <select
                value={editing.minutesPerCredit}
                onChange={(e) =>
                  edit({ minutesPerCredit: Number(e.target.value) })
                }
              >
                {[1, 2, 3, 5, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} minute{n > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
          <p className="muted">
            When this is off, island play has no learning-time requirement.
            Learning-exclusive treasures still apply.
          </p>
        </section>
        <div className="actions">
          <button className="action" disabled={busy}>
            Save learning profile
          </button>
          <button
            type="button"
            className="action secondary"
            onClick={() => setEditing(null)}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  return (
    <>
      <div className="section-heading">
        <h2>
          Your learners{" "}
          <span className="muted">{data.family.children.length} / 6</span>
        </h2>
        <button
          className="action"
          disabled={data.family.children.length >= 6}
          onClick={() => start()}
        >
          ＋ Add a child
        </button>
      </div>
      {!data.family.children.length && (
        <div className="panel empty">
          Add your first child to choose their grade, learning plan, and games.
        </div>
      )}
      {data.family.children.map((c) => (
        <div className="panel child-row" key={c.id}>
          <span className="avatar">{c.avatar}</span>
          <div>
            <h3>{c.name}</h3>
            <p className="muted">
              {c.grade === 0 ? "Kindergarten" : "Grade " + c.grade} ·{" "}
              {c.plan.subjects.join(", ")}
            </p>
            <span className="badge">
              {Object.keys(c.overrides).length
                ? `${Object.keys(c.overrides).length} game exceptions`
                : "One plan across games"}
            </span>
            <span className="badge">
              {c.timedPlay ? "Earned island time" : "Open island play"}
            </span>
          </div>
          <div className="actions">
            <button className="action secondary" onClick={() => start(c)}>
              Edit profile
            </button>
            <button
              className="text-link"
              onClick={() => {
                if (
                  confirm(
                    `Delete ${c.name}’s profile and all saved learning and game progress? This cannot be undone.`,
                  )
                )
                  void act(() => api("children", { id: c.id }, "DELETE"));
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
export function parseCsv(raw: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '"') {
      if (quoted && raw[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && raw[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (quoted) throw new Error("A quoted CSV field is not closed.");
  row.push(field);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}
function Banks({
  banks,
  act,
  busy,
  official = false,
}: {
  banks: Bank[];
  act: (fn: () => Promise<unknown>) => Promise<void>;
  busy: boolean;
  official?: boolean;
}) {
  const [editing, setEditing] = useState<Partial<Bank> | null>(null),
    [code, setCode] = useState(""),
    [error, setError] = useState("");
  const blank = () =>
    setEditing({
      title: "",
      subject: "math",
      gradeMin: 0,
      gradeMax: 5,
      questions: [{ id: "new", prompt: "", answer: "", explanation: "" }],
    });
  async function upload(file: File) {
    try {
      if (file.size > 700000)
        throw new Error("Use a file smaller than 700 KB.");
      const raw = await file.text();
      if (file.name.endsWith(".json")) {
        const b = JSON.parse(raw);
        setEditing({
          ...b,
          id: editing?.id,
          family: undefined,
          share: undefined,
        });
      } else {
        const [header, ...rows] = parseCsv(raw);
        const h = header.map((s) => s.trim().toLowerCase());
        const prompt = h.indexOf("prompt"),
          answer = h.indexOf("answer"),
          explanation = h.indexOf("explanation");
        if (prompt < 0 || answer < 0)
          throw new Error("CSV needs prompt and answer column headings.");
        setEditing((prev) => ({
          ...prev,
          questions: rows.map((r, i) => ({
            id: String(i),
            prompt: r[prompt] ?? "",
            answer: r[answer] ?? "",
            explanation: r[explanation] ?? "",
          })),
        }));
      }
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  if (editing)
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void act(async () => {
            await api(official ? "owner/banks" : "banks", editing);
            setEditing(null);
          });
        }}
      >
        <section className="panel">
          <h2>
            {editing.id ? "Edit question bank" : "Create a question bank"}
          </h2>
          <Notice message={error} />
          <label>
            Title
            <input
              value={editing.title ?? ""}
              onChange={(e) =>
                setEditing({ ...editing, title: e.target.value })
              }
              required
              maxLength={100}
            />
          </label>
          <div className="panel-grid">
            <label>
              Subject
              <select
                value={editing.subject}
                onChange={(e) =>
                  setEditing({ ...editing, subject: e.target.value as Subject })
                }
              >
                {subjects.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <div className="panel-grid">
              <label>
                From grade
                <select
                  value={editing.gradeMin}
                  onChange={(e) =>
                    setEditing({ ...editing, gradeMin: Number(e.target.value) })
                  }
                >
                  {[0, 1, 2, 3, 4, 5].map((g) => (
                    <option key={g} value={g}>
                      {g === 0 ? "K" : g}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Through grade
                <select
                  value={editing.gradeMax}
                  onChange={(e) =>
                    setEditing({ ...editing, gradeMax: Number(e.target.value) })
                  }
                >
                  {[0, 1, 2, 3, 4, 5].map((g) => (
                    <option key={g} value={g}>
                      {g === 0 ? "K" : g}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <label>
            Import questions from CSV or JSON
            <input
              type="file"
              accept=".csv,.json"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f);
              }}
            />
          </label>
          <p className="muted">
            CSV headings: prompt, answer, explanation. Up to 500 questions.
            Typing banks use the answer as the text to type. No AI generation or
            usage charges.
          </p>
          <a className="text-link" href="/question-bank-template.csv" download>
            Download a CSV template ↓
          </a>
        </section>
        <section className="panel">
          <h2>Questions ({editing.questions?.length ?? 0})</h2>
          {editing.questions?.map((q, i) => (
            <div className="question-row" key={i}>
              <div className="panel-grid">
                <label>
                  Question {i + 1}
                  <input
                    value={q.prompt}
                    required
                    maxLength={500}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        questions: editing.questions!.map((x, j) =>
                          i === j ? { ...x, prompt: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </label>
                <label>
                  Answer
                  <input
                    value={q.answer}
                    required
                    maxLength={200}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        questions: editing.questions!.map((x, j) =>
                          i === j ? { ...x, answer: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </label>
              </div>
              <label>
                Explanation (optional)
                <input
                  value={q.explanation}
                  maxLength={600}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      questions: editing.questions!.map((x, j) =>
                        i === j ? { ...x, explanation: e.target.value } : x,
                      ),
                    })
                  }
                />
              </label>
              <button
                type="button"
                className="text-link"
                onClick={() =>
                  setEditing({
                    ...editing,
                    questions: editing.questions!.filter((_, j) => j !== i),
                  })
                }
              >
                Remove question
              </button>
            </div>
          ))}
          <button
            type="button"
            className="action secondary"
            style={{ marginTop: 20 }}
            onClick={() =>
              setEditing({
                ...editing,
                questions: [
                  ...(editing.questions ?? []),
                  {
                    id: crypto.randomUUID(),
                    prompt: "",
                    answer: "",
                    explanation: "",
                  },
                ],
              })
            }
          >
            ＋ Add question
          </button>
        </section>
        <div className="actions">
          <button className="action" disabled={busy}>
            Save question bank
          </button>
          <button
            type="button"
            className="action secondary"
            onClick={() => setEditing(null)}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  return (
    <>
      <div className="section-heading">
        <div>
          <h2>
            {official ? "Built-in question banks" : "Your question library"}
          </h2>
          <p className="muted">
            Choose a bank in a child’s learning plan to use it across compatible
            games.
          </p>
        </div>
        <button className="action" onClick={blank}>
          ＋ Create bank
        </button>
      </div>
      {!official && (
        <form
          className="panel"
          onSubmit={(e) => {
            e.preventDefault();
            void act(async () => {
              await api("import", { code });
              setCode("");
            });
          }}
        >
          <h3>Someone shared a bank?</h3>
          <div className="actions">
            <input
              aria-label="Sharing code"
              style={{ maxWidth: 300 }}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter sharing code"
              required
            />
            <button className="action secondary" disabled={busy}>
              Add a private copy
            </button>
          </div>
          <p className="muted">
            Shared banks contain questions only. Profiles and learning records
            are never included.
          </p>
        </form>
      )}
      <div className="panel-grid">
        {banks.map((b) => (
          <section className="panel" key={b.id}>
            <span className="badge">
              {b.family === "official" ? "Built-in" : "Your bank"}
            </span>
            <span className="badge">{b.subject}</span>
            <h3 style={{ margin: "14px 0" }}>{b.title}</h3>
            <p className="muted">
              Grades {b.gradeMin === 0 ? "K" : b.gradeMin}–{b.gradeMax} ·{" "}
              {b.questions.length} questions
            </p>
            <div className="actions">
              {(official || b.family !== "official") && (
                <button
                  className="action secondary"
                  onClick={() => setEditing(b)}
                >
                  Edit
                </button>
              )}
              {!official && (
                <button
                  className="text-link"
                  onClick={() => void act(() => api("copy", { id: b.id }))}
                >
                  Make a copy
                </button>
              )}
              <button
                className="text-link"
                onClick={() =>
                  download(
                    {
                      ...b,
                      id: undefined,
                      family: undefined,
                      share: undefined,
                    },
                    "question-bank.json",
                  )
                }
              >
                Export
              </button>
            </div>
            {b.family !== "official" && (
              <>
                <button
                  className="text-link"
                  onClick={() =>
                    void act(() =>
                      api("share", { id: b.id, enabled: !b.share }),
                    )
                  }
                >
                  {b.share ? "Turn off sharing" : "Create sharing code"}
                </button>
                {b.share && (
                  <p className="notice">
                    Sharing code: <strong>{b.share}</strong>{" "}
                    <button
                      onClick={() =>
                        void navigator.clipboard.writeText(b.share!)
                      }
                    >
                      Copy
                    </button>
                  </p>
                )}
                <button
                  className="text-link"
                  style={{ marginLeft: 20 }}
                  onClick={() => {
                    if (confirm("Delete this question bank?"))
                      void act(() => api("banks", { id: b.id }, "DELETE"));
                  }}
                >
                  Delete
                </button>
              </>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
function Progress({ data }: { data: Data }) {
  return (
    <>
      <h2>A little practice adds up.</h2>
      <p className="muted" style={{ marginBottom: 24 }}>
        Assigned-trail answers are checked by the family website. Completed game
        lessons also earn capped credits. Island play cannot mint learning
        credits.
      </p>
      {data.family.children.map((c) => {
        const w = data.wallets[c.id];
        return (
          <section className="panel" key={c.id}>
            <div className="child-row">
              <span className="avatar">{c.avatar}</span>
              <h3>{c.name}</h3>
            </div>
            <div className="panel-grid" style={{ marginTop: 24 }}>
              <div>
                <span className="metric">{w.credits}</span>
                <p>Discovery credits</p>
              </div>
              <div>
                <span className="metric">
                  {c.timedPlay
                    ? Math.max(
                        0,
                        w.credits * c.minutesPerCredit - w.minutesSpent,
                      )
                    : "∞"}
                </span>
                <p>
                  {c.timedPlay
                    ? "Island minutes available"
                    : "Island playtime is unrestricted"}
                </p>
              </div>
            </div>
            <h3 style={{ marginTop: 22 }}>Learning-exclusive treasures</h3>
            {w.treasures.length ? (
              w.treasures.map((t) => (
                <span className="badge" key={t.id}>
                  ✦ {t.name}
                </span>
              ))
            ) : (
              <p className="muted">
                First treasure at 10 credits: the Scholar’s lantern.
              </p>
            )}
          </section>
        );
      })}
    </>
  );
}
function Membership({
  data,
  act,
}: {
  data: Data;
  act: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  return (
    <>
      <section className="panel">
        <h2>One membership for the family.</h2>
        <p>{data.entitlement.label} · Up to six children</p>
        <div className="actions">
          <Link className="action" href="/unlock">
            Plans & membership
          </Link>
          <button
            className="action secondary"
            onClick={() =>
              void act(async () => {
                const r = await fetch("/api/portal", { method: "POST" });
                const j = await r.json();
                if (!r.ok) throw new Error(j.error);
                window.location.assign(j.url);
              })
            }
          >
            Manage billing
          </button>
        </div>
        <p className="muted">
          Your first 14 days include the full library. After that, the free plan
          keeps a small practice selection available. Saved profiles and banks
          stay yours.
        </p>
      </section>
      <section className="panel">
        <h2>Your family’s data</h2>
        <p><Link href="/dashboard/privacy">Withdraw permission or request complete account deletion</Link></p>
        <p>
          Download your profiles, question banks, learning records, and saved
          game data. To remove a child and their records, use Delete on their
          profile.
        </p>
        <button
          className="action secondary"
          style={{ marginTop: 16 }}
          onClick={() =>
            void act(async () =>
              download(await api("export"), "family-export.json"),
            )
          }
        >
          Download family data
        </button>
      </section>
      <form
        className="panel"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget,
            d = new FormData(form);
          void act(async () => {
            await api("pin", {
              currentPin: d.get("current"),
              pin: d.get("new"),
            });
            form.reset();
          });
        }}
      >
        <h2>Change your parent PIN</h2>
        <label>
          Current PIN
          <input name="current" type="password" required autoComplete="off" />
        </label>
        <label>
          New PIN (6–10 digits)
          <input
            name="new"
            type="password"
            pattern="[0-9]{6,10}"
            required
            autoComplete="off"
          />
        </label>
        <button className="action">Change PIN</button>
      </form>
    </>
  );
}
function Owner() {
  const [d, setD] = useState<{
      agents: { id: string; name: string; scopes: string[]; expires: number }[];
      audit: { actor: string; action: string; created: number }[];
      official: Bank[];
      setup: Record<string, unknown>;
    } | null>(null),
    [msg, setMsg] = useState(""),
    [key, setKey] = useState("");
  const load = useCallback(async () => {
    try {
      setD(await api("owner"));
    } catch (e) {
      setMsg((e as Error).message);
    }
  }, []);
  useEffect(() => {
    api("owner").then(setD).catch(e=>setMsg(e.message));
  }, []);
  async function act(fn: () => Promise<unknown>) {
    try {
      await fn();
      await load();
      setMsg("Saved.");
    } catch (e) {
      setMsg((e as Error).message);
    }
  }
  return (
    <>
      <Notice message={msg} />
      <PrivacyReview/>
      {d && (
        <>
          <section className="panel">
            <h2>Launch connections</h2>
            {Object.entries(d.setup).map(([k, v]) => (
              <p key={k}>
                <strong>{k}:</strong>{" "}
                {typeof v === "boolean"
                  ? v
                    ? "Connected"
                    : "Needs setup"
                  : String(v)}
              </p>
            ))}
            <p className="muted">
              Owner access is assigned on the server. Customer accounts cannot
              grant it to themselves.
            </p>
          </section>
          <form
            className="panel"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget,
                fd = new FormData(form);
              void act(async () => {
                const r = await api("owner/agents", {
                  name: fd.get("name"),
                  days: Number(fd.get("days")),
                  scopes: fd.getAll("scopes"),
                });
                setKey(r.key);
                form.reset();
              });
            }}
          >
            <h2>Give an agent access</h2>
            <p className="muted">
              Keys expire, can be revoked instantly, and have a recorded
              activity history. Reports contain totals, not children’s names.
              Billing, child profiles, and permission changes are unavailable to
              agents.
            </p>
            <label>
              Agent name
              <input name="name" required maxLength={60} />
            </label>
            <label>
              Expires in
              <select name="days">
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
              </select>
            </label>
            {["reports:read", "catalog:read", "catalog:write"].map((s) => (
              <label key={s} className="check-label">
                <input type="checkbox" name="scopes" value={s} />
                {
                  {
                    "reports:read": "Read aggregate learning reports",
                    "catalog:read": "Read built-in question banks",
                    "catalog:write": "Publish new built-in question banks",
                  }[s]
                }
              </label>
            ))}
            <button className="action">Create access key</button>
            {key && (
              <div
                className="notice"
                style={{ marginTop: 20, overflowWrap: "anywhere" }}
              >
                Copy this key now; it is shown only once.
                <br />
                <code>{key}</code>
                <br />
                <button
                  type="button"
                  onClick={() => void navigator.clipboard.writeText(key)}
                >
                  Copy key
                </button>
              </div>
            )}
          </form>
          <section className="panel">
            <h2>Active agent keys</h2>
            {d.agents.length ? (
              d.agents.map((a) => (
                <div className="question-row" key={a.id}>
                  <h3>{a.name}</h3>
                  <p>
                    {a.scopes.join(", ") || "No permissions"} · Expires{" "}
                    {new Date(a.expires).toLocaleDateString()}
                  </p>
                  <button
                    className="text-link"
                    onClick={() =>
                      void act(() =>
                        api("owner/agents", { id: a.id }, "DELETE"),
                      )
                    }
                  >
                    Revoke access
                  </button>
                </div>
              ))
            ) : (
              <p>No agent keys yet.</p>
            )}
          </section>
          <Banks banks={d.official} official act={act} busy={false} />
          <section className="panel">
            <h2>Recent activity</h2>
            {d.audit.map((a, i) => (
              <p className="question-row" key={i}>
                {a.action}{" "}
                <span className="muted">
                  · {new Date(a.created).toLocaleString()}
                </span>
              </p>
            ))}
          </section>
        </>
      )}
    </>
  );
}
export function Library() {
 const router=useRouter();
  const [d, setD] = useState<{
      children: (SafeChild & { wallet: Wallet })[];
      entitlement: { label: string };
      needsSetup: boolean;
    } | null>(null),
    [selected, setSelected] = useState(""),
    [message, setMessage] = useState("");
  useEffect(() => {
    api("lock", {}).then(() => api("library"))
      .then(setD)
      .catch((e) => setMessage(e.message));
  }, []);
  return (
    <div className="workspace kid-lobby">
      <div className="kid-topbar"><span className="kid-brand">✦ Questburrow</span><Link className="kid-utility" href="/dashboard">🔒 Grown-ups</Link></div>
      <div className="lobby-mascot" aria-hidden="true">🦊</div>
      <p className="eyebrow">Your next adventure is waiting</p>
      <h1>Who’s playing today?</h1>
      {d && <Notice message={message} />}
      {!d ? (
        message ? <div className="panel"><h2>Ask a grown-up to open your camp.</h2><p>Your family account keeps everyone’s adventures together.</p><Link className="action" href="/sign-in">Grown-up sign-in</Link></div> : <p role="status">Opening camp…</p>
      ) : (
        <>
          <p className="lobby-hint">Tap your explorer to begin.</p>
          {!d.children.length ? (
            <div className="panel">
              <h2>Let’s meet your learners.</h2>
              <p>A grown-up can complete parent permission and set up your explorer.</p>
              <Link className="action" href="/dashboard">
                Set up your family
              </Link>
            </div>
          ) : (
            <div className="explorer-grid">
              {d.children.map((c) => (
                <section className="panel explorer-card" key={c.id}>
                  <div className="child-row">
                    <span className="avatar">{c.avatar}</span>
                    <div>
                      <h2 style={{ margin: 0 }}>{c.name}</h2>
                      <span className="muted">
                        ✦ {c.wallet.credits} discovery credits
                      </span>
                    </div>
                  </div>
                  {selected === c.id ? (
                    <form
                      style={{ marginTop: 24 }}
                      onSubmit={async (e) => {
                        e.preventDefault();
                        try {
                          await api("select", {
                            childId: c.id,
                            pin: new FormData(e.currentTarget).get("pin"),
                          });
                          router.push("/play");
                        } catch (e) {
                          setMessage((e as Error).message);
                        }
                      }}
                    >
                      <label>
                        Your four-digit PIN
                        <input
                          name="pin"
                          type="password"
                          inputMode="numeric"
                          pattern="[0-9]{4}"
                          maxLength={4}
                          required
                          autoFocus
                          autoComplete="off"
                        />
                      </label>
                      <button className="action">Let’s play ▶</button>
                    </form>
                  ) : (
                    <button
                      className="action"
                      style={{ marginTop: 24 }}
                      onClick={() => { setMessage(""); setSelected(c.id); }}
                    >
                      That’s me →
                    </button>
                  )}
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
