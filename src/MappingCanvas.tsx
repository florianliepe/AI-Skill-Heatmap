import { emptyMapping } from "./method-model";
import type { Mapping } from "./method-model";
import type { WorkItem } from "./workbench-model";

export default function MappingCanvas({
  value,
  items,
  id,
  onChange,
}: {
  value?: Mapping;
  items: WorkItem[];
  id: string;
  onChange: (v: Mapping) => void;
}) {
  const m = { ...emptyMapping(), ...value };
  const put = <K extends keyof Mapping>(key: K, v: Mapping[K]) =>
    onChange({ ...m, [key]: v });
  return (
    <details className="mapping-canvas">
      <summary>
        Mapping & assessment ·{" "}
        {
          [m.dataReadiness, m.humanValue, m.businessViability].filter((v) =>
            v.trim(),
          ).length
        }
        /3 lenses described
      </summary>
      <span className="eyebrow">OPPORTUNITY MAPPING</span>
      <h3>Place the opportunity in its wider system</h3>
      <div className="wb-form-grid">
        <label className="wb-field">
          Selection strategy
          <select
            value={m.strategy}
            onChange={(e) => put("strategy", e.target.value)}
          >
            <option value="">Not selected</option>
            {["Start small", "Shared solution cluster", "North star"].map(
              (x) => (
                <option key={x}>{x}</option>
              ),
            )}
          </select>
        </label>
        <label className="wb-field">
          Shared solution group
          <input
            value={m.sharedSolution}
            onChange={(e) => put("sharedSolution", e.target.value)}
            placeholder="Same underlying solution, not just the same AI category"
          />
        </label>
        {(
          [
            ["pain", "Pain point / core value contribution"],
            [
              "costOfDelay",
              "Cost of waiting",
              "What happens if we do nothing for a year?",
            ],
            [
              "dataReadiness",
              "Technical lens: data and access",
              "Which data, owner, internal/external source, structure, permission and missing access?",
            ],
            [
              "humanValue",
              "Human lens: quality of work",
              "Time, stress, satisfaction, collaboration; who benefits or bears new work?",
            ],
            [
              "businessViability",
              "Business lens: viability",
              "Resources, costs, quality, value and how released capacity will be used.",
            ],
            [
              "costRationale",
              "Implementation cost evidence",
              "Explain relative cost, uncertainty and what is included.",
            ],
          ] as const
        ).map(([key, label, hint]) => (
          <label key={key} className="wb-field">
            {label}
            <textarea
              value={m[key]}
              placeholder={hint}
              onChange={(e) => put(key, e.target.value)}
            />
          </label>
        ))}
        <label className="wb-field">
          Relative implementation cost
          <select
            value={m.implementationCost ?? ""}
            onChange={(e) =>
              put(
                "implementationCost",
                e.target.value ? Number(e.target.value) : null,
              )
            }
          >
            <option value="">Unassessed</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} ·{" "}
                {n === 1 ? "Lowest" : n === 5 ? "Highest" : "Relative cost"}
              </option>
            ))}
          </select>
        </label>
      </div>
      <details>
        <summary>
          Upstream output dependencies · {m.dependencies.length}
        </summary>
        <p>
          Select cases whose outputs this opportunity requires. A dependency
          does not imply shared implementation or additive benefits.
        </p>
        {items
          .filter((w) => w.id !== id)
          .map((w) => (
            <label className="dependency-option" key={w.id}>
              <input
                type="checkbox"
                checked={m.dependencies.includes(w.id)}
                onChange={(e) =>
                  put(
                    "dependencies",
                    e.target.checked
                      ? [...m.dependencies, w.id]
                      : m.dependencies.filter((x) => x !== w.id),
                  )
                }
              />
              {w.title}
            </label>
          ))}
      </details>
    </details>
  );
}
