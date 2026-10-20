import { useState } from "react";
import type { MethodCard } from "./method-model";
import { safeSource, cardCoverage, cardSearchText } from "./method-model";

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
      <summary>Link AI & method cards · {selected.length} selected</summary>
      <label className="wb-field">
        Find a card
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search both sides or explanation"
        />
      </label>
      <div className="method-picker-list">
        {cards
          .filter(
            (c) =>
              selected.includes(c.id) ||
              cardSearchText(c).includes(query.toLowerCase()),
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
                  {c.category} · {c.version} · {cardCoverage(c)}
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
            {c.backText && (
              <>
                <h4>Reverse side</h4>
                <p style={{ whiteSpace: "pre-line" }}>{c.backText}</p>
              </>
            )}
            {c.explanation && (
              <>
                <h4>Studio explanation</h4>
                <p>{c.explanation}</p>
              </>
            )}
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
