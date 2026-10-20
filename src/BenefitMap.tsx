import { useState } from "react";
import type { WorkItem } from "./workbench-model";
export function costMapReady(w: WorkItem) {
  return (
    w.impact != null &&
    w.mapping?.implementationCost != null &&
    !!w.evidenceNote.trim() &&
    !!w.mapping.costRationale.trim()
  );
}
export default function BenefitMap({
  items,
  onOpen,
}: {
  items: WorkItem[];
  onOpen: (w: WorkItem) => void;
}) {
  const [strategy, setStrategy] = useState("");
  const active = items.filter(
    (w) =>
      w.stage !== "Archived" && (!strategy || w.mapping?.strategy === strategy),
  );
  const assessed = active.filter(costMapReady);
  const unknown = active.filter((w) => !costMapReady(w));
  return (
    <section className="wb-panel benefit-map">
      <span className="eyebrow">PORTFOLIO CHOICES</span>
      <h3>Where is the benefit worth the cost?</h3>
      <p>
        Qualitative business impact versus relative implementation cost. Scores
        require supporting notes. This comparison does not measure ROI or
        replace feasibility review.
      </p>
      <label className="wb-field">
        Selection strategy
        <select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
          <option value="">All strategies</option>
          {["Start small", "Shared solution cluster", "North star"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </label>
      <div className="benefit-scroll">
        <div
          className="benefit-grid"
          role="table"
          aria-label="Business impact versus implementation cost"
        >
          <div className="map-axis">Impact ↑</div>
          {[1, 2, 3, 4, 5].map((n) => (
            <div className="map-axis" key={n}>
              Cost {n}
              <small>{n === 1 ? "Lowest" : n === 5 ? "Highest" : ""}</small>
            </div>
          ))}
          {[5, 4, 3, 2, 1].map((impact) => (
            <div className="benefit-row" role="row" key={impact}>
              <div className="map-axis">Impact {impact}</div>
              {[1, 2, 3, 4, 5].map((cost) => {
                const matches = assessed.filter(
                  (w) =>
                    w.impact === impact &&
                    w.mapping?.implementationCost === cost,
                );
                return (
                  <div
                    role="cell"
                    key={cost}
                    className={`benefit-cell ${impact >= 4 && cost <= 2 ? "favorable" : ""}`}
                  >
                    {matches.map((w) => (
                      <button key={w.id} onClick={() => onOpen(w)}>
                        {w.title}
                        <small>{w.mapping?.sharedSolution || w.kind}</small>
                      </button>
                    ))}
                    {!matches.length && (
                      <span aria-label="No opportunities">—</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mapping-unknown">
        <strong>Unassessed · {unknown.length}</strong>
        <p>
          Needs impact, cost and both supporting notes. Missing data is never
          plotted as zero.
        </p>
        {unknown.map((w) => (
          <button key={w.id} onClick={() => onOpen(w)}>
            {w.title} →
          </button>
        ))}
      </div>
      <details>
        <summary>Shared solutions & output dependencies</summary>
        {active
          .filter(
            (w) => w.mapping?.sharedSolution || w.mapping?.dependencies.length,
          )
          .map((w) => (
            <article className="dependency-line" key={w.id}>
              <button onClick={() => onOpen(w)}>{w.title}</button>
              <span>Solution group: {w.mapping?.sharedSolution || "None"}</span>
              <span>
                Requires outputs from:{" "}
                {w.mapping?.dependencies
                  .map(
                    (id) =>
                      items.find((x) => x.id === id)?.title ||
                      "Outside current filter",
                  )
                  .join(", ") || "None recorded"}
              </span>
            </article>
          ))}
        <p>
          Review overlapping benefits before aggregating a cluster. Arrows
          describe required outputs, not an execution order.
        </p>
      </details>
    </section>
  );
}
