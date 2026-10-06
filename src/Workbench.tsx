import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowLeft,
  Plus,
  Search,
  Grid2X2,
  List,
  SlidersHorizontal,
  FlaskConical,
  Check,
  Download,
  Users,
  Link2,
  ChevronRight,
  Lightbulb,
  Target,
  Layers,
} from "lucide-react";
import type { Snapshot, Workspace } from "./types";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import * as api from "./api";
import {
  confirmDiscard,
  protectNavigation,
  requestNavigation,
} from "./navigation";
import {
  categories,
  stages,
  evidenceStates,
  newWorkItem,
  valueModel,
  cellSummary,
  mergeFields,
  sampleItems,
  readiness,
  type WorkItem,
  type Economics,
} from "./workbench-model";
import "./workbench.css";
import SprintRoom from "./SprintRoom";
import WorkDesignCanvas from "./WorkDesignCanvas";
import DeliveryReadiness from "./DeliveryReadiness";
import ChallengerPanel from "./ChallengerPanel";
import "./sprint.css";
const tabs = [
  "Discover",
  "Design",
  "Estimate value",
  "Prioritize pilot",
  "Track outcomes",
];
const money = (n: number | null) =>
  n === null
    ? "Not estimated"
    : new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(n);
const number = (n: number | null) =>
  n === null
    ? "Unknown"
    : new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }).format(n);
