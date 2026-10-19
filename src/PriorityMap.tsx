import type { WorkItem } from "./workbench-model";
export function priorityPosition(w: WorkItem) {
  const f = w.feasibility;
  if (
    w.kind !== "usecase" ||
    w.stage === "Archived" ||
    w.impact === null ||
    !w.evidenceNote.trim() ||
    !f?.score ||
    !f.rationale.trim() ||
    !f.risks.trim()
  )
    return null;
  return { impact: w.impact, feasibility: f.score };
}
export function FeasibilityEditor({
  value,
  onChange,
}: {
  value: WorkItem["feasibility"];
  onChange: (v: NonNullable<WorkItem["feasibility"]>) => void;
}) {
  const v = value || { score: null, rationale: "", risks: "" };
  return (
    <section className="feasibility-editor">
      <span className="eyebrow">PRIORITIZATION ASSESSMENT</span>
      <h3>Is a bounded pilot practical?</h3>
      <p>
        Use the business-impact score from Discover alongside feasibility. Keep
        benefit estimates, risks and evidence visible; a high score is not an
        approval.
      </p>
      <label className="wb-field">
        Pilot feasibility
        <select
          value={v.score ?? ""}
          onChange={(e) =>
            onChange({
              ...v,
              score: e.target.value ? Number(e.target.value) : null,
            })
          }
        >
          <option value="">Not assessed</option>
          <option value="1">1 · Major unresolved dependencies</option>
          <option value="2">2 · Significant preparation needed</option>
          <option value="3">3 · Plausible with known gaps</option>
          <option value="4">4 · Most prerequisites tested</option>
          <option value="5">5 · Pilot prerequisites demonstrated</option>
        </select>
      </label>
      <div className="wb-form-grid">
        <label className="wb-field">
          Feasibility evidence and assumptions
          <textarea
            maxLength={12000}
            rows={3}
            value={v.rationale}
            onChange={(e) => onChange({ ...v, rationale: e.target.value })}
          />
        </label>
        <label className="wb-field">
          Risks, constraints and dependencies
          <textarea
            maxLength={12000}
            rows={3}
            value={v.risks}
            onChange={(e) => onChange({ ...v, risks: e.target.value })}
          />
        </label>
      </div>
      <small>
        Consider data access, integration, evaluation, human capacity and
        operating cost. If no risks are known, record what was checked rather
        than leaving the field blank.
      </small>
    </section>
  );
}
export default function PriorityMap({
  items,
  onOpen,
}: {
  items: WorkItem[];
  onOpen: (w: WorkItem) => void;
}) {
  const cases = items.filter(
    (w) => w.kind === "usecase" && w.stage !== "Archived",
  );
  const assessed = cases.filter((w) => priorityPosition(w));
  const unknown = cases.filter((w) => !priorityPosition(w));
  return (
    <section className="priority-map wb-panel">
      <span className="eyebrow">PILOT SHORTLIST</span>
      <h3>Compare value with feasibility</h3>
      <p>
        {assessed.length} of {cases.length} active use cases in the current
        filters have both scores and supporting notes. Select a case to inspect
        its pilot plan.
      </p>
      <div className="table-wrap">
        <table className="priority-matrix">
          <caption>
            Business impact (rows) × pilot feasibility (columns) · 1 low, 5 high
            · counts are not benefit totals
          </caption>
          <thead>
            <tr>
              <th scope="col">Impact ↓ / Feasibility →</th>
              {[1, 2, 3, 4, 5].map((n) => (
                <th scope="col" key={n}>
                  {n}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[5, 4, 3, 2, 1].map((impact) => (
              <tr key={impact}>
                <th scope="row">{impact}</th>
                {[1, 2, 3, 4, 5].map((feasibility) => {
                  const matches = assessed.filter(
                    (w) =>
                      w.impact === impact &&
                      w.feasibility?.score === feasibility,
                  );
                  return (
                    <td
                      key={feasibility}
                      className={matches.length ? "populated" : ""}
                    >
                      <small>
                        {matches.length
                          ? `${matches.length} case${matches.length > 1 ? "s" : ""}`
                          : "—"}
                      </small>
                      {matches.map((w) => (
                        <button key={w.id} onClick={() => onOpen(w)}>
                          {w.title}
                          <small>{w.evidence}</small>
                        </button>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="priority-unknown">
        <strong>Needs assessment · {unknown.length}</strong>
        <p>
          Missing scores, impact evidence, feasibility rationale or risk notes.
          These cases are not assigned a low score.
        </p>
        {unknown.map((w) => (
          <button key={w.id} onClick={() => onOpen(w)}>
            {w.title}
          </button>
        ))}
      </div>
      <p className="wb-help">
        Use this map for discussion. Review non-AI alternatives and task-level
        failure modes, then record an owner, rationale and next experiment in
        the decision history. No automatic ranking or approval.
      </p>
    </section>
  );
}
