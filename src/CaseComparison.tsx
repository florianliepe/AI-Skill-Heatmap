import { useState, useEffect, useRef } from "react";
import type { WorkItem } from "./workbench-model";
import {
  displayNumber,
  pilotGaps,
  processSummary,
  scenarioValue,
} from "./redesign-model";
import { ProcessMap } from "./ProcessStudio";
export default function CaseComparison({
  items,
  selection,
  onSelection,
  onOpen,
  focus,
  onFocus,
}: {
  focus: string;
  onFocus: (id: string) => void;
  items: WorkItem[];
  selection: string[];
  onSelection: (s: string[]) => void;
  onOpen: (w: WorkItem, section?: string) => void;
}) {
  const [scenario, setScenario] = useState<"low" | "base" | "high">("base");
  const setFocus = onFocus;
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focus)
      panel.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focus]);
  const [differences, setDifferences] = useState(false);
  const cases = items.filter(
    (w) => w.kind === "usecase" && w.stage !== "Archived",
  );
  const chosen = cases.filter((w) => selection.includes(w.id));
  const detail = cases.find((w) => w.id === focus);
  const rows: { label: string; get: (w: WorkItem) => string }[] = [
    { label: "Business outcome", get: (w) => w.valueIntent },
    { label: "Impact / 5", get: (w) => displayNumber(w.impact) },
    {
      label: "Feasibility / 5",
      get: (w) => displayNumber(w.feasibility?.score),
    },
    {
      label: "Relative cost / 5",
      get: (w) => displayNumber(w.mapping?.implementationCost),
    },
    { label: "Evidence", get: (w) => w.evidence },
    { label: "Owner", get: (w) => w.owner || "Unassigned" },
    {
      label: "Pilot prerequisites",
      get: (w) =>
        pilotGaps(w).length
          ? `${pilotGaps(w).length} gaps`
          : "Documented · not approved",
    },
    {
      label: "Released hours / year",
      get: (w) => displayNumber(scenarioValue(w, scenario)?.hours),
    },
    {
      label: "First-year net cash (€)",
      get: (w) => displayNumber(scenarioValue(w, scenario)?.firstYear),
    },
    {
      label: "Proposed active effort (min)",
      get: (w) =>
        displayNumber(processSummary(w.workDesign?.tasks || []).processing),
    },
    {
      label: "Proposed waiting (min)",
      get: (w) =>
        displayNumber(processSummary(w.workDesign?.tasks || []).waiting),
    },
    { label: "Shared benefit group", get: (w) => w.overlap || "Not assessed" },
    {
      label: "Dependencies",
      get: (w) => displayNumber(w.mapping?.dependencies?.length),
    },
    { label: "Next action", get: (w) => w.nextAction || "Not assigned" },
  ];
  return (
    <section className="wb-panel case-comparison">
      <span className="eyebrow">DIRECT USE-CASE COMPARISON</span>
      <h3>Compare the next decision, side by side</h3>
      <p>
        Select up to three use cases here. Estimates use the same scenario lens;
        missing scenarios remain unknown. Benefits are not summed.
      </p>
      <div className="comparison-selectors">
        {cases.map((w) => (
          <label key={w.id}>
            <input
              type="checkbox"
              checked={selection.includes(w.id)}
              disabled={!selection.includes(w.id) && chosen.length >= 3}
              onChange={(e) =>
                onSelection(
                  e.target.checked
                    ? [...selection, w.id]
                    : selection.filter((id) => id !== w.id),
                )
              }
            />
            {w.title}
          </label>
        ))}
      </div>
      <div className="redesign-toolbar">
        <label>
          Value scenario
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value as typeof scenario)}
          >
            <option value="low">Low</option>
            <option value="base">Base</option>
            <option value="high">High</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={differences}
            onChange={(e) => setDifferences(e.target.checked)}
          />{" "}
          Differences only
        </label>
      </div>
      {chosen.length ? (
        <div className="comparison-table-wrap">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Decision criterion</th>
                {chosen.map((w) => (
                  <th key={w.id}>
                    <button type="button" onClick={() => setFocus(w.id)}>
                      {w.title} →
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows
                .filter(
                  (r) => !differences || new Set(chosen.map(r.get)).size > 1,
                )
                .map((r) => (
                  <tr key={r.label}>
                    <th>{r.label}</th>
                    {chosen.map((w) => (
                      <td key={w.id}>{r.get(w)}</td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="process-empty">
          Choose use cases to compare their value, readiness and process design.
        </p>
      )}
      <div className="readiness-trays">
        <section>
          <h4>Needs assessment</h4>
          {cases
            .filter((w) => w.impact === null || !w.feasibility?.score)
            .map((w) => (
              <button key={w.id} onClick={() => setFocus(w.id)}>
                {w.title} · assess →
              </button>
            ))}
        </section>
        <section>
          <h4>Pilot prerequisites missing</h4>
          {cases
            .filter(
              (w) =>
                w.impact !== null &&
                w.feasibility?.score &&
                pilotGaps(w).length,
            )
            .map((w) => (
              <button key={w.id} onClick={() => setFocus(w.id)}>
                {w.title} · {pilotGaps(w).length} gaps →
              </button>
            ))}
        </section>
      </div>
      {detail && (
        <div className="comparison-inspector" ref={panel}>
          <div className="section-heading">
            <h4>{detail.title}</h4>
            <button onClick={() => setFocus("")}>
              Close comparison details
            </button>
          </div>
          <p>
            <b>{detail.evidence}</b> ·{" "}
            {detail.evidenceNote || "No assessment evidence"}
          </p>
          <p>{detail.feasibility?.risks || "Risks not assessed"}</p>
          <h4>Resolve before pilot</h4>
          {pilotGaps(detail).length ? (
            <ul>
              {pilotGaps(detail).map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          ) : (
            <p>
              Required information documented; approval remains a separate
              decision.
            </p>
          )}
          <ProcessMap
            tasks={detail.workDesign?.tasks || []}
            baseline={detail.workDesign?.currentTasks || []}
          />
          <div className="redesign-toolbar">
            <button onClick={() => onOpen(detail, "Design")}>
              Edit concept
            </button>
            <button onClick={() => onOpen(detail, "Prioritize pilot")}>
              Resolve pilot gaps
            </button>
            <button onClick={() => onOpen(detail, "Estimate value")}>
              Inspect value assumptions
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
