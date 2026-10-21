import { useEffect, useState } from "react";
import type { Snapshot } from "./types";
import type { WorkItem } from "./workbench-model";
import { cardCoverage, cardSearchText, type MethodCard } from "./method-model";
import CardDeckBrowser from "./CardDeckBrowser";
import { saveWorkItem } from "./api";
import { saveMethodCard } from "./api";
import { confirmDiscard, protectNavigation } from "./navigation";

export default function CardLibrary({
  cards,
  items = [],
  snapshot,
  onSnapshot,
  readOnly = false,
}: {
  cards: MethodCard[];
  items?: WorkItem[];
  snapshot: Snapshot;
  onSnapshot: (s: Snapshot) => void;
  readOnly?: boolean;
}) {
  const [linkDraft, setLinkDraft] = useState<WorkItem | null>(null);
  const [linkRevision, setLinkRevision] = useState(snapshot.revision);
  const [target, setTarget] = useState("");
  const [linkError, setLinkError] = useState("");
  const [linkBusy, setLinkBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("ai-card");
  const [category, setCategory] = useState("");
  const [coverage, setCoverage] = useState("");
  const [view, setView] = useState("Library");
  const [limit, setLimit] = useState(12);
  const [draft, setDraft] = useState<MethodCard | null>(null);
  const [revision, setRevision] = useState(snapshot.revision);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const aiCards = cards.filter((c) => c.kind === "ai-card");
  const complete = aiCards.filter((c) => cardCoverage(c) === "Reviewed").length;
  const filtered = cards.filter(
    (c) =>
      (!kind || (c.kind || "method") === kind) &&
      (!category || c.category === category) &&
      (!coverage || cardCoverage(c) === coverage) &&
      cardSearchText(c).includes(query.toLowerCase()),
  );
  useEffect(() => {
    const guard = (e: Event) => protectNavigation(e, !!draft || !!linkDraft);
    const unload = (e: BeforeUnloadEvent) => {
      if (draft || linkDraft) {
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
  }, [draft, linkDraft]);
  function edit(c: MethodCard) {
    setDraft(structuredClone(c));
    setRevision(snapshot.revision);
    setError("");
  }
  function field(key: keyof MethodCard, value: string) {
    if (!draft) return;
    setDraft({
      ...draft,
      [key]: value,
      ...([
        "body",
        "backText",
        "sourceUrl",
        "backSourceUrl",
        "explanation",
      ].includes(key)
        ? { reviewStatus: "unreviewed" as const }
        : {}),
    });
  }
  return (
    <section className="wb-panel method-library">
      <span className="eyebrow">PRIVATE CARD WORKBENCH</span>
      <h3>Understand both sides. Design the application.</h3>
      <p>
        Search original wording, reverse-side guidance and separate Studio
        explanations. Source content stays in the authenticated workspace.
      </p>
      <div className="card-coverage-strip">
        <div>
          <strong>{aiCards.length}</strong>
          <span>AI design cards inventoried</span>
        </div>
        <div>
          <strong>{complete}</strong>
          <span>Reviewed against source</span>
        </div>
        <div>
          <strong>
            {aiCards.filter((c) => c.body.trim() && c.backText?.trim()).length}
          </strong>
          <span>Both sides available - review separately</span>
        </div>
        <div>
          <strong>
            {cards.filter((c) => c.kind === "method" || !c.kind).length}
          </strong>
          <span>Separate method extracts</span>
        </div>
      </div>
      {!aiCards.length && (
        <div className="card-source-gap">
          <strong>Deck inventory pending</strong>
          <p>
            The existing method extracts are not the two-sided AI design deck.
            Readable originals are needed to inventory every card and verify
            page 2. No missing side has been inferred.
          </p>
          <span>
            Next action: provide or import readable card PDFs with both sides.
          </span>
        </div>
      )}
      <div className="section-heading">
        <div className="card-view-tabs">
          {["Library", "Backlog"].map((v) => (
            <button
              key={v}
              aria-pressed={view === v}
              onClick={() => setView(v)}
            >
              {v}
            </button>
          ))}
        </div>
        <button
          disabled={readOnly || !!draft}
          onClick={() =>
            edit({
              id: crypto.randomUUID(),
              kind: "ai-card",
              title: "",
              category: "",
              body: "",
              sourceUrl: "",
              version: "v1",
              reviewStatus: "unreviewed",
            })
          }
        >
          Add AI design card
        </button>
      </div>
      <div className="card-library-filters">
        <label className="wb-field">
          Search both sides & explanations
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(12);
            }}
            placeholder="Capability, data, risk, task or keyword"
          />
        </label>
        <label className="wb-field">
          Record type
          <select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value);
              setCategory("");
              setCoverage("");
              setLimit(12);
            }}
          >
            <option value="ai-card">AI design cards</option>
            <option value="method">Method extracts</option>
            <option value="data-card">Data sources</option>
            <option value="resource-card">Resources & roles</option>
            <option value="risk-card">Risk controls</option>
            <option value="">All records</option>
          </select>
        </label>
        <label className="wb-field">
          Category / stage
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {[
              ...new Set(
                cards
                  .filter((c) => !kind || (c.kind || "method") === kind)
                  .map((c) => c.category),
              ),
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="wb-field">
          Content coverage
          <select
            value={coverage}
            onChange={(e) => setCoverage(e.target.value)}
          >
            <option value="">All coverage states</option>
            {[
              "Missing front",
              "Missing reverse",
              "Missing reverse source",
              "Needs explanation",
              "Needs review",
              "Reviewed",
              "Method extract",
              "Front available · review pending",
              "Reviewed front only",
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <small>
        {filtered.length} matching records · counts do not certify completeness
        of the original deck
      </small>
      {draft && (
        <form
          className="card-detail-editor"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              const result = await saveMethodCard(
                draft,
                revision,
                !cards.some((c) => c.id === draft.id),
                crypto.randomUUID(),
              );
              onSnapshot(result);
              setDraft(null);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h4>
            {draft.title || "New card"} · {cardCoverage(draft)}
          </h4>
          <p>
            Keep source wording separate from explanations. Editing either side
            clears the review status. A source-linked shell may be saved with
            missing content.
          </p>
          <fieldset disabled={busy}>
            <div className="wb-form-grid">
              <label className="wb-field">
                Record type
                <select
                  value={draft.kind || "method"}
                  onChange={(e) => field("kind", e.target.value)}
                >
                  <option value="ai-card">AI design card · two sides</option>
                  <option value="method">Method extract</option>
                  <option value="data-card">Data source card</option>
                  <option value="resource-card">Resource / role card</option>
                  <option value="risk-card">Risk card</option>
                </select>
              </label>
              {(
                ["title", "category", "version", "tags", "sourceUrl"] as const
              ).map((k) => (
                <label className="wb-field" key={k}>
                  {
                    {
                      title: "Title",
                      category: "Category / stage",
                      version: "Source version / adaptation",
                      tags: "Search tags",
                      sourceUrl: "Front / extract HTTPS source",
                    }[k]
                  }
                  <input
                    required={k !== "tags"}
                    value={draft[k] || ""}
                    onChange={(e) => field(k, e.target.value)}
                  />
                </label>
              ))}
            </div>
            <div className="card-two-sides">
              <label className="wb-field">
                Side 1 · original wording
                <textarea
                  rows={8}
                  value={draft.body}
                  onChange={(e) => field("body", e.target.value)}
                />
              </label>
              {draft.kind === "ai-card" && (
                <label className="wb-field">
                  Side 2 · original wording
                  <textarea
                    rows={8}
                    value={draft.backText || ""}
                    onChange={(e) => field("backText", e.target.value)}
                  />
                </label>
              )}
            </div>
            {draft.kind === "ai-card" && (
              <label className="wb-field">
                Side 2 HTTPS source / page reference
                <input
                  value={draft.backSourceUrl || ""}
                  onChange={(e) => field("backSourceUrl", e.target.value)}
                />
              </label>
            )}
            <label className="wb-field">
              Studio explanation · interpretation, not source text
              <textarea
                value={draft.explanation || ""}
                onChange={(e) => field("explanation", e.target.value)}
                placeholder="What it does, when to use it, inputs, limitations and a design question."
              />
            </label>
            <div className="wb-form-grid">
              <label className="wb-field">
                Content review
                <select
                  value={draft.reviewStatus || "unreviewed"}
                  onChange={(e) => field("reviewStatus", e.target.value)}
                >
                  <option value="unreviewed">Not reviewed</option>
                  <option value="reviewed">Reviewed against source</option>
                </select>
              </label>
              <label className="wb-field">
                Backlog owner
                <input
                  value={draft.backlogOwner || ""}
                  onChange={(e) => field("backlogOwner", e.target.value)}
                />
              </label>
              <label className="wb-field">
                Next action
                <input
                  value={draft.nextAction || ""}
                  onChange={(e) => field("nextAction", e.target.value)}
                />
              </label>
              <label className="wb-field">
                Due date
                <input
                  type="date"
                  value={draft.dueDate || ""}
                  onChange={(e) => field("dueDate", e.target.value)}
                />
              </label>
            </div>
            <label className="wb-field">
              Planned application / design question
              <textarea
                value={draft.applicationNotes || ""}
                onChange={(e) => field("applicationNotes", e.target.value)}
              />
            </label>
            <details>
              <summary>
                Planned use-case applications ·{" "}
                {draft.applicationIds?.length || 0}
              </summary>
              <p>
                Planned applications are not implemented task links or
                approvals.
              </p>
              {items.map((w) => (
                <label className="dependency-option" key={w.id}>
                  <input
                    type="checkbox"
                    checked={draft.applicationIds?.includes(w.id) || false}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        applicationIds: e.target.checked
                          ? [...(draft.applicationIds || []), w.id]
                          : (draft.applicationIds || []).filter(
                              (id) => id !== w.id,
                            ),
                      })
                    }
                  />
                  {w.title}
                </label>
              ))}
            </details>
          </fieldset>
          {error && (
            <p role="alert">
              {error} Your draft is retained; refresh and reopen the latest
              record to reconcile concurrent changes.
            </p>
          )}
          <button className="primary" disabled={busy}>
            {busy ? "Saving…" : "Save private card"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (await confirmDiscard()) setDraft(null);
            }}
          >
            Close editor
          </button>
        </form>
      )}
      {view === "Library" ? (
        <>
          <div className="deck-target-bar">
            <label className="wb-field">
              Link cards to a task or use case
              <select
                aria-label="Card selection target"
                value={target}
                disabled={linkBusy || !!linkDraft}
                onChange={(e) => {
                  setTarget(e.target.value);
                  setLinkError("");
                }}
              >
                <option value="">
                  Browse only · choose a target to select cards
                </option>
                {items.map((w) => (
                  <optgroup key={w.id} label={w.title}>
                    {(w.workDesign?.tasks || []).map((t) => (
                      <option key={t.id} value={JSON.stringify([w.id, t.id])}>
                        Proposed task · {t.title || "Untitled task"}
                      </option>
                    ))}
                    <option value={JSON.stringify([w.id, ""])}>
                      Whole use case · {w.title}
                    </option>
                  </optgroup>
                ))}
              </select>
            </label>
            {!items.length && (
              <p>
                Create a use case and process tasks in the workbench to start
                linking cards.
              </p>
            )}
            <span role="status">
              {linkBusy
                ? "Saving card links…"
                : linkDraft
                  ? "Unsaved card links"
                  : "Card links saved"}
            </span>
            {linkDraft && (
              <>
                <button
                  type="button"
                  disabled={linkBusy}
                  onClick={async () => {
                    setLinkBusy(true);
                    setLinkError("");
                    try {
                      onSnapshot(
                        await saveWorkItem(
                          linkDraft,
                          linkRevision,
                          false,
                          crypto.randomUUID(),
                        ),
                      );
                      setLinkDraft(null);
                    } catch (e) {
                      setLinkError(
                        (e as Error).message +
                          " Draft retained. Discard and refresh to resolve a conflict.",
                      );
                    } finally {
                      setLinkBusy(false);
                    }
                  }}
                >
                  Save card links
                </button>
                <button
                  type="button"
                  disabled={linkBusy}
                  onClick={() => {
                    setLinkDraft(null);
                    setLinkError("");
                  }}
                >
                  Discard card-link changes
                </button>
              </>
            )}

            {linkError && <p role="alert">{linkError}</p>}
          </div>
          {(() => {
            const [itemId, taskId] = target
              ? (JSON.parse(target) as string[])
              : [];
            const item = linkDraft || items.find((w) => w.id === itemId);
            const task = item?.workDesign?.tasks?.find((t) => t.id === taskId);
            return (
              <fieldset className="deck-selection-fieldset" disabled={linkBusy}>
                <CardDeckBrowser
                  key={kind}
                  cards={filtered}
                  selected={(taskId ? task?.cardIds : item?.cardIds) || []}
                  onEdit={!readOnly && !draft ? edit : undefined}
                  onChange={
                    item && (!taskId || task) && !readOnly
                      ? (ids) => {
                          if (!linkDraft) setLinkRevision(snapshot.revision);
                          const record = structuredClone(item);
                          if (taskId && record.workDesign?.tasks)
                            record.workDesign.tasks =
                              record.workDesign.tasks.map((t) =>
                                t.id === taskId ? { ...t, cardIds: ids } : t,
                              );
                          else record.cardIds = ids;
                          setLinkDraft(record);
                          setLinkError("");
                        }
                      : undefined
                  }
                />
              </fieldset>
            );
          })()}
        </>
      ) : (
        <div className="card-backlog-scroll">
          <table className="card-backlog">
            <thead>
              <tr>
                <th>Card</th>
                <th>Coverage</th>
                <th>Next action</th>
                <th>Owner / due</th>
                <th>Applications</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, limit).map((c) => (
                <tr key={c.id}>
                  <td>
                    <button
                      disabled={readOnly || !!draft}
                      onClick={() => edit(c)}
                    >
                      {c.title}
                    </button>
                    <small>{c.category}</small>
                  </td>
                  <td>{cardCoverage(c)}</td>
                  <td>
                    {c.nextAction ||
                      (cardCoverage(c) === "Reviewed"
                        ? "Choose an application"
                        : "Review source coverage")}
                  </td>
                  <td>
                    {c.backlogOwner || "Unassigned"}
                    <br />
                    {c.dueDate || "No due date"}
                  </td>
                  <td>
                    {c.applicationIds?.length || 0} planned
                    <br />
                    {
                      items.filter(
                        (w) =>
                          w.cardIds?.includes(c.id) ||
                          w.workDesign?.assessment?.some(
                            (e) => e.cardId === c.id,
                          ) ||
                          w.workDesign?.tasks?.some((t) =>
                            t.cardIds?.includes(c.id),
                          ),
                      ).length
                    }{" "}
                    linked designs
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!filtered.length && (
        <p>
          No matching cards. Change the filters or add a source-linked card.
        </p>
      )}
      {view === "Backlog" && filtered.length > limit && (
        <button onClick={() => setLimit(limit + 24)}>Show more cards</button>
      )}
    </section>
  );
}
