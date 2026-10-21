import "./card-decks.css";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { MethodCard } from "./method-model";
import { safeSource } from "./method-model";
import { cardCategory, cardClusters, type CardDeck } from "./card-decks";

export default function CardDeckBrowser({
  cards,
  selected = [],
  onChange,
  onEdit,
  initialDeck = "mapping",
}: {
  cards: MethodCard[];
  selected?: string[];
  onChange?: (ids: string[]) => void;
  onEdit?: (card: MethodCard) => void;
  initialDeck?: CardDeck;
}) {
  const [deck, setDeck] = useState<CardDeck>(initialDeck);
  const [cluster, setCluster] = useState<number | null>(null);
  const [category, setCategory] = useState("");
  const [focus, setFocus] = useState<MethodCard | null>(null);
  const [onlySelected, setOnlySelected] = useState(false);
  const close = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  function dismiss() {
    setFocus(null);
    opener.current?.focus();
  }
  useEffect(() => {
    if (focus) close.current?.focus();
  }, [focus]);
  const assessmentDeck =
    cards.length > 0 &&
    cards.every((c) =>
      ["data-card", "resource-card", "risk-card"].includes(c.kind || ""),
    );
  const visible = cards.filter(
    (c) =>
      (!onlySelected || selected.includes(c.id)) &&
      (cluster === null || cardCategory(c).cluster === cluster) &&
      (!category || cardCategory(c).name === category),
  );
  return (
    <div className="deck-browser">
      {!assessmentDeck && (
        <div className="deck-tabs" aria-label="Card decks">
          <button
            type="button"
            aria-pressed={deck === "mapping"}
            onClick={() => setDeck("mapping")}
          >
            <b>A</b> Opportunity Mapping
            <small>Explore capabilities and find opportunities</small>
          </button>
          <button
            type="button"
            aria-pressed={deck === "concept"}
            onClick={() => setDeck("concept")}
          >
            <b>B</b> Concept Development
            <small>Select capabilities for a specific task</small>
          </button>
        </div>
      )}
      <p className="deck-instruction">
        {assessmentDeck
          ? "Choose relevant inputs, resources or controls. Record ownership and evidence in the concept assessment; selection alone does not prove readiness."
          : deck === "mapping"
            ? "Start with a problem. Browse the capability families, then choose cards worth exploring."
            : "Prefer a process task: identify its inputs, desired output, human review and acceptance test. A selected card is a design candidate, not proven feasibility."}
      </p>
      <div className="deck-clusters" aria-label="Capability clusters">
        <button
          type="button"
          aria-pressed={cluster === null}
          onClick={() => {
            setCluster(null);
            setCategory("");
          }}
        >
          All clusters <strong>{cards.length}</strong>
        </button>
        {cardClusters.map((name, i) => {
          const count = cards.filter(
            (c) => cardCategory(c).cluster === i,
          ).length;
          return (
            count > 0 && (
              <button
                type="button"
                key={name}
                aria-pressed={cluster === i}
                onClick={() => {
                  setCluster(i);
                  setCategory("");
                }}
              >
                {name}
                <strong>{count}</strong>
              </button>
            )
          );
        })}
      </div>
      <div className="deck-category-strip">
        <button
          type="button"
          aria-pressed={!category}
          onClick={() => setCategory("")}
        >
          All families
        </button>
        {[
          ...new Set(
            cards
              .filter(
                (c) => cluster === null || cardCategory(c).cluster === cluster,
              )
              .map((c) => cardCategory(c).name),
          ),
        ].map((name) => {
          const meta = cardCategory(
            cards.find((c) => cardCategory(c).name === name)!,
          );
          return (
            <button
              type="button"
              key={name}
              aria-pressed={category === name}
              onClick={() => setCategory(category === name ? "" : name)}
            >
              <i style={{ background: meta.color }} />
              {meta.code} · {name}{" "}
              <small>
                {cards.filter((c) => cardCategory(c).name === name).length}
              </small>
            </button>
          );
        })}
      </div>
      {onChange && (
        <label className="deck-selected-filter">
          <input
            type="checkbox"
            checked={onlySelected}
            onChange={(e) => setOnlySelected(e.target.checked)}
          />{" "}
          Selected only · {selected.length} linked to this target
        </label>
      )}
      {cardClusters.map((name, i) => {
        const group = visible.filter((c) => cardCategory(c).cluster === i);
        return (
          group.length > 0 && (
            <section className="deck-cluster-section" key={name}>
              <h4>
                {name} <span>{group.length} cards</span>
              </h4>
              <div className="deck-card-grid">
                {group.map((c) => {
                  const meta = cardCategory(c);
                  return (
                    <article
                      key={c.id}
                      className={`deck-card ${selected.includes(c.id) ? "is-selected" : ""}`}
                      style={{ "--card-color": meta.color } as CSSProperties}
                    >
                      <span className="deck-family">
                        {meta.code} · {meta.name}
                      </span>
                      <strong>{c.title}</strong>
                      {deck === "concept" && (
                        <p className="deck-brief">
                          {c.explanation ||
                            "Define the required input, output and evidence for this capability."}
                        </p>
                      )}
                      <div className="deck-card-actions">
                        {onChange && (
                          <label>
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
                            {selected.includes(c.id) ? "Selected" : "Select"}
                          </label>
                        )}
                        <button
                          type="button"
                          aria-label={`Details: ${c.title}`}
                          onClick={(e) => {
                            opener.current = e.currentTarget;
                            setFocus(c);
                          }}
                        >
                          Details →
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )
        );
      })}
      {!visible.length && <p>No cards match these filters.</p>}
      {focus && (
        <aside
          className="deck-detail-panel"
          role="region"
          aria-label="Card details"
          onKeyDown={(e) => {
            if (e.key === "Escape") dismiss();
          }}
        >
          <button
            type="button"
            ref={close}
            className="deck-detail-close"
            onClick={dismiss}
          >
            Close details ×
          </button>
          <span className="eyebrow">{cardCategory(focus).name}</span>
          <h3>{focus.title}</h3>
          <h4>Studio explanation · interpretation</h4>
          <p>{focus.explanation || "No explanation recorded."}</p>
          <h4>Side 1 · original wording</h4>
          <p className="deck-source">{focus.body || "Not available"}</p>
          <h4>Side 2 · original wording</h4>
          <p className="deck-source">
            {focus.backText ||
              "Reverse not supplied in this source. No content inferred."}
          </p>
          <small>{focus.version}</small>
          <p>
            {safeSource(focus.sourceUrl) && (
              <a href={focus.sourceUrl} target="_blank" rel="noreferrer">
                Front source ↗
              </a>
            )}{" "}
            {focus.backSourceUrl && safeSource(focus.backSourceUrl) && (
              <a href={focus.backSourceUrl} target="_blank" rel="noreferrer">
                Reverse source ↗
              </a>
            )}
          </p>
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onEdit(focus);
                dismiss();
              }}
            >
              Edit / plan next action
            </button>
          )}
        </aside>
      )}
    </div>
  );
}
