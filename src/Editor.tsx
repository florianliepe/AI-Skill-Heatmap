import { useEffect, useRef, useState } from "react";
import { X, Trash2, Save } from "lucide-react";
import type { Collection, RecordValue, Workspace } from "./types";
type Field = {
  key: string;
  label: string;
  type?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  required?: boolean;
};
export function newRecord(
  collection: Collection,
  data: Workspace,
): RecordValue {
  const id = crypto.randomUUID();
  const defaults = {
    visions: {
      id,
      title: "",
      statement: "",
      purpose: "",
      horizon: "2027 / 2028",
      owner: "",
    },
    objectives: {
      id,
      title: "",
      description: "",
      owner: "",
      period: "2027",
      pillar: "Business value",
    },
    keyResults: {
      id,
      objectiveId: data.objectives[0]?.id || "",
      title: "",
      baseline: 0,
      target: 100,
      current: null,
      unit: "%",
      owner: "",
      dueDate: "2027-12-31",
      evidence: "",
    },
    skills: {
      id,
      name: "",
      family: "AI Foundations and Adoption",
      definition: "",
      levels: ["", "", "", ""],
      relevance: 3,
      impact: 3,
      upskilling: 3,
      horizon: "Now",
      status: "Proposed",
      evidence: "",
    },
    roles: { id, name: "", accountability: "", workMode: "AI-augmented" },
    assessments: {
      id,
      roleId: data.roles[0]?.id || "",
      skillId: data.skills[0]?.id || "",
      target: 2,
      current: null,
      evidence: "",
      priority: "Core",
    },
    nodes: {
      id,
      label: "",
      category: "Capability",
      description: "",
      currentState: "",
      targetState: "",
      owner: "",
      mode: "AI-supported",
      x: 100,
      y: 100,
    },
    edges: {
      id,
      source: data.nodes[0]?.id || "",
      target: data.nodes[1]?.id || "",
      label: "",
    },
  };
  return defaults[collection];
}
export default function Editor({
  collection,
  record,
  create,
  data,
  busy,
  onClose,
  onSave,
  onDelete,
}: {
  collection: Collection;
  record: RecordValue;
  create: boolean;
  data: Workspace;
  busy: boolean;
  onClose: () => void;
  onSave: (r: RecordValue) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [value, setValue] = useState<Record<string, unknown>>(
    structuredClone(record) as unknown as Record<string, unknown>,
  );
  const dirty = JSON.stringify(value) !== JSON.stringify(record);
  const closeEditor = () => {
    if (
      !dirty ||
      window.confirm("Discard unsaved changes? Cancel keeps your draft.")
    )
      onClose();
  };
  useEffect(() => {
    const guard = (e: Event) => {
      if (dirty && !window.confirm("Discard unsaved editor changes?"))
        e.preventDefault();
    };
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
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current
      ?.querySelector<HTMLElement>("input, textarea, select")
      ?.focus();
    return () => previous?.focus();
  }, []);
  const opts = (pairs: string[]) => pairs.map((v) => ({ value: v, label: v }));
  const modes = opts(["AI-supported", "AI-augmented", "Agentic"]);
  const allFields: Record<Collection, Field[]> = {
    visions: [
      { key: "title", label: "Vision title", required: true },
      { key: "statement", label: "Vision statement", type: "textarea" },
      { key: "purpose", label: "Purpose & strategic link", type: "textarea" },
      { key: "horizon", label: "Horizon" },
      { key: "owner", label: "Accountable owner" },
    ],
    objectives: [
      { key: "title", label: "Objective", required: true },
      { key: "description", label: "Outcome & rationale", type: "textarea" },
      { key: "owner", label: "Accountable owner" },
      { key: "period", label: "Period" },
      {
        key: "pillar",
        label: "Strategic pillar",
        options: opts([
          "Business value",
          "Flow & quality",
          "People & capability",
          "Governance",
          "Technology",
        ]),
      },
    ],
    keyResults: [
      {
        key: "objectiveId",
        label: "Objective",
        options: data.objectives.map((x) => ({ value: x.id, label: x.title })),
      },
      { key: "title", label: "Key result", required: true },
      { key: "baseline", label: "Baseline", type: "number" },
      { key: "target", label: "Target", type: "number" },
      {
        key: "current",
        label: "Current value (blank = not measured)",
        type: "number",
      },
      { key: "unit", label: "Unit" },
      { key: "owner", label: "Owner" },
      { key: "dueDate", label: "Due date", type: "date" },
      {
        key: "evidence",
        label: "Evidence, source & assumptions",
        type: "textarea",
      },
    ],
    skills: [
      { key: "name", label: "Skill name", required: true },
      { key: "family", label: "Skill family" },
      { key: "definition", label: "Definition", type: "textarea" },
      ...[1, 2, 3, 4].map((n) => ({
        key: "level" + n,
        label: [
          "",
          "1 · Guided",
          "2 · Proficient",
          "3 · Advanced",
          "4 · Expert",
        ][n],
        type: "textarea",
      })),
      {
        key: "relevance",
        label: "Future relevance (1–5)",
        type: "number",
        min: 1,
        max: 5,
      },
      {
        key: "impact",
        label: "Value-stream impact (1–5)",
        type: "number",
        min: 1,
        max: 5,
      },
      {
        key: "upskilling",
        label: "Upskilling need (1–5)",
        type: "number",
        min: 1,
        max: 5,
      },
      {
        key: "horizon",
        label: "Capability horizon",
        options: opts(["Now", "Next", "Later"]),
      },
      {
        key: "status",
        label: "Governance status",
        options: opts(["Proposed", "Validated", "Approved"]),
      },
      { key: "evidence", label: "Evidence & rationale", type: "textarea" },
    ],
    roles: [
      { key: "name", label: "Role name", required: true },
      {
        key: "accountability",
        label: "Human accountability",
        type: "textarea",
      },
      { key: "workMode", label: "Dominant work mode", options: modes },
    ],
    assessments: [
      {
        key: "roleId",
        label: "Role",
        options: data.roles.map((x) => ({ value: x.id, label: x.name })),
      },
      {
        key: "skillId",
        label: "Skill",
        options: data.skills.map((x) => ({ value: x.id, label: x.name })),
      },
      {
        key: "target",
        label: "Target proficiency (1–4)",
        type: "number",
        min: 1,
        max: 4,
      },
      {
        key: "current",
        label: "Current proficiency (blank = unassessed)",
        type: "number",
        min: 1,
        max: 4,
      },
      {
        key: "priority",
        label: "Priority",
        options: opts(["Core", "Supporting"]),
      },
      { key: "evidence", label: "Assessment evidence", type: "textarea" },
    ],
    nodes: [
      { key: "label", label: "Element name", required: true },
      {
        key: "category",
        label: "Category",
        options: opts([
          "Value stream",
          "Capability",
          "Team & organisation",
          "AI tools & systems",
          "Service / product",
          "Enablement",
          "Governance",
        ]),
      },
      { key: "description", label: "Purpose", type: "textarea" },
      { key: "currentState", label: "Current state", type: "textarea" },
      { key: "targetState", label: "Target state", type: "textarea" },
      { key: "owner", label: "Owner" },
      { key: "mode", label: "Work mode", options: modes },
      { key: "x", label: "Horizontal position", type: "number" },
      { key: "y", label: "Vertical position", type: "number" },
    ],
    edges: [
      {
        key: "source",
        label: "From element",
        options: data.nodes.map((x) => ({ value: x.id, label: x.label })),
      },
      {
        key: "target",
        label: "To element",
        options: data.nodes.map((x) => ({ value: x.id, label: x.label })),
      },
      { key: "label", label: "Connection label" },
    ],
  };
  const labels: Record<Collection, string> = {
    visions: "vision",
    objectives: "objective",
    keyResults: "key result",
    skills: "skill",
    roles: "role",
    assessments: "role assessment",
    nodes: "target element",
    edges: "connection",
  };
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await onSave(value as unknown as RecordValue);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) closeEditor();
      }}
    >
      <section
        className="editor"
        ref={dialogRef}
        onKeyDown={(event) => {
          if (event.key === "Escape" && !busy) closeEditor();
          if (event.key !== "Tab") return;
          const focusable = [
            ...(dialogRef.current?.querySelectorAll<HTMLElement>(
              "button:not(:disabled), input, select, textarea",
            ) || []),
          ];
          const first = focusable[0],
            last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-label={`${create ? "Add" : "Edit"} ${labels[collection]}`}
      >
        <header>
          <div>
            <span className="eyebrow">WORKSPACE EDITOR</span>
            <h2>
              {create ? "Add" : "Edit"} {labels[collection]}
            </h2>
          </div>
          <button
            aria-label="Close editor"
            className="icon-button"
            onClick={closeEditor}
            disabled={busy}
          >
            <X size={20} />
          </button>
        </header>
        <form onSubmit={submit}>
          <div className="editor-fields">
            {allFields[collection].map((f) => {
              const level = f.key.startsWith("level")
                ? Number(f.key.slice(5)) - 1
                : -1;
              const v =
                level >= 0 ? (value.levels as string[])[level] : value[f.key];
              const change = (raw: string) =>
                setValue((old) =>
                  level >= 0
                    ? {
                        ...old,
                        levels: (old.levels as string[]).map((s, i) =>
                          i === level ? raw : s,
                        ),
                      }
                    : {
                        ...old,
                        [f.key]:
                          f.type === "number"
                            ? raw === "" && f.key === "current"
                              ? null
                              : Number(raw)
                            : raw,
                      },
                );
              return (
                <label key={f.key}>
                  {f.label}
                  {f.type === "textarea" ? (
                    <textarea
                      rows={3}
                      maxLength={12000}
                      value={String(v ?? "")}
                      onChange={(e) => change(e.target.value)}
                    />
                  ) : f.options ? (
                    <select
                      value={String(v ?? "")}
                      onChange={(e) => change(e.target.value)}
                      required
                    >
                      {!f.options.some((o) => o.value === v) && (
                        <option value={String(v ?? "")}>
                          {String(v || "Select…")}
                        </option>
                      )}
                      {f.options.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={f.type || "text"}
                      value={String(v ?? "")}
                      required={
                        f.required ||
                        (f.type === "number" && f.key !== "current")
                      }
                      min={f.min}
                      max={f.max}
                      step={f.min ? 1 : "any"}
                      maxLength={12000}
                      onChange={(e) => change(e.target.value)}
                    />
                  )}
                </label>
              );
            })}
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {confirmDelete && (
            <div className="delete-warning">
              <strong>Delete this {labels[collection]}?</strong>
              <p>
                Related key results, role assessments or connections will also
                be removed where applicable.
              </p>
              <button
                type="button"
                className="danger"
                disabled={busy}
                onClick={async () => {
                  try {
                    await onDelete();
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Confirm deletion
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)}>
                Keep record
              </button>
            </div>
          )}
          <footer>
            {!create && (
              <button
                type="button"
                className="text-danger"
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
              >
                <Trash2 size={16} />
                Delete
              </button>
            )}
            <span className="spacer" />
            <button type="button" onClick={closeEditor} disabled={busy}>
              Cancel
            </button>
            <button className="primary" type="submit" disabled={busy}>
              <Save size={16} />
              {busy ? "Saving…" : "Save changes"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
