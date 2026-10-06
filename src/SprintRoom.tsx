import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  Compass,
  Plus,
  Users,
} from "lucide-react";
import type { Snapshot } from "./types";
import {
  capabilityGuidance,
  newSession,
  sprintModules,
  type SprintSession,
} from "./sprint-model";
import { protectNavigation, confirmDiscard } from "./navigation";
import * as api from "./api";

const modules = [
  {
    title: "Awareness",
    question: "What could AI change in our work?",
    activity:
      "Explore capabilities and limits together. Bring one real task and one failure concern.",
    output: "A shared vocabulary and testable opportunity questions.",
  },
  {
    title: "Opportunity mapping",
    question: "Where is a better outcome worth pursuing?",
    activity:
      "Map pain points to process steps or customer needs. Explore several capabilities before choosing a solution.",
    output: "An opportunity landscape with evidence, unknowns and a shortlist.",
  },
  {
    title: "Process automation",
    question: "How should people and AI share the work?",
    activity:
      "Walk through the current process. Define AI tasks, human judgments, exceptions and handovers.",
    output: "A workflow concept with input, output and a pilot boundary.",
  },
  {
    title: "Products & services",
    question: "What would improve the user’s experience?",
    activity:
      "Choose a user and a moment in their journey. Sketch a service, compare a non-AI alternative and test a prototype.",
    output: "A service hypothesis, prototype plan and success measure.",
  },
];
function SessionEditor({
  record,
  snapshot,
  onSnapshot,
  onClose,
}: {
  record: SprintSession;
  snapshot: Snapshot;
  onSnapshot: (s: Snapshot) => void;
  onClose: (saved?: boolean) => void;
}) {
  const [draft, setDraft] = useState(record);
  const [base, setBase] = useState(record);
  const [revision, setRevision] = useState(snapshot.revision);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = useRef({ body: "", id: "" });
  const exists = !!snapshot.data.sprintSessions?.some(
    (s) => s.id === record.id,
  );
  const creating = useRef(!exists);
  const dirty = JSON.stringify(draft) !== JSON.stringify(base);
  useEffect(() => {
    const guard = (e: Event) => protectNavigation(e, dirty);
    const unload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("studio-navigate", guard);
    window.addEventListener("beforeunload", unload);
    return () => {
      window.removeEventListener("studio-navigate", guard);
      window.removeEventListener("beforeunload", unload);
    };
  }, [dirty]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const body = JSON.stringify(draft);
    if (request.current.body !== body)
      request.current = { body, id: crypto.randomUUID() };
    try {
      const result = await api.saveSession(
        draft,
        revision,
        creating.current,
        request.current.id,
      );
      onSnapshot(result);
      setBase(draft);
      setRevision(result.revision);
      onClose(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="sprint-session-editor" onSubmit={save}>
      <div className="section-heading">
        <h3>{exists ? "Edit session" : "Set up a sprint session"}</h3>
        <button
          type="button"
          onClick={async () => {
            if (!dirty || (await confirmDiscard())) onClose();
          }}
        >
          Close session editor
        </button>
      </div>
      <p>
        Scope the workshop before choosing a solution. Title and problem are
        enough to save a first draft.
      </p>
      <fieldset disabled={busy} className="sprint-fields">
        {(
          [
            "title",
            "problem",
            "scope",
            "facilitator",
            "participants",
            "date",
            "outcome",
          ] as const
        ).map((k) => (
          <label className="wb-field" key={k}>
            {
              {
                title: "Session title",
                problem: "Problem to explore",
                scope: "Scope and boundaries",
                facilitator: "Facilitator / scribe",
                participants: "Participants and decision owner",
                date: "Session date",
                outcome: "Desired workshop output",
              }[k]
            }
            {["problem", "scope", "outcome"].includes(k) ? (
              <textarea
                value={draft[k]}
                required={k === "problem"}
                onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
              />
            ) : (
              <input
                type={k === "date" ? "date" : "text"}
                value={draft[k]}
                required={k === "title"}
                onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
              />
            )}
          </label>
        ))}
        <label className="wb-field">
          Sprint module
          <select
            value={draft.module}
            onChange={(e) => setDraft({ ...draft, module: e.target.value })}
          >
            {sprintModules.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
      </fieldset>
      {error && (
        <div className="wb-alert" role="alert">
          {error}
          <button
            type="button"
            onClick={async () => {
              try {
                const latest = await api.refresh();
                onSnapshot(latest);
                const stored = latest.data.sprintSessions?.find(
                  (s) => s.id === draft.id,
                );
                if (
                  stored &&
                  JSON.stringify(stored) === JSON.stringify(draft)
                ) {
                  setBase(stored);
                  onClose(true);
                  return;
                }
                if (stored && JSON.stringify(stored) !== JSON.stringify(base)) {
                  setError(
                    "This session was changed by another editor. Your draft is retained. Copy your changes, then close and reopen the latest session to reconcile.",
                  );
                  return;
                }
                setRevision(latest.revision);
                setError(
                  "Latest revision loaded. Review your draft and retry Save session.",
                );
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Check latest version
          </button>
        </div>
      )}
      <button className="primary" disabled={busy}>
        {busy ? "Saving session…" : "Save session"}
      </button>
      <small> {draft.methodVersion} · shared team account</small>
    </form>
  );
}
export default function SprintRoom({
  snapshot,
  onSnapshot,
  onCapture,
  onFilter,
  demo,
}: {
  snapshot: Snapshot;
  onSnapshot: (s: Snapshot) => void;
  onCapture: (category: string, session?: SprintSession) => void;
  onFilter: (title: string) => void;
  demo: boolean;
}) {
  const [module, setModule] = useState("Opportunity mapping");
  const [selected, setSelected] = useState("");
  const [editor, setEditor] = useState<SprintSession | null>(null);
  const sessions = snapshot.data.sprintSessions || [];
  const session = sessions.find((s) => s.id === selected);
  const active = modules.find((m) => m.title === module)!;
  return (
    <div className="sprint-room">
      <section className="sprint-intro">
        <div>
          <span className="eyebrow">FACILITATED DESIGN SPRINT</span>
          <h3>
            Start with a question.
            <br />
            Leave with a decision.
          </h3>
          <p>
            Choose a workshop module, define the scope, then explore what AI
            could contribute. Keep the problem and evidence in view.
          </p>
        </div>
        <div className="sprint-method">
          <BookOpen />
          <strong>Working method · v2</strong>
          <p>
            Original facilitation guidance. Six provisional capability families;
            source-specific training remains subject to verification.
          </p>
        </div>
      </section>
      <div className="sprint-module-tabs" aria-label="Sprint modules">
        {modules.map((m, i) => (
          <button
            key={m.title}
            aria-pressed={module === m.title}
            className={module === m.title ? "active" : ""}
            onClick={() => setModule(m.title)}
          >
            <span>0{i + 1}</span>
            {m.title}
          </button>
        ))}
      </div>
      <section className="sprint-module-detail">
        <Compass />
        <div>
          <h3>{active.question}</h3>
          <p>{active.activity}</p>
          <small>WORKSHOP OUTPUT</small>
          <strong>{active.output}</strong>
        </div>
      </section>
      <section className="wb-panel sprint-session-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">WORKSHOP CONTEXT</span>
            <h3>A scope your team can work with</h3>
          </div>
          <button
            disabled={demo || !!editor}
            onClick={() => setEditor({ ...newSession(), module })}
          >
            <Plus size={16} />
            New session
          </button>
        </div>
        <label className="wb-field">
          Active sprint session
          <select
            disabled={demo || !!editor}
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              const s = sessions.find((s) => s.id === e.target.value);
              if (s) setModule(s.module);
            }}
          >
            <option value="">Choose a session</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
        {session && (
          <div className="sprint-scope">
            <strong>{session.problem}</strong>
            <p>{session.scope || "Scope not yet recorded"}</p>
            <small>
              <Users size={14} />{" "}
              {session.facilitator || "Facilitator unassigned"} ·{" "}
              {session.date || "Date not set"}
            </small>
            <div>
              <button disabled={!!editor} onClick={() => setEditor(session)}>
                Edit session
              </button>
              <button onClick={() => onFilter(session.title)}>
                View session opportunities <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
        {!sessions.length && !editor && (
          <p>
            No shared sessions yet. Create a session to retain its scope,
            participants and intended output.
          </p>
        )}
        {editor && (
          <SessionEditor
            key={editor.id}
            record={editor}
            snapshot={snapshot}
            onSnapshot={onSnapshot}
            onClose={(saved) => {
              if (saved || sessions.some((s) => s.id === editor.id))
                setSelected(editor.id);
              setEditor(null);
            }}
          />
        )}
      </section>
      <div className="section-heading">
        <div>
          <span className="eyebrow">CAPABILITY EXPLORER</span>
          <h3>Explore possibilities before committing</h3>
        </div>
        <span className="wb-help">
          Prompts to support judgment, not automated recommendations
        </span>
      </div>
      <div className="sprint-capabilities">
        {capabilityGuidance.map((card, i) => (
          <article className="sprint-capability" key={card.category}>
            <div className="sprint-card-number">
              0{i + 1}
              <BookOpen size={19} />
            </div>
            <span className="eyebrow">{card.category}</span>
            <h3>{card.verb}</h3>
            <p>{card.description}</p>
            <ul>
              {card.questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
            <div className="sprint-example">
              <small>ILLUSTRATIVE APPLICATION</small>
              <p>{card.example}</p>
            </div>
            <button
              disabled={demo || !!editor}
              onClick={() => onCapture(card.category, session)}
            >
              Capture an opportunity <Plus size={14} />
            </button>
          </article>
        ))}
      </div>
      <p className="wb-help">
        <Check size={14} /> A capability selection starts a draft. It does not
        imply feasibility, approval or measured value.
      </p>
    </div>
  );
}
