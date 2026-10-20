import { useState } from "react";
import type { MethodCard } from "./method-model";
import { cardSearchText } from "./method-model";
import CardDeckBrowser from "./CardDeckBrowser";
import type { CardDeck } from "./card-decks";

export function CardPicker({
  cards,
  selected,
  onChange,
  deck = "concept",
}: {
  cards: MethodCard[];
  selected: string[];
  onChange: (ids: string[]) => void;
  deck?: CardDeck;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  return (
    <section className="method-picker">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
        Choose AI cards · {selected.length} selected
      </button>
      {open && (
        <>
          <label className="wb-field">
            Search cards
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search both sides or explanation"
            />
          </label>
          <CardDeckBrowser
            cards={cards.filter((c) =>
              cardSearchText(c).includes(query.toLowerCase()),
            )}
            selected={selected}
            onChange={onChange}
            initialDeck={deck}
          />
          <p>
            Selections are saved with this use case or task when you save the
            workbench record.
          </p>
        </>
      )}
    </section>
  );
}
