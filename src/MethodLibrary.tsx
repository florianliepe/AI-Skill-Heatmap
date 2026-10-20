import { useEffect, useState } from "react";
import type { MethodCard } from "./method-model";
import { safeSource } from "./method-model";
import type { WorkItem } from "./workbench-model";
import type { Snapshot } from "./types";
import { saveMethodCard } from "./api";
import { protectNavigation, confirmDiscard } from "./navigation";

export function CardPicker({
  cards,
  selected,
  onChange,
}: {
  cards: MethodCard[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  return (
    <details className="method-picker">
      <summary>Link method cards · {selected.length} selected</summary>
      <label className="wb-field">
        Find a card
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title or wording"
        />
      </label>
      <div className="method-picker-list">
        {cards
          .filter(
            (c) =>
              selected.includes(c.id) ||
              `${c.title} ${c.body}`
                .toLowerCase()
                .includes(query.toLowerCase()),
          )
          .map((c) => (
            <label key={c.id}>
              <input
                type="checkbox"
                checked={selected.includes(c.id)}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [...selected, c.id]
                      : selected.filter((id) => id !== c.id),
                  )
                }
              />
              <span>
                {c.title}
                <small>
                  {c.category} · {c.version}
                </small>
              </span>
            </label>
          ))}
      </div>
      {cards
        .filter((c) => selected.includes(c.id))
        .map((c) => (
          <details key={c.id}>
            <summary>{c.title}</summary>
            <p style={{ whiteSpace: "pre-line" }}>{c.body}</p>
            {safeSource(c.sourceUrl) && (
              <a href={c.sourceUrl} target="_blank" rel="noreferrer">
                Open source ↗
              </a>
            )}
          </details>
        ))}
      {!cards.length && <p>No private method cards loaded.</p>}
    </details>
  );
}
export default function MethodLibrary({
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
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<MethodCard | null>(null);
  const [revision, setRevision] = useState(snapshot.revision);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const guard = (e: Event) => protectNavigation(e, !!draft);
    const unload = (e: BeforeUnloadEvent) => {
      if (draft) {
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
  }, [draft]);
  const edit = (c: MethodCard) => {
    setDraft(c);
    setRevision(snapshot.revision);
    setError("");
  };
  const filtered = cards.filter(
    (c) =>
      (!category || c.category === category) &&
      `${c.title} ${c.body}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className="wb-panel method-library">
      <span className="eyebrow">PRIVATE METHOD LIBRARY</span>
      <h3>Find a prompt for the decision in front of you</h3>
      <p>
        Verified workshop instructions with source references. These are method
        extracts; the embedded capability card deck has not been transcribed.
        Link a card from a case’s Discover tab or an individual design task.
      </p>
      <button
        disabled={!!draft || readOnly}
        onClick={() =>
          edit({
            id: crypto.randomUUID(),
            title: "",
            category: "Team guidance",
            body: "",
            sourceUrl: "",
            version: "Team addition · v1",
          })
        }
      >
        Add method card
      </button>
      {draft && (
        <form
          className="method-editor"
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
          <h4>Edit private method card</h4>
          <p>
            Keep the original source wording or identify your adaptation in the
            version field. Changes affect all linked cases.
          </p>
          <fieldset disabled={busy} className="wb-form-grid">
            {(
              ["title", "category", "body", "sourceUrl", "version"] as const
            ).map((key) => (
              <label className="wb-field" key={key}>
                {
                  {
                    title: "Title",
                    category: "Stage",
                    body: "Wording",
                    sourceUrl: "HTTPS source reference",
                    version: "Version / adaptation",
                  }[key]
                }
                {key === "body" ? (
                  <textarea
                    required
                    value={draft[key]}
                    onChange={(e) =>
                      setDraft({ ...draft, [key]: e.target.value })
                    }
                  />
                ) : (
                  <input
                    required
                    value={draft[key]}
                    onChange={(e) =>
                      setDraft({ ...draft, [key]: e.target.value })
                    }
                  />
                )}
              </label>
            ))}
          </fieldset>
          {error && (
            <p role="alert">
              {error} Your draft is retained. Reopen the latest card before
              reconciling concurrent changes.
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
      <div className="method-search">
        <label className="wb-field">
          Search method cards
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try data, output, cost or ethics"
          />
        </label>
        <label className="wb-field">
          Method stage
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All stages</option>
            {[...new Set(cards.map((c) => c.category))].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <small>
        {filtered.length} of {cards.length} cards
      </small>
      <div className="method-card-grid">
        {(expanded ? filtered : filtered.slice(0, 12)).map((c) => (
          <details key={c.id} className="method-card">
            <summary>
              <span className="eyebrow">{c.category}</span>
              <strong>{c.title}</strong>
            </summary>
            <p>{c.body}</p>
            <small>{c.version}</small>
            {safeSource(c.sourceUrl) && (
              <a href={c.sourceUrl} target="_blank" rel="noreferrer">
                Open source ↗
              </a>
            )}
            <button
              disabled={!!draft || readOnly}
              onClick={() => edit({ ...c })}
            >
              Edit private card
            </button>
            <div className="card-usage">
              {items
                .filter(
                  (w) =>
                    w.cardIds?.includes(c.id) ||
                    w.workDesign?.tasks?.some((t) => t.cardIds?.includes(c.id)),
                )
                .map((w) => (
                  <button
                    disabled={!!draft}
                    key={w.id}
                    onClick={() => {
                      location.hash = `#/workbench/${w.id}/Design`;
                    }}
                  >
                    {w.title} ·{" "}
                    {w.workDesign?.tasks?.filter((t) =>
                      t.cardIds?.includes(c.id),
                    ).length || 0}{" "}
                    linked tasks →
                  </button>
                ))}
            </div>
          </details>
        ))}
      </div>
      {filtered.length > 12 && (
        <button onClick={() => setExpanded(!expanded)}>
          {expanded ? "Show first 12" : `Show all ${filtered.length} cards`}
        </button>
      )}
      {!cards.length && (
        <p>
          Source cards are available only after they have been imported into the
          authenticated workspace.
        </p>
      )}
    </section>
  );
}
