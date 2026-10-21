import { useState } from "react";
import { valueModel, type WorkItem, type Economics } from "./workbench-model";
import { displayNumber, scenarioEconomics } from "./redesign-model";
const fields: [keyof Economics, string][] = [
  ["volume", "Eligible cases / year"],
  ["adoption", "Adoption (%)"],
  ["baseline", "Baseline handling (min/case)"],
  ["assisted", "Assisted handling (min/case)"],
  ["review", "Incremental review & exceptions (min/case)"],
  ["rate", "Loaded rate (EUR/hour)"],
  ["realization", "Cash realization (%)"],
  ["recurring", "Recurring operating cost (EUR/year)"],
  ["setup", "Implementation cost (EUR)"],
];
const blank = () =>
  Object.fromEntries(fields.map(([k]) => [k, null])) as Economics;
export function CashBridge({ economics }: { economics: Economics }) {
  const v = valueModel(economics);
  if (v.cash === null || v.net === null || v.firstYear === null)
    return (
      <p className="process-empty">
        Complete the cash assumptions to show the benefit bridge. Unknown costs
        are not treated as zero.
      </p>
    );
  const bars = [
    { name: "Cash benefit", from: 0, to: v.cash },
    { name: "Operating costs", from: v.cash, to: v.net },
    { name: "Setup costs", from: v.net, to: v.firstYear },
    { name: "First-year net", from: 0, to: v.firstYear },
  ];
  const lo = Math.min(0, ...bars.flatMap((b) => [b.from, b.to])),
    hi = Math.max(1, ...bars.flatMap((b) => [b.from, b.to]));
  const y = (n: number) => 35 + ((hi - n) / (hi - lo)) * 150;
  return (
    <figure className="cash-bridge">
      <svg
        viewBox="0 0 760 250"
        role="img"
        aria-label="First-year cash benefit minus recurring and implementation costs"
      >
        <line x1="15" x2="745" y1={y(0)} y2={y(0)} stroke="#b7ada5" />
        {bars.map((b, i) => (
          <g key={b.name}>
            <rect
              x={i * 185 + 30}
              y={Math.min(y(b.from), y(b.to))}
              width="115"
              height={Math.max(2, Math.abs(y(b.from) - y(b.to)))}
              fill={i === 0 ? "#393632" : i === 3 ? "#ff642d" : "#b2a298"}
            />
            <text
              x={i * 185 + 88}
              y={Math.min(y(b.from), y(b.to)) - 9}
              textAnchor="middle"
            >
              {displayNumber(b.to - b.from, "€")}
            </text>
            <text x={i * 185 + 88} y="220" textAnchor="middle">
              {b.name}
            </text>
          </g>
        ))}
      </svg>
      <figcaption>
        Cash bridge · first-year estimate. Capacity value is separate and is
        never added to cash benefits.
      </figcaption>
    </figure>
  );
}
export default function ValueScenarios({
  item,
  onChange,
}: {
  item: WorkItem;
  onChange: (next: WorkItem) => void;
}) {
  const [active, setActive] = useState<"low" | "base" | "high">("base");
  const e = scenarioEconomics(item, active);
  const v = e ? valueModel(e) : null;
  function set(next: Economics) {
    onChange(
      active === "base"
        ? { ...item, economics: next }
        : {
            ...item,
            valueScenarios: { ...item.valueScenarios, [active]: next },
          },
    );
  }
  const scenarios = ["low", "base", "high"] as const;
  const values = scenarios.map((s) => {
    const e = scenarioEconomics(item, s);
    return e ? valueModel(e) : null;
  });
  const reversed =
    (values[0]?.firstYear != null &&
      values[1]?.firstYear != null &&
      values[0].firstYear > values[1].firstYear) ||
    (values[2]?.firstYear != null &&
      values[1]?.firstYear != null &&
      values[2].firstYear < values[1].firstYear);
  return (
    <section className="value-scenarios">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            VALUE SCENARIOS · EDITABLE ASSUMPTIONS
          </span>
          <h3>Compare low, base and high outcomes</h3>
        </div>
      </div>
      <p>
        Independent full-year assumptions, not measured results or probability
        forecasts. Include review and exception handling once. Keep quality and
        service outcomes in the pilot measures.
      </p>
      <div className="comparison-table-wrap">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Annual outcome</th>
              {scenarios.map((s) => (
                <th key={s}>
                  <button
                    type="button"
                    aria-pressed={active === s}
                    onClick={() => setActive(s)}
                  >
                    {s[0].toUpperCase() + s.slice(1)} assumptions
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(["hours", "capacity", "cash", "net", "firstYear"] as const).map(
              (k) => (
                <tr key={k}>
                  <th>
                    {
                      {
                        hours: "Released capacity (hours)",
                        capacity: "Capacity valuation (€)",
                        cash: "Cashable labour benefit (€)",
                        net: "Net recurring cash (€)",
                        firstYear: "First-year net cash (€)",
                      }[k]
                    }
                  </th>
                  {values.map((v, i) => (
                    <td key={i}>{displayNumber(v?.[k])}</td>
                  ))}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
      {reversed && (
        <p role="status" className="scenario-warning">
          Scenario ordering is unusual: low exceeds base or high falls below
          base. Review the assumptions; values have not been reordered.
        </p>
      )}
      <h4>Edit {active} assumptions</h4>
      {!e ? (
        <div className="process-empty">
          <p>This scenario has not been estimated.</p>
          <button type="button" onClick={() => set(blank())}>
            Start with unknown values
          </button>
          <button
            type="button"
            onClick={() => set(structuredClone(item.economics))}
          >
            Copy base assumptions, then adjust
          </button>
        </div>
      ) : (
        <>
          <div className="wb-form-grid">
            {fields.map(([k, label]) => (
              <label className="wb-field" key={k}>
                {label}
                <input
                  type="number"
                  min="0"
                  max={k === "adoption" || k === "realization" ? 100 : 1e12}
                  value={e[k] ?? ""}
                  placeholder="Unknown"
                  onChange={(ev) =>
                    set({
                      ...e,
                      [k]:
                        ev.target.value === "" ? null : Number(ev.target.value),
                    })
                  }
                />
              </label>
            ))}
          </div>
          <CashBridge economics={e} />
          <p className="redesign-note">
            Released hours = annual cases × adoption / 100 × (baseline −
            assisted − review) / 60. Cash = hours × loaded rate × cash
            realization / 100. Net recurring cash deducts operating costs;
            first-year net also deducts setup. Negative outcomes remain visible.
            Payback: {displayNumber(v?.payback, "years")} at steady-state
            adoption.
          </p>
        </>
      )}
    </section>
  );
}
