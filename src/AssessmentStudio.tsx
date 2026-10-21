import { useState } from "react";
import type { WorkDesign } from "./sprint-model";
import { cardSearchText, type MethodCard } from "./method-model";
import { assessmentGaps, type AssessmentEntry } from "./assessment-model";
import { cardCategory } from "./card-decks";
import CardDeckBrowser from "./CardDeckBrowser";
import "./assessment.css";

const decks = {
  "data-card": "Data sources",
  "resource-card": "Resources & roles",
  "risk-card": "Risk controls",
} as const;
export default function AssessmentStudio({
  value,
  onChange,
  cards,
}: {
  value: WorkDesign;
  onChange: (v: WorkDesign) => void;
  cards: MethodCard[];
}) {
  const [kind, setKind] = useState<AssessmentEntry["kind"]>("data-card");
  const [target, setTarget] = useState("");
  const [query, setQuery] = useState("");
  const [browse, setBrowse] = useState(false);
  const entries = value.assessment || [];
  const scoped = entries.filter((e) => e.kind === kind && e.taskId === target);
  const update = (next: AssessmentEntry[]) =>
    onChange({ ...value, assessment: next });
  const field = (id: string, patch: Partial<AssessmentEntry>) =>
    update(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const shortlist = scoped.filter((e) => e.shortlist).length;
  return (
    <section className="assessment-studio">
      <span className="eyebrow">CONCEPT ASSESSMENT</span>
      <h3>Turn selected cards into delivery requirements</h3>
      <p>
        Start with the minimum viable data and team. Document risk controls
        before a pilot. Card selection is not evidence of access, availability
        or compliance.
      </p>
      <div className="assessment-summary">
        <strong>{entries.length} requirements</strong>
        <span>
          {entries.length
            ? `${assessmentGaps(entries).length} need evidence or action`
            : "Not assessed"}
        </span>
        <span>
          Proposed process only · alternatives require their own assessment
        </span>
      </div>
      <div className="card-view-tabs">
        {Object.entries(decks).map(([k, label]) => (
          <button
            type="button"
            key={k}
            aria-pressed={kind === k}
            onClick={() => {
              setKind(k as AssessmentEntry["kind"]);
              setBrowse(false);
              setQuery("");
            }}
          >
            {label} · {entries.filter((e) => e.kind === k).length}
          </button>
        ))}
      </div>
      <label className="wb-field">
        Apply requirements to
        <select value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="">Whole proposed process</option>
          {[...new Set(entries.map((e) => e.taskId))]
            .filter((id) => id && !value.tasks?.some((t) => t.id === id))
            .map((id) => (
              <option key={id} value={id}>
                Removed task · resolve requirements
              </option>
            ))}
          {value.tasks?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title || "Untitled task"}
            </option>
          ))}
        </select>
      </label>
      <div
        className="assessment-task-strip"
        aria-label="Assessment by process task"
      >
        {[{ id: "", title: "Whole process" }, ...(value.tasks || [])].map(
          (t) => (
            <button
              type="button"
              key={t.id}
              aria-pressed={target === t.id}
              onClick={() => setTarget(t.id)}
            >
              {t.title || "Untitled task"}
              <small>
                {entries.some((e) => e.taskId === t.id)
                  ? `${entries.filter((e) => e.taskId === t.id).length} requirements � ${assessmentGaps(entries.filter((e) => e.taskId === t.id)).length} gaps`
                  : "Not assessed"}
              </small>
            </button>
          ),
        )}
      </div>
      {target && !value.tasks?.some((t) => t.id === target) && (
        <p role="alert">
          This task was removed. Move its requirements to the whole process
          before saving.
        </p>
      )}
      <div className="assessment-summary">
        <span>{scoped.length} selected for this target</span>
        <span>
          {shortlist} shortlisted
          {kind === "data-card"
            ? " · start with about 5"
            : kind === "resource-card"
              ? " · start with about 10"
              : " · prioritize by harm"}
        </span>
        <button type="button" onClick={() => setBrowse(!browse)}>
          {browse ? "Close card chooser" : "Choose assessment cards"}
        </button>
      </div>
      {browse && (
        <div className="assessment-chooser">
          <label className="wb-field">
            Search this deck
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a card or category"
            />
          </label>
          <CardDeckBrowser
            cards={cards.filter(
              (c) =>
                c.kind === kind &&
                cardSearchText(c).includes(query.toLowerCase()),
            )}
            selected={scoped.map((e) => e.cardId)}
            onChange={(ids) => {
              const retained = entries.filter(
                (e) =>
                  e.kind !== kind ||
                  e.taskId !== target ||
                  ids.includes(e.cardId),
              );
              for (const cardId of ids)
                if (!scoped.some((e) => e.cardId === cardId))
                  retained.push({
                    id: crypto.randomUUID(),
                    kind,
                    cardId,
                    taskId: target,
                    specification: "",
                    owner: "",
                    evidence: "",
                    action: "",
                    status: "Unknown",
                    origin: "Unknown",
                    structure: "Unknown",
                    shortlist: false,
                  });
              update(retained);
            }}
          />
        </div>
      )}
      {kind === "data-card" && scoped.length > 0 && (
        <div className="data-matrix" aria-label="Data sourcing matrix">
          {["Internal", "External"].flatMap((origin) =>
            ["Structured", "Unstructured"].map((structure) => (
              <div key={origin + structure}>
                <strong>
                  {origin} · {structure}
                </strong>
                {scoped
                  .filter(
                    (e) => e.origin === origin && e.structure === structure,
                  )
                  .map((e) => (
                    <span key={e.id}>
                      {cards.find((c) => c.id === e.cardId)?.title}
                    </span>
                  ))}
              </div>
            )),
          )}
          <small>
            {
              scoped.filter(
                (e) => e.origin === "Unknown" || e.structure === "Unknown",
              ).length
            }{" "}
            sources still unclassified
          </small>
        </div>
      )}
      {!scoped.length && (
        <p className="assessment-empty">
          Choose cards to define {decks[kind].toLowerCase()} for this target. No
          assessment has been inferred.
        </p>
      )}
      <div className="assessment-entries">
        {scoped.map((e) => {
          const card = cards.find((c) => c.id === e.cardId);
          return (
            <article
              key={e.id}
              style={{
                borderTopColor: card ? cardCategory(card).color : "#777",
              }}
            >
              <div className="section-heading">
                <h4>{card?.title || "Unavailable card"}</h4>
                <button
                  type="button"
                  onClick={() => update(entries.filter((x) => x.id !== e.id))}
                >
                  Remove
                </button>
              </div>
              <label>
                <input
                  type="checkbox"
                  checked={e.shortlist}
                  onChange={(x) => field(e.id, { shortlist: x.target.checked })}
                />{" "}
                MVP shortlist
              </label>
              <div className="wb-form-grid">
                <label className="wb-field">
                  Status
                  <select
                    value={e.status}
                    onChange={(x) =>
                      field(e.id, {
                        status: x.target.value as AssessmentEntry["status"],
                      })
                    }
                  >
                    {[
                      "Unknown",
                      "Needed",
                      "Gap",
                      kind === "risk-card" ? "Controlled" : "Available",
                    ].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label className="wb-field">
                  Accountable owner
                  <input
                    value={e.owner}
                    onChange={(x) => field(e.id, { owner: x.target.value })}
                  />
                </label>
              </div>
              {kind === "data-card" && (
                <div className="wb-form-grid">
                  {(["origin", "structure"] as const).map((key) => (
                    <label className="wb-field" key={key}>
                      {key === "origin" ? "Source location" : "Data structure"}
                      <select
                        value={e[key]}
                        onChange={(x) => field(e.id, { [key]: x.target.value })}
                      >
                        {(key === "origin"
                          ? ["Unknown", "Internal", "External"]
                          : ["Unknown", "Structured", "Unstructured"]
                        ).map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              )}
              <label className="wb-field">
                {kind === "data-card"
                  ? "Exact fields, system and purpose"
                  : kind === "resource-card"
                    ? "Required contribution, effort and availability"
                    : "Best / worst outcome and who could be harmed"}
                <textarea
                  value={e.specification}
                  onChange={(x) =>
                    field(e.id, { specification: x.target.value })
                  }
                />
              </label>
              <label className="wb-field">
                {kind === "risk-card"
                  ? "Mitigation, human intervention and stop condition"
                  : "Next action / dependency"}
                <textarea
                  value={e.action}
                  onChange={(x) => field(e.id, { action: x.target.value })}
                />
              </label>
              <label className="wb-field">
                {kind === "data-card"
                  ? "Access permission and quality evidence"
                  : kind === "resource-card"
                    ? "Availability confirmation / cost assumption"
                    : "Control test and evidence"}
                <textarea
                  value={e.evidence}
                  onChange={(x) => field(e.id, { evidence: x.target.value })}
                />
              </label>
              <small>
                {assessmentGaps([e]).length
                  ? "Evidence or action still required"
                  : "Documented · independently verify before a pilot"}
              </small>
              {target && !value.tasks?.some((t) => t.id === target) && (
                <button
                  type="button"
                  onClick={() => field(e.id, { taskId: "" })}
                >
                  Move to whole process
                </button>
              )}
            </article>
          );
        })}
      </div>
      <p className="muted">
        Saved with the use-case draft. Resource estimates are not automatically
        added to the business case; reconcile costs once to avoid double
        counting.
      </p>
    </section>
  );
}