const today = () => new Date().toISOString().slice(0, 10);
const route = () => location.hash.split("/").slice(2);
export async function navigateStudio(hash: string) {
  if (await requestNavigation()) location.hash = hash;
}
function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  disabled = false,
}: {
  label: string;
  value: string | number | null;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="wb-field">
      {label}
      {required && <span className="wb-required">Required</span>}
      {type === "textarea" ? (
        <textarea
          disabled={disabled}
          required={required}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder={placeholder}
        />
      ) : (
        <input
          disabled={disabled}
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
        />
      )}
    </label>
  );
}
function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="wb-field">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
const opts = (a: string[]) => a.map((value) => ({ value, label: value }));
const linked = (
  a: { id: string; title?: string; name?: string; label?: string }[],
) => [
  { value: "", label: "Not linked" },
  ...a.map((x) => ({
    value: x.id,
    label: x.title || x.name || x.label || x.id,
  })),
];
function exportBrief(w: WorkItem, data: Workspace) {
  const esc = (s: unknown) =>
    String(s ?? "Unknown").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c]!,
    );
  const v = valueModel(w.economics);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(w.title)}</title><style>body{font:16px/1.6 Arial;max-width:950px;margin:40px auto;padding:20px;color:#202020}h1{border-top:5px solid #ff6428;padding-top:20px}h2{margin-top:32px}pre{white-space:pre-wrap;background:#f3ece6;padding:20px}td,th{padding:10px;text-align:left;border-bottom:1px solid #cec2b9}small{color:#584f4a}</style></head><body><small>ERANEOS · AI VISION STUDIO · ${today()}</small><h1>${esc(w.title)}</h1>${w.id.startsWith("example-") ? "<p><strong>ILLUSTRATIVE EXAMPLE — not client data or measured results.</strong></p>" : ""}<p>${esc(w.kind)} · ${esc(w.stage)} · Declared owner: ${esc(w.owner || "Unassigned")}</p><h2>Problem and evidence</h2><p>${esc(w.problem)}</p><p>${esc(w.evidence)}: ${esc(w.evidenceNote || "No evidence recorded")}</p><h2>Design</h2><p>${esc(w.design)}</p><p>Alternative: ${esc(w.alternative)}</p><h2>Human–AI working approach</h2><pre>${esc(JSON.stringify(w.workDesign || {}, null, 2))}</pre><p>Objective: ${esc(data.objectives.find((x) => x.id === w.objectiveId)?.title || "Not linked")}<br>Target shift: ${esc(data.nodes.find((x) => x.id === w.nodeId)?.label || "Not linked")}</p><h2>Annual base scenario · EUR · assumptions, not actuals</h2><p>Released hours: ${number(v.hours)} · Capacity value: ${money(v.capacity)} · Cashable benefit: ${money(v.cash)} · Net cash: ${money(v.net)}</p><p>Overlap group: ${esc(w.overlap || "Not specified")} · No portfolio sum calculated.</p><p>${esc(w.assumptionsNote || "Assumption sources not recorded")}</p><pre>${esc(JSON.stringify(w.economics, null, 2))}</pre><h2>Experiment</h2><pre>${esc(JSON.stringify(w.experiment, null, 2))}</pre><h2>Observations</h2><pre>${esc(JSON.stringify(w.observations, null, 2))}</pre><h2>Decision history</h2><p>Entered through a shared team account; declared owners are not verified identities.</p><pre>${esc(JSON.stringify(w.decisions, null, 2))}</pre><h2>Enablement</h2><pre>${esc(
    JSON.stringify(
      w.enablement.map((a) => ({
        ...a,
        role: data.roles.find((r) => r.id === a.roleId)?.name,
        skill: data.skills.find((s) => s.id === a.skillId)?.name,
      })),
      null,
      2,
    ),
  )}</pre><h2>Next action</h2><p>${esc(w.nextAction || "Not assigned")} · ${esc(w.due || "No date")}</p><small>Record ${esc(w.id)} · Method ${esc(w.methodVersion)} · Source ideas: ${esc(w.sourceIds.join(", ") || "None")}</small></body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `use-case-${w.id}.html`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function Workbench({
  snapshot,
  onSnapshot,
}: {
  snapshot: Snapshot;
  onSnapshot: (s: Snapshot) => void;
}) {
  const data = snapshot.data;
  const [path, setPath] = useState(route());
  const [view, setView] = useState(
    (snapshot.data.workItems || []).length ? "Landscape" : "Sprint room",
  );
  const [search, setSearch] = useState("");
  const [process, setProcess] = useState("All processes");
  const [session, setSession] = useState("All sessions");
  const [kind, setKind] = useState("All items");
  const [demo, setDemo] = useState(false);
  const examples = useMemo(sampleItems, []);
  const all = demo ? examples : data.workItems || [];
  const sessionName = (w: WorkItem) =>
    data.sprintSessions?.find((s) => s.id === w.sessionId)?.title ||
    w.session ||
    "Unassigned session";
  const [capture, setCapture] = useState<WorkItem | null>(null);
  useEffect(() => {
    if (capture)
      document.querySelector<HTMLInputElement>(".wb-capture input")?.focus();
  }, [capture?.id]);
  const [draft, setDraft] = useState<WorkItem | null>(null);
  const [base, setBase] = useState<WorkItem | null>(null);
  const [baseRevision, setBaseRevision] = useState(snapshot.revision);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState<{
    latest: WorkItem;
    merged: WorkItem;
    keys: string[];
    revision: number;
  } | null>(null);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [reauth, setReauth] = useState("");
  const [selection, setSelection] = useState<string[]>([]);
  const [heatMode, setHeatMode] = useState("Coverage");
  const [cell, setCell] = useState<{
    process: string;
    category: string;
  } | null>(null);
  const request = useRef({ body: "", id: "" });
  const lastHash = useRef(location.hash);
  const [observation, setObservation] = useState({
    date: today(),
    value: "",
    sample: "",
    evidence: "",
  });
  const [decision, setDecision] = useState({
    date: today(),
    action: "Investigate",
    owner: "",
    rationale: "",
  });
  const [action, setAction] = useState({
    roleId: "",
    skillId: "",
    target: 2,
    owner: "",
    action: "",
    due: "",
    criterion: "",
    status: "Planned",
  });
  const entryPending = !!(
    observation.value ||
    observation.sample ||
    observation.evidence ||
    decision.owner ||
    decision.rationale ||
    action.roleId ||
    action.skillId ||
    action.owner ||
    action.action ||
    action.due ||
    action.criterion
  );
  const dirty =
    (!!capture &&
      (!!capture.title ||
        !!capture.problem ||
        !!capture.process ||
        !!capture.session ||
        !!capture.categories.length)) ||
    (!!draft && JSON.stringify(draft) !== JSON.stringify(base));
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty || entryPending;
  useEffect(() => {
    const guard = (e: Event) => {
      protectNavigation(e, dirtyRef.current, () => {
        dirtyRef.current = false;
      });
    };
    const unload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
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
  }, []);
  useEffect(() => {
    let checking = false;
    const change = async () => {
      if (checking || !location.hash.startsWith("#/workbench")) return;
      const requested = location.hash;
      if (
        dirtyRef.current &&
        route()[0] !== id &&
        location.hash !== lastHash.current
      ) {
        checking = true;
        history.replaceState(null, "", lastHash.current);
        const allowed = await confirmDiscard();
        checking = false;
        if (!allowed) return;
        dirtyRef.current = false;
        history.replaceState(null, "", requested);
      }
      lastHash.current = location.hash;
      setPath(route());
      setCapture(null);
    };
    window.addEventListener("hashchange", change);
    window.addEventListener("popstate", change);
    return () => {
      window.removeEventListener("hashchange", change);
      window.removeEventListener("popstate", change);
    };
  }, [path[0]]);
  const id = path[0];
  const section = tabs.includes(decodeURIComponent(path[1] || ""))
    ? decodeURIComponent(path[1])
    : "Discover";
  useEffect(() => {
    const found = all.find((w) => w.id === id);
    setDraft(found ? structuredClone(found) : null);
    setBase(found ? structuredClone(found) : null);
    setBaseRevision(snapshot.revision);
    setConflict(null);
    setError("");
    setMessage("");
    setObservation({ date: today(), value: "", sample: "", evidence: "" });
    setDecision({
      date: today(),
      action: "Investigate",
      owner: "",
      rationale: "",
    });
    setAction({
      roleId: "",
      skillId: "",
      target: 2,
      owner: "",
      action: "",
      due: "",
      criterion: "",
      status: "Planned",
    });
  }, [id, demo]);
  async function open(w: WorkItem, targetSection = "Discover") {
    if (dirtyRef.current && !(await confirmDiscard())) return;
    dirtyRef.current = false;
    setCapture(null);
    lastHash.current = `#/workbench/${w.id}/${encodeURIComponent(targetSection)}`;
    location.hash = lastHash.current;
  }
  function goSection(s: string) {
    lastHash.current = `#/workbench/${id}/${encodeURIComponent(s)}`;
    history.pushState(null, "", lastHash.current);
    setPath(route());
  }
  async function back() {
    if (dirtyRef.current && !(await confirmDiscard())) return;
    dirtyRef.current = false;
    setDraft(null);
    setCapture(null);
    lastHash.current = "#/workbench";
    location.hash = lastHash.current;
  }
  async function save(w: WorkItem, create = false) {
    setError("");
    setSaving(true);
    const body = JSON.stringify(w);
    if (request.current.body !== body)
      request.current = { body, id: crypto.randomUUID() };
    try {
      const result = await api.saveWorkItem(
        w,
        create ? snapshot.revision : baseRevision,
        create,
        request.current.id,
      );
      onSnapshot(result);
      const stored = result.data.workItems!.find((x) => x.id === w.id)!;
      setBase(structuredClone(stored));
      setDraft(structuredClone(stored));
      setBaseRevision(result.revision);
      setCapture(null);
      setMessage("Saved to shared workspace");
      setConflict(null);
      dirtyRef.current = false;
      request.current = { body: "", id: "" };
      if (create) {
        lastHash.current = `#/workbench/${w.id}/Discover`;
        location.hash = lastHash.current;
        setPath(route());
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  async function recover() {
    try {
      const latest = await api.refresh();
      onSnapshot(latest);
      if (!draft) return;
      const found = latest.data.workItems?.find((x) => x.id === draft.id);
      if (!found) {
        setError(
          "This record no longer exists. Copy your draft before leaving.",
        );
        return;
      }
      const m = mergeFields(base!, draft, found);
      setConflict({
        latest: found,
        merged: m.merged,
        keys: m.conflicts,
        revision: latest.revision,
      });
      setChoices({});
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function put<K extends keyof WorkItem>(key: K, value: WorkItem[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
    setMessage("");
  }
  const filtered = all.filter(
    (w) =>
      (process === "All processes" ||
        (w.process || "Unassigned process") === process) &&
      (session === "All sessions" || sessionName(w) === session) &&
      (kind === "All items" || w.kind === kind) &&
      `${w.title} ${w.problem} ${w.owner}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const processes = [
    ...new Set(all.map((w) => w.process || "Unassigned process")),
  ];
  const sessions = [
    ...new Set([
      ...all.map(sessionName),
      ...(data.sprintSessions || []).map((s) => s.title),
    ]),
  ];
  const stats = cellSummary(all);
  const selected = all.filter((w) => selection.includes(w.id));
  const contributing = cell
    ? filtered.filter(
        (w) =>
          (w.process || "Unassigned process") === cell.process &&
          w.categories.includes(cell.category),
      )
    : [];
  const patchExperiment = (k: string, v: string | number | null) =>
    put("experiment", { ...draft!.experiment, [k]: v });
  function choose(w: WorkItem) {
    setSelection((s) =>
      s.includes(w.id)
        ? s.filter((x) => x !== w.id)
        : s.length < 3
          ? [...s, w.id]
          : s,
    );
  }
  const reportError = (
    <>
      {error && (
        <div className="wb-alert" role="alert">
          <strong>{error}</strong>
          <div>
            <button onClick={recover} disabled={saving}>
              Load latest & reconcile
            </button>
            <label>
              Reauthenticate{" "}
              <input
                type="password"
                autoComplete="current-password"
                value={reauth}
                onChange={(e) => setReauth(e.target.value)}
              />
            </label>
            <button
              disabled={!reauth || saving}
              onClick={async () => {
                try {
                  const s = await api.login(reauth);
                  onSnapshot(s);
                  setReauth("");
                  setError(
                    "Signed in. Load latest and reconcile before retrying your draft.",
                  );
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Sign in
            </button>
          </div>
        </div>
      )}
      {conflict && (
        <div className="wb-conflict">
          <h3>Review concurrent changes</h3>
          <p>
            Your draft is preserved. Non-conflicting changes are merged
            automatically.
          </p>
          {conflict.keys.map((k) => (
            <label key={k}>
              <strong>{k}</strong>
              <div className="wb-diff">
                <pre>
                  Latest:{" "}
                  {JSON.stringify(
                    conflict.latest[k as keyof WorkItem],
                    null,
                    2,
                  )}
                </pre>
                <pre>
                  Mine: {JSON.stringify(draft![k as keyof WorkItem], null, 2)}
                </pre>
              </div>
              <select
                value={choices[k] || ""}
                onChange={(e) =>
                  setChoices({ ...choices, [k]: e.target.value })
                }
              >
                <option value="">Choose a version</option>
                <option value="latest">Keep latest</option>
                <option value="mine">Use my draft</option>
              </select>
            </label>
          ))}
          <button
            disabled={conflict.keys.some((k) => !choices[k])}
            onClick={() => {
              const resolved = { ...conflict.merged };
              for (const k of conflict.keys)
                (resolved as Record<string, unknown>)[k] =
                  choices[k] === "mine"
                    ? draft![k as keyof WorkItem]
                    : conflict.latest[k as keyof WorkItem];
              setBase(conflict.latest);
              setBaseRevision(conflict.revision);
              setDraft(resolved);
              setConflict(null);
              request.current = { body: "", id: "" };
              setMessage("Reconciled. Review and save your draft.");
            }}
          >
            Use reconciled draft
          </button>
        </div>
      )}
    </>
  );
  if (id && !draft && !capture)
    return (
      <section className="wb-empty">
        <h2>Record not found</h2>
        <p>It may have been removed or belongs to example mode.</p>
        <button onClick={back}>Return to workbench</button>
      </section>
    );
  if (draft) {
    const v = valueModel(draft.economics);
    const missing = readiness(draft);
    return (
      <div className="workbench" inert={saving} aria-busy={saving}>
        <div className="wb-record-head">
          <button className="wb-back" onClick={back}>
            <ArrowLeft size={16} />
            Workbench
          </button>
          <span className="wb-id">
            {draft.kind === "idea" ? "OPPORTUNITY" : "USE CASE"} ·{" "}
            {draft.id.slice(0, 8)}
          </span>
          <div className="grow" />
          <span role="status" className={dirty ? "wb-unsaved" : "wb-saved"}>
            {saving
              ? "Saving…"
              : dirty
                ? "Unsaved changes"
                : message || "Saved"}
          </span>
          <button onClick={() => exportBrief(draft, data)}>
            <Download size={15} />
            Decision brief
          </button>
          {!demo && (
            <button
              className="primary"
              disabled={saving || !dirty || entryPending}
              onClick={() => save(draft)}
            >
              Save changes
            </button>
          )}
        </div>
        <div className="wb-title">
          <div>
            <span className="wb-badge">{draft.stage}</span>
            <h2>{draft.title}</h2>
            <p>
              {draft.owner || "Owner unassigned"} <span>·</span>{" "}
              {draft.process || "Process not assigned"}
            </p>
          </div>
          {draft.kind === "idea" && !demo && (
            <button
              className="wb-accent"
              disabled={saving || dirty || entryPending}
              onClick={() => {
                const usecase = {
                  ...structuredClone(draft),
                  id: crypto.randomUUID(),
                  kind: "usecase" as const,
                  stage: "Framed",
                  sourceIds: [draft.id],
                };
                save(usecase, true);
              }}
            >
              Develop as use case <ArrowUpRight size={16} />
            </button>
          )}
        </div>
        {demo && (
          <div className="wb-demo">
            Illustrative example · changes stay in this preview and cannot be
            saved.
          </div>
        )}
        <nav className="wb-steps" aria-label="Use-case workflow">
          {tabs.map((s, i) => (
            <button
              key={s}
              aria-current={section === s ? "step" : undefined}
              className={section === s ? "active" : ""}
              onClick={() => goSection(s)}
            >
              <span>{i + 1}</span>
              {s}
            </button>
          ))}
        </nav>
        {reportError}
        {entryPending && (
          <div className="wb-demo" role="status">
            An observation, decision or enablement entry is unfinished. Use its
            “Add … to draft” button before saving the record.
          </div>
        )}
        <div className="wb-detail-grid">
          <section className="wb-panel">
            {section === "Discover" && (
              <>
                <div className="wb-section-title">
                  <Lightbulb />
                  <div>
                    <h3>Start with the problem</h3>
                    <p>Capture what matters before choosing a solution.</p>
                  </div>
                </div>
                <Field
                  label="Title"
                  value={draft.title}
                  onChange={(v) => put("title", v)}
                  required
                />
                <Field
                  label="Problem / user need"
                  type="textarea"
                  value={draft.problem}
                  onChange={(v) => put("problem", v)}
                  required
                />
                <div className="wb-form-grid">
                  <Field
                    label="Process / value-stream step"
                    value={draft.process}
                    onChange={(v) => put("process", v)}
                  />
                  <Field
                    label="Discovery session"
                    value={draft.session}
                    onChange={(v) => {
                      put("session", v);
                      put("sessionId", "");
                    }}
                  />
                  <Select
                    label="Link a saved sprint session"
                    value={draft.sessionId || ""}
                    options={linked(data.sprintSessions || [])}
                    onChange={(v) => {
                      put("sessionId", v);
                      if (v)
                        put(
                          "session",
                          data.sprintSessions!.find((s) => s.id === v)!.title,
                        );
                    }}
                  />
                  <Field
                    label="Declared owner"
                    value={draft.owner}
                    onChange={(v) => put("owner", v)}
                  />
                  <Select
                    label="Objective"
                    value={draft.objectiveId}
                    onChange={(v) => put("objectiveId", v)}
                    options={linked(data.objectives)}
                  />
                </div>
                <h4>
                  AI capability cards <small>Provisional library · v1</small>
                </h4>
                <div className="wb-category-picker">
                  {categories.map((c) => (
                    <button
                      key={c}
                      aria-pressed={draft.categories.includes(c)}
                      onClick={() =>
                        put(
                          "categories",
                          draft.categories.includes(c)
                            ? draft.categories.filter((x) => x !== c)
                            : [...draft.categories, c],
                        )
                      }
                    >
                      {draft.categories.includes(c) ? (
                        <Check size={14} />
                      ) : (
                        <Plus size={14} />
                      )}{" "}
                      {c}
                    </button>
                  ))}
                </div>
                <div className="wb-form-grid">
                  <Select
                    label="Problem evidence"
                    value={draft.evidence}
                    options={opts(evidenceStates)}
                    onChange={(v) => put("evidence", v)}
                  />
                  <Select
                    label="Assessed impact (1 low–5 high)"
                    value={draft.impact === null ? "" : String(draft.impact)}
                    options={[
                      { value: "", label: "Unknown" },
                      ...opts(["1", "2", "3", "4", "5"]),
                    ]}
                    onChange={(v) => put("impact", v === "" ? null : Number(v))}
                  />
                </div>
                <Field
                  label="Evidence reference / assessment rationale"
                  type="textarea"
                  value={draft.evidenceNote}
                  onChange={(v) => put("evidenceNote", v)}
                  placeholder="Source, date and what supports your judgment. Required before scoring impact."
                />
              </>
            )}
            {section === "Design" && (
              <>
                <WorkDesignCanvas
                  value={draft.workDesign}
                  onChange={(v) => put("workDesign", v)}
                />
                <div className="wb-section-title">
                  <Layers />
                  <div>
                    <h3>Design the work</h3>
                    <p>Make human accountability and AI boundaries explicit.</p>
                  </div>
                </div>
                <Field
                  label="Concept summary / additional context"
                  type="textarea"
                  value={draft.design}
                  onChange={(v) => put("design", v)}
                  placeholder="Requester → AI support → expert review → developer handover. Describe inputs, outputs, permitted tools and fallback."
                />
                <Field
                  label="Simpler / non-AI alternative"
                  type="textarea"
                  value={draft.alternative}
                  onChange={(v) => put("alternative", v)}
                />
                <Select
                  label="Target-picture shift"
                  value={draft.nodeId}
                  options={linked(data.nodes)}
                  onChange={(v) => put("nodeId", v)}
                />
                <h3>Team enablement</h3>
                <p className="wb-help">
                  Assign skills to responsible roles. A course completion is not
                  evidence of proficiency.
                </p>
                {draft.enablement.map((a) => (
                  <div className="wb-action" key={a.id}>
                    <strong>{a.action}</strong>
                    <p>
                      {data.roles.find((r) => r.id === a.roleId)?.name} ·{" "}
                      {data.skills.find((s) => s.id === a.skillId)?.name} ·
                      target {a.target}
                    </p>
                    <small>
                      {a.owner} · {a.due} · {a.criterion}
                    </small>
                    <select
                      aria-label={`Status of ${a.action}`}
                      value={a.status}
                      onChange={(e) =>
                        put(
                          "enablement",
                          draft.enablement.map((x) =>
                            x.id === a.id
                              ? { ...x, status: e.target.value }
                              : x,
                          ),
                        )
                      }
                    >
                      {opts([
                        "Planned",
                        "Practicing",
                        "Evidence ready",
                        "Completed",
                      ]).map((o) => (
                        <option key={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() =>
                        put(
                          "enablement",
                          draft.enablement.filter((x) => x.id !== a.id),
                        )
                      }
                    >
                      Remove action
                    </button>
                  </div>
                ))}
                <details>
                  <summary>Add enablement action</summary>
                  <div className="wb-form-grid">
                    <Select
                      label="Responsible role"
                      value={action.roleId}
                      options={linked(data.roles)}
                      onChange={(v) => setAction({ ...action, roleId: v })}
                    />
                    <Select
                      label="Required skill"
                      value={action.skillId}
                      options={linked(data.skills)}
                      onChange={(v) => setAction({ ...action, skillId: v })}
                    />
                    <Select
                      label="Required proficiency"
                      value={String(action.target)}
                      options={opts(["1", "2", "3", "4"])}
                      onChange={(v) =>
                        setAction({ ...action, target: Number(v) })
                      }
                    />
                    <Field
                      label="Action owner"
                      value={action.owner}
                      onChange={(v) => setAction({ ...action, owner: v })}
                    />
                    <Field
                      label="Practice action"
                      value={action.action}
                      onChange={(v) => setAction({ ...action, action: v })}
                    />
                    <Field
                      label="Due date"
                      type="date"
                      value={action.due}
                      onChange={(v) => setAction({ ...action, due: v })}
                    />
                  </div>
                  <Field
                    label="Evidence / completion criterion"
                    value={action.criterion}
                    onChange={(v) => setAction({ ...action, criterion: v })}
                  />
                  <button
                    disabled={
                      !action.roleId ||
                      !action.skillId ||
                      !action.owner ||
                      !action.action ||
                      !action.due ||
                      !action.criterion
                    }
                    onClick={() => {
                      put("enablement", [
                        ...draft.enablement,
                        { ...action, id: crypto.randomUUID() },
                      ]);
                      setAction({
                        roleId: "",
                        skillId: "",
                        target: 2,
                        owner: "",
                        action: "",
                        due: "",
                        criterion: "",
                        status: "Planned",
                      });
                    }}
                  >
                    Add to draft
                  </button>
                </details>
              </>
            )}
            {section === "Estimate value" && (
              <>
                <div className="wb-section-title">
                  <Target />
                  <div>
                    <h3>Make the assumptions visible</h3>
                    <p>
                      Annual base scenario · EUR · estimates, not measured
                      benefits.
                    </p>
                  </div>
                </div>
                <Select
                  label="Primary value intent"
                  value={draft.valueIntent}
                  options={opts([
                    "Capacity",
                    "Cash",
                    "Quality / service",
                    "Risk",
                    "New revenue",
                    "Enabling capability",
                  ])}
                  onChange={(v) => put("valueIntent", v)}
                />
                <div className="wb-value-grid">
                  <div>
                    <small>Released capacity</small>
                    <strong>
                      {number(v.hours)} <em>h / year</em>
                    </strong>
                  </div>
                  <div>
                    <small>Cashable labor benefit</small>
                    <strong>{money(v.cash)}</strong>
                  </div>
                  <div>
                    <small>Net recurring cash</small>
                    <strong>{money(v.net)}</strong>
                  </div>
                </div>
                {!["Capacity", "Cash"].includes(draft.valueIntent) && (
                  <p className="wb-help">
                    Use the experiment measure to track{" "}
                    {draft.valueIntent.toLowerCase()}. Financial assumptions
                    below are optional; do not invent a cash value.
                  </p>
                )}
                <div className="wb-form-grid">
                  {(
                    [
                      ["volume", "Eligible cases / year"],
                      ["adoption", "Expected adoption (%)"],
                      ["baseline", "Baseline handling (min / case)"],
                      ["assisted", "Assisted handling (min / case)"],
                      [
                        "review",
                        "Incremental review / exceptions (min / case)",
                      ],
                      ["rate", "Loaded rate (EUR / hour)"],
                      ["realization", "Evidenced cash realization (%)"],
                      ["recurring", "Recurring cost (EUR / year)"],
                      ["setup", "Implementation cost (EUR)"],
                    ] as [keyof Economics, string][]
                  ).map(([k, l]) => (
                    <Field
                      key={k}
                      type="number"
                      label={l}
                      value={draft.economics[k]}
                      onChange={(x) =>
                        put("economics", {
                          ...draft.economics,
                          [k]: x === "" ? null : Number(x),
                        })
                      }
                      placeholder="Unknown"
                    />
                  ))}
                </div>
                <div className="wb-calculation">
                  <p>
                    Capacity valuation <strong>{money(v.capacity)}</strong> ·
                    shown separately, never added to cash benefits.
                  </p>
                  <p>
                    First-year net cash <strong>{money(v.firstYear)}</strong> ·
                    steady-state payback{" "}
                    <strong>
                      {v.payback === null
                        ? "Not established"
                        : number(v.payback) + " years"}
                    </strong>
                    .
                  </p>
                  <small>
                    Released hours = cases × adoption × (baseline − assisted −
                    review) / 60. Full-year assumptions; no adoption ramp.
                    Negative results remain visible.
                  </small>
                </div>
                <Field
                  label="Shared benefit / overlap group"
                  value={draft.overlap}
                  onChange={(v) => put("overlap", v)}
                  placeholder="Cases in the same group must not have their benefits added"
                />
                <Field
                  label="Assumption sources, dates and uncertainty"
                  type="textarea"
                  value={draft.assumptionsNote}
                  onChange={(v) => put("assumptionsNote", v)}
                />
              </>
            )}
            {section === "Prioritize pilot" && (
              <>
                <div className="wb-section-title">
                  <FlaskConical />
                  <div>
                    <h3>Commit to a bounded experiment</h3>
                    <p>
                      A baseline collection experiment can start before the
                      baseline exists.
                    </p>
                  </div>
                </div>
                <Field
                  label="Hypothesis"
                  type="textarea"
                  value={draft.experiment.hypothesis}
                  onChange={(v) => patchExperiment("hypothesis", v)}
                />
                <div className="wb-form-grid">
                  {["measure", "unit", "owner", "due"].map((k) => (
                    <Field
                      key={k}
                      label={
                        {
                          measure: "Success measure",
                          unit: "Unit",
                          owner: "Experiment owner",
                          due: "Review date",
                        }[k]!
                      }
                      type={k === "due" ? "date" : "text"}
                      disabled={
                        !!base?.observations.length &&
                        ["measure", "unit"].includes(k)
                      }
                      value={draft.experiment[k as "measure"]}
                      onChange={(v) => patchExperiment(k, v)}
                    />
                  ))}
                  <Field
                    label="Baseline (if known)"
                    disabled={!!base?.observations.length}
                    type="number"
                    value={draft.experiment.baseline}
                    onChange={(v) =>
                      patchExperiment("baseline", v === "" ? null : Number(v))
                    }
                  />
                  <Field
                    label="Success threshold"
                    disabled={!!base?.observations.length}
                    type="number"
                    value={draft.experiment.target}
                    onChange={(v) =>
                      patchExperiment("target", v === "" ? null : Number(v))
                    }
                  />
                </div>
                <Field
                  label="Sample, method and baseline collection plan"
                  type="textarea"
                  value={draft.experiment.sample}
                  onChange={(v) => patchExperiment("sample", v)}
                />
                <Field
                  label="Stop rule, limits and review of quality"
                  type="textarea"
                  value={draft.experiment.stopRule}
                  onChange={(v) => patchExperiment("stopRule", v)}
                />
                <Select
                  label="Lifecycle stage"
                  value={draft.stage}
                  options={opts(stages)}
                  onChange={(v) => put("stage", v)}
                />
                <h3>Record a decision</h3>
                <p className="wb-help">
                  Entered through a shared team account. The declared owner is
                  not a verified identity.
                </p>
                <div className="wb-form-grid">
                  <Select
                    label="Decision"
                    value={decision.action}
                    options={opts([
                      "Investigate",
                      "Test",
                      "Defer",
                      "Stop",
                      "Scale",
                    ])}
                    onChange={(v) => setDecision({ ...decision, action: v })}
                  />
                  <Field
                    label="Declared decision owner"
                    value={decision.owner}
                    onChange={(v) => setDecision({ ...decision, owner: v })}
                  />
                </div>
                <Field
                  label="Rationale and constraints"
                  type="textarea"
                  value={decision.rationale}
                  onChange={(v) => setDecision({ ...decision, rationale: v })}
                />
                <button
                  disabled={
                    !decision.owner.trim() || !decision.rationale.trim()
                  }
                  onClick={() => {
                    put("decisions", [
                      ...draft.decisions,
                      {
                        ...decision,
                        id: crypto.randomUUID(),
                        rationale:
                          decision.rationale +
                          "\nBase scenario at decision: " +
                          JSON.stringify(draft.economics),
                      },
                    ]);
                    setDecision({
                      date: today(),
                      action: "Investigate",
                      owner: "",
                      rationale: "",
                    });
                  }}
                >
                  Add decision to draft
                </button>
                {draft.decisions.map((d) => (
                  <div className="wb-action" key={d.id}>
                    <strong>
                      {d.action} · {d.owner}
                    </strong>
                    <small>{d.date}</small>
                    <p className="wb-pre">{d.rationale}</p>
                  </div>
                ))}
              </>
            )}
            {section === "Track outcomes" && (
              <>
                <div className="wb-section-title">
                  <Check />
                  <div>
                    <h3>What did the experiment show?</h3>
                    <p>
                      Record evidence against a consistent measure and
                      population.
                    </p>
                  </div>
                </div>
                <div className="wb-measure">
                  <span>
                    {draft.experiment.measure || "No measure defined"} ·{" "}
                    {draft.experiment.unit || "unit missing"}
                  </span>
                  <strong>
                    {draft.observations.length
                      ? number(
                          draft.observations[draft.observations.length - 1]
                            .value,
                        )
                      : "No observations yet"}
                  </strong>
                  <small>
                    Baseline {number(draft.experiment.baseline)} → target{" "}
                    {number(draft.experiment.target)}
                  </small>
                </div>
                {draft.observations.length > 0 && (
                  <div
                    className="wb-results-chart"
                    role="img"
                    aria-label={`Observed ${draft.experiment.measure} over recorded samples. Exact values and evidence follow below.`}
                  >
                    <p>
                      <strong>{draft.experiment.measure}</strong> ·{" "}
                      {draft.experiment.unit} · Target:{" "}
                      {number(draft.experiment.target)} · Baseline:{" "}
                      {number(draft.experiment.baseline)}
                    </p>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart
                        data={[...draft.observations].sort((a, b) =>
                          a.date.localeCompare(b.date),
                        )}
                        margin={{ top: 20, right: 30, bottom: 10, left: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          domain={["auto", "auto"]}
                        />
                        <Tooltip />
                        {draft.experiment.target !== null && (
                          <ReferenceLine
                            y={draft.experiment.target}
                            stroke="#ff6428"
                            strokeDasharray="5 3"
                            ifOverflow="extendDomain"
                            label="Target"
                          />
                        )}
                        {draft.experiment.baseline !== null && (
                          <ReferenceLine
                            y={draft.experiment.baseline}
                            stroke="#8e837c"
                            strokeDasharray="3 3"
                            ifOverflow="extendDomain"
                            label="Baseline"
                          />
                        )}
                        <Line
                          type="linear"
                          dataKey="value"
                          name={draft.experiment.unit || "Observed"}
                          stroke="#202020"
                          strokeWidth={2}
                          dot={{ fill: "#ff6428", r: 5 }}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {draft.observations.length > 0 && (
                  <div className="wb-observations">
                    {draft.observations.map((o) => (
                      <div key={o.id}>
                        <time>{o.date}</time>
                        <strong>
                          {number(o.value)} {draft.experiment.unit}
                        </strong>
                        <p>{o.evidence}</p>
                        <small>Sample: {o.sample}</small>
                      </div>
                    ))}
                  </div>
                )}
                <h4>Add an observation</h4>
                <div className="wb-form-grid">
                  <Field
                    label="Observation date"
                    type="date"
                    value={observation.date}
                    onChange={(v) =>
                      setObservation({ ...observation, date: v })
                    }
                  />
                  <Field
                    label={`Measured value (${draft.experiment.unit || "define unit first"})`}
                    type="number"
                    value={observation.value}
                    onChange={(v) =>
                      setObservation({ ...observation, value: v })
                    }
                  />
                </div>
                <Field
                  label="Population / sample"
                  value={observation.sample}
                  onChange={(v) =>
                    setObservation({ ...observation, sample: v })
                  }
                />
                <Field
                  label="Source and findings"
                  type="textarea"
                  value={observation.evidence}
                  onChange={(v) =>
                    setObservation({ ...observation, evidence: v })
                  }
                />
                <button
                  disabled={
                    !draft.experiment.measure ||
                    !draft.experiment.unit ||
                    observation.value === "" ||
                    !observation.date ||
                    !observation.sample.trim() ||
                    !observation.evidence.trim()
                  }
                  onClick={() => {
                    put("observations", [
                      ...draft.observations,
                      {
                        ...observation,
                        id: crypto.randomUUID(),
                        value: Number(observation.value),
                      },
                    ]);
                    setObservation({
                      date: today(),
                      value: "",
                      sample: "",
                      evidence: "",
                    });
                  }}
                >
                  Add observation to draft
                </button>
                <Field
                  label="Next action"
                  value={draft.nextAction}
                  onChange={(v) => put("nextAction", v)}
                />
                <Field
                  label="Next review date"
                  type="date"
                  value={draft.due}
                  onChange={(v) => put("due", v)}
                />
              </>
            )}
          </section>
          <aside className="wb-context">
            <span className="eyebrow">NEXT DECISION</span>
            <h3>
              {missing.length
                ? "Prepare a credible pilot"
                : "Review the experiment plan"}
            </h3>
            <p>{missing.length + " missing essentials"}</p>
            <ul>
              {missing.length ? (
                missing.map((x) => (
                  <li key={x}>
                    <span className="wb-open-dot" />
                    {x}
                  </li>
                ))
              ) : (
                <li>
                  <Check size={16} />
                  Experiment essentials recorded
                </li>
              )}
            </ul>
            <button onClick={() => goSection("Prioritize pilot")}>
              Open pilot plan <ChevronRight size={15} />
            </button>
            <hr />
            <h4>Evidence, not certainty</h4>
            <span className="wb-badge">{draft.evidence}</span>
            <p>
              Applies to the problem assessment. Economic inputs remain
              assumptions; observations are listed separately.
            </p>
            <hr />
            <h4>Connected to strategy</h4>
            <p>
              {data.objectives.find((o) => o.id === draft.objectiveId)?.title ||
                "No objective linked"}
            </p>
            <p>
              {data.nodes.find((n) => n.id === draft.nodeId)?.label ||
                "No target shift linked"}
            </p>
            {draft.sourceIds.map((source) => (
              <button
                key={source}
                onClick={() => {
                  const s = all.find((w) => w.id === source);
                  if (s) open(s);
                }}
              >
                <Link2 size={14} />
                Source opportunity
              </button>
            ))}
            <small>
              Method: {draft.methodVersion}
              <br />
              Facilitator-led · shared team access
            </small>
          </aside>
        </div>
        <ChallengerPanel
          key={draft.id}
          record={draft}
          revision={baseRevision}
          dirty={!!dirty || entryPending}
          demo={demo}
          onApply={(edits) => {
            setDraft((d) => {
              if (!d) return d;
              const next = { ...d };
              for (const edit of edits) next[edit.field] = edit.proposed;
              return next;
            });
            setMessage("AI suggestions added to draft. Review before saving.");
          }}
        />
      </div>
    );
  }
  return (
    <div className="workbench" inert={saving} aria-busy={saving}>
      {demo && (
        <div className="wb-demo">
          <strong>Example landscape</strong> · illustrative records, not client
          data.{" "}
          <button
            onClick={async () => {
              if (!(await requestNavigation())) return;
              setCapture(null);
              setDemo(false);
              setView("Sprint room");
              setCell(null);
              setSelection([]);
            }}
          >
            Return to shared workspace
          </button>
        </div>
      )}
      <section className="wb-hero">
        <div>
          <span className="eyebrow">FROM POSSIBILITIES TO PROOF</span>
          <h2>
            Discover the opportunity.
            <br />
            Design the next move.
          </h2>
          <p>
            Connect real problems to AI capabilities, then test the ideas that
            matter.
          </p>
          <div>
            <button
              className="wb-accent"
              disabled={demo}
              onClick={async () => {
                if (!(await requestNavigation())) return;
                setCapture({
                  ...newWorkItem(),
                  process: process === "All processes" ? "" : process,
                  session: session === "All sessions" ? "" : session,
                });
              }}
            >
              <Plus size={17} />
              Capture idea
            </button>
            <button
              className="wb-hero-secondary"
              onClick={async () => {
                if (!(await requestNavigation())) return;
                setCapture(null);
                setDemo(!demo);
                setView(demo ? "Sprint room" : "Landscape");
                setCell(null);
                setSelection([]);
                setProcess("All processes");
                setSession("All sessions");
              }}
            >
              {demo ? "Exit example" : "Explore an example"}{" "}
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
        <div className="wb-pulse">
          <span>WORKSHOP PULSE</span>
          <div>
            <strong>{String(all.length).padStart(2, "0")}</strong>
            <p>opportunities & use cases</p>
          </div>
          <div className="wb-pulse-foot">
            <span>
              {all.filter((w) => w.kind === "usecase").length} use cases
            </span>
            <span>
              {stats.assessed}/{stats.total} assessed
            </span>
          </div>
          <div className="wb-mini-bars">
            {categories.map((c) => (
              <span
                key={c}
                style={{
                  height:
                    16 +
                    all.filter((w) => w.categories.includes(c)).length * 16,
                }}
                title={c}
              />
            ))}
          </div>
        </div>
      </section>
      <div className="wb-summary-row">
        <div>
          <Lightbulb />
          <span>
            Captured ideas
            <strong>{all.filter((w) => w.kind === "idea").length}</strong>
          </span>
        </div>
        <div>
          <FlaskConical />
          <span>
            Experiments in motion
            <strong>
              {
                all.filter((w) =>
                  ["Experiment planned", "Piloting"].includes(w.stage),
                ).length
              }
            </strong>
          </span>
        </div>
        <div>
          <Check />
          <span>
            Cases with observations
            <strong>{all.filter((w) => w.observations.length).length}</strong>
          </span>
        </div>
        <div>
          <Users />
          <span>
            Enablement actions
            <strong>{all.reduce((n, w) => n + w.enablement.length, 0)}</strong>
          </span>
        </div>
      </div>
      {capture && (
        <section className="wb-capture">
          <div className="section-heading">
            <h3>Capture the problem while it’s fresh</h3>
            <button
              onClick={async () => {
                if (!dirty || (await confirmDiscard())) setCapture(null);
              }}
            >
              Close
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save(capture, true);
            }}
          >
            <Field
              label="Idea title"
              value={capture.title}
              onChange={(v) => setCapture({ ...capture, title: v })}
              required
            />
            <Field
              label="Problem / user need"
              type="textarea"
              value={capture.problem}
              onChange={(v) => setCapture({ ...capture, problem: v })}
              required
            />
            <div className="wb-form-grid">
              <Field
                label="Process (optional)"
                value={capture.process}
                onChange={(v) => setCapture({ ...capture, process: v })}
              />
              <Field
                label="Discovery session (optional)"
                value={capture.session}
                onChange={(v) => setCapture({ ...capture, session: v })}
              />
            </div>
            <button className="primary" disabled={saving}>
              Save idea <ArrowUpRight size={16} />
            </button>
          </form>
        </section>
      )}
      {reportError}
      <div className="wb-toolbar">
        <nav aria-label="Workbench views">
          {[
            { v: "Sprint room", i: Lightbulb },
            { v: "List", i: List },
            { v: "Landscape", i: Grid2X2 },
            { v: "Review", i: SlidersHorizontal },
            { v: "Enablement", i: Users },
            { v: "Deliverables", i: Layers },
          ].map(({ v, i: Icon }) => (
            <button
              key={v}
              aria-pressed={view === v}
              className={view === v ? "active" : ""}
              onClick={async () => {
                if (!(await requestNavigation())) return;
                setCapture(null);
                setView(v);
                setCell(null);
              }}
            >
              <Icon size={16} />
              {v}
              {v === "Review" && selection.length > 0 && (
                <span>{selection.length}</span>
              )}
            </button>
          ))}
        </nav>
        <span>
          {filtered.length} of {all.length} records
        </span>
      </div>
      {view === "Sprint room" && (
        <SprintRoom
          snapshot={snapshot}
          onSnapshot={onSnapshot}
          demo={demo}
          onFilter={async (title) => {
            if (!(await requestNavigation())) return;
            setSession(title);
            setView("List");
          }}
          onCapture={(category, s) => {
            setCapture({
              ...newWorkItem(),
              categories: [category],
              session: s?.title || "",
              sessionId: s?.id || "",
              methodVersion: "studio-guidance-2",
            });
            setView("List");
          }}
        />
      )}
      {view !== "Sprint room" && (
        <div className="wb-filters">
          <label className="wb-search">
            <Search size={17} />
            <input
              aria-label="Search workbench"
              placeholder="Search problems, ideas or owners…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            aria-label="Process filter"
            value={process}
            onChange={(e) => {
              setProcess(e.target.value);
              setCell(null);
            }}
          >
            <option>All processes</option>
            {processes.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <select
            aria-label="Session filter"
            value={session}
            onChange={(e) => {
              setSession(e.target.value);
              setCell(null);
            }}
          >
            <option>All sessions</option>
            {sessions.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            aria-label="Record type filter"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option>All items</option>
            <option value="idea">Ideas</option>
            <option value="usecase">Use cases</option>
          </select>
          {(search ||
            process !== "All processes" ||
            session !== "All sessions" ||
            kind !== "All items") && (
            <button
              onClick={() => {
                setSearch("");
                setProcess("All processes");
                setSession("All sessions");
                setKind("All items");
                setCell(null);
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}
      {view === "Deliverables" && (
        <DeliveryReadiness
          items={filtered}
          onOpen={(w) => {
            open(w, "Design");
          }}
        />
      )}
      {view === "List" && (
        <>
          <div className="wb-list-heading">
            <h3>Your opportunity pipeline</h3>
            <span>Select up to 3 records to compare</span>
          </div>
          <div className="wb-cards">
            {filtered.map((w) => (
              <article key={w.id} className="wb-case-card">
                <div className="wb-case-top">
                  <span
                    className={
                      "wb-badge " + (w.kind === "usecase" ? "warm" : "")
                    }
                  >
                    {w.kind === "usecase" ? "Use case" : "Opportunity"}
                  </span>
                  <label className="wb-compare-check">
                    <input
                      type="checkbox"
                      aria-label={`Compare ${w.title}`}
                      checked={selection.includes(w.id)}
                      disabled={
                        !selection.includes(w.id) && selection.length === 3
                      }
                      onChange={() => choose(w)}
                    />
                    Compare
                  </label>
                </div>
                <button className="wb-case-title" onClick={() => open(w)}>
                  {w.title}
                  <ArrowUpRight size={18} />
                </button>
                <p>{w.problem}</p>
                <div className="wb-tags">
                  {w.categories.slice(0, 2).map((c) => (
                    <span key={c}>{c}</span>
                  ))}
                  {w.categories.length > 2 && (
                    <span>+{w.categories.length - 2}</span>
                  )}
                </div>
                <div className="wb-card-bottom">
                  <span>{w.process || "Unassigned process"}</span>
                  <span>{w.stage}</span>
                </div>
                <div className="wb-card-evidence">
                  <span
                    className={
                      w.impact === null ? "wb-unknown-dot" : "wb-scored-dot"
                    }
                  />
                  {w.impact === null
                    ? "Impact unassessed"
                    : `Impact ${w.impact}/5 · ${w.evidence}`}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      {view === "Landscape" && (
        <section className="wb-landscape">
          <div className="wb-map-heading">
            <div>
              <span className="eyebrow">
                OPPORTUNITY LANDSCAPE{demo ? " · ILLUSTRATIVE EXAMPLE" : ""}
              </span>
              <h3>Where could AI change the work?</h3>
              <p>
                Process × AI capability · select a cell to inspect its evidence.
              </p>
            </div>
            <div className="segmented">
              {["Coverage", "Potential", "Count"].map((m) => (
                <button
                  key={m}
                  aria-pressed={heatMode === m}
                  className={heatMode === m ? "selected" : ""}
                  onClick={() => setHeatMode(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="wb-legend">
            <span>
              <i className="wb-swatch unknown" />
              Unassessed
            </span>
            <span>
              <i className="wb-swatch" />
              No captured records
            </span>
            <span>
              Low{" "}
              {["#ffe0d4", "#fec1a9", "#ffa17d", "#ff6428", "#932900"].map(
                (c) => (
                  <i key={c} style={{ background: c }} />
                ),
              )}{" "}
              High
            </span>
            <strong>
              {heatMode === "Coverage"
                ? "Assessed / captured"
                : heatMode === "Potential"
                  ? "Median assessed impact · 1–5"
                  : "Unique records per cell"}
            </strong>
          </div>
          <div className="table-wrap">
            <table className="wb-heatmap">
              <thead>
                <tr>
                  <th>Process / value-stream step</th>
                  {categories.map((c, i) => (
                    <th key={c}>
                      <span>0{i + 1}</span>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ...new Set(
                    filtered.map((w) => w.process || "Unassigned process"),
                  ),
                ].map((p) => (
                  <tr key={p}>
                    <th>{p}</th>
                    {categories.map((c) => {
                      const members = filtered.filter(
                        (w) =>
                          (w.process || "Unassigned process") === p &&
                          w.categories.includes(c),
                      );
                      const s = cellSummary(members);
                      const level = !s.total
                        ? 0
                        : heatMode === "Coverage"
                          ? Math.ceil((s.assessed / s.total) * 5)
                          : heatMode === "Potential"
                            ? Math.round(s.median || 0)
                            : Math.min(5, s.total);
                      return (
                        <td key={c}>
                          <button
                            className={`wb-heat wb-intensity-${level} ${s.total && !s.assessed && heatMode !== "Count" ? "wb-hatched" : ""}`}
                            aria-label={`${p}, ${c}: ${s.assessed} assessed of ${s.total} records${s.median !== null ? ", median impact " + s.median : ""}`}
                            onClick={() => setCell({ process: p, category: c })}
                          >
                            <strong>
                              {!s.total
                                ? "—"
                                : heatMode === "Coverage"
                                  ? `${s.assessed}/${s.total}`
                                  : heatMode === "Potential"
                                    ? s.median === null
                                      ? "?"
                                      : number(s.median)
                                    : s.total}
                            </strong>
                            <small>
                              {s.total
                                ? heatMode === "Potential"
                                  ? `${s.assessed} assessed`
                                  : "open records"
                                : "none captured"}
                            </small>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="wb-map-note">
            Multi-category records appear in several cells. The portfolio
            contains {filtered.length} unique records; cell counts must not be
            added. {filtered.filter((w) => !w.categories.length).length} records
            have no capability mapping.
          </p>
          {cell && (
            <div className="wb-cell-detail">
              <div className="section-heading">
                <h4>
                  {cell.process} / {cell.category}
                </h4>
                <button onClick={() => setCell(null)}>Close detail</button>
              </div>
              {contributing.length ? (
                contributing.map((w) => (
                  <button key={w.id} onClick={() => open(w)}>
                    <span>
                      <strong>{w.title}</strong>
                      <small>
                        {w.evidence} ·{" "}
                        {w.evidenceNote || "No assessment rationale"}
                      </small>
                    </span>
                    <span>
                      {w.impact === null ? "Unknown" : w.impact + "/5"}{" "}
                      <ArrowUpRight size={14} />
                    </span>
                  </button>
                ))
              ) : (
                <p>
                  No opportunities captured here. This does not mean no AI
                  potential.
                </p>
              )}
            </div>
          )}
        </section>
      )}
      {view === "Review" && (
        <section className="wb-panel">
          <h3>Compare the next decisions</h3>
          <p className="wb-help">
            Choose up to three records in List. Benefits are not summed;
            overlapping value and different intents need separate judgment.
          </p>
          <div className="wb-review-grid">
            {selected.map((w) => {
              const v = valueModel(w.economics);
              return (
                <article key={w.id}>
                  <span className="wb-badge">{w.stage}</span>
                  <h3>{w.title}</h3>
                  <dl>
                    <dt>Value intent</dt>
                    <dd>{w.valueIntent}</dd>
                    <dt>Impact / evidence</dt>
                    <dd>
                      {w.impact ?? "Unknown"} · {w.evidence}
                    </dd>
                    <dt>Released hours / year</dt>
                    <dd>{number(v.hours)}</dd>
                    <dt>Cash benefit / year</dt>
                    <dd>{money(v.cash)}</dd>
                    <dt>Implementation cost</dt>
                    <dd>{money(w.economics.setup)}</dd>
                    <dt>Overlap group</dt>
                    <dd>{w.overlap || "Not assessed"}</dd>
                    <dt>Pilot essentials missing</dt>
                    <dd>{readiness(w).length}</dd>
                    <dt>Next action</dt>
                    <dd>{w.nextAction || "Not assigned"}</dd>
                  </dl>
                  <button onClick={() => open(w)}>
                    Review case <ArrowUpRight size={15} />
                  </button>
                </article>
              );
            })}
          </div>
          {!selected.length && (
            <div className="wb-empty">
              <SlidersHorizontal />
              <p>Select records in List to start a focused comparison.</p>
              <button onClick={() => setView("List")}>Choose cases</button>
            </div>
          )}
        </section>
      )}
      {view === "Enablement" && (
        <section className="wb-panel">
          <h3>Capability follows the work</h3>
          <p className="wb-help">
            Required skills and practical actions for the filtered portfolio.
            Capacity and proficiency are separate.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Use case / action</th>
                  <th>Responsible role / skill</th>
                  <th>Target / current</th>
                  <th>Owner / due</th>
                  <th>Evidence criterion</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.flatMap((w) =>
                  w.enablement.map((a) => {
                    const current = data.assessments.find(
                      (x) => x.roleId === a.roleId && x.skillId === a.skillId,
                    )?.current;
                    return (
                      <tr key={w.id + a.id}>
                        <td>
                          <button onClick={() => open(w)}>{w.title}</button>
                          <small>{a.action}</small>
                        </td>
                        <td>
                          {data.roles.find((r) => r.id === a.roleId)?.name}
                          <small>
                            {data.skills.find((s) => s.id === a.skillId)?.name}
                          </small>
                        </td>
                        <td>
                          {a.target} / {current ?? "Unassessed"}
                        </td>
                        <td>
                          {a.owner}
                          <small>{a.due}</small>
                        </td>
                        <td>{a.criterion}</td>
                        <td>{a.status}</td>
                      </tr>
                    );
                  }),
                )}
              </tbody>
            </table>
          </div>
          {!filtered.some((w) => w.enablement.length) && (
            <div className="wb-empty">
              <Users />
              <p>
                Add a role-specific enablement action in a use case’s Design
                section.
              </p>
            </div>
          )}
        </section>
      )}
      {!filtered.length &&
        !["Review", "Sprint room", "Deliverables"].includes(view) && (
          <section className="wb-empty">
            <Lightbulb size={30} />
            <h3>
              {all.length
                ? "No records match these filters"
                : "Every opportunity starts with a real problem"}
            </h3>
            <p>
              {all.length
                ? "Clear filters to see your full landscape."
                : "Capture your first idea, or explore the example landscape before starting a session."}
            </p>
            {!all.length && (
              <button
                className="primary"
                onClick={() => setCapture(newWorkItem())}
              >
                Capture the first idea <Plus size={16} />
              </button>
            )}
          </section>
        )}
      <div className="wb-footnote">
        Facilitator-led workspace · designate one scribe · capability library
        provisional v1
      </div>
    </div>
  );
}
