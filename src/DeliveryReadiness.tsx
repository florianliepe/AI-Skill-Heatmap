import { ArrowUpRight, Layers, Workflow, Users } from "lucide-react";
import type { WorkItem } from "./workbench-model";
import { deliveryCoverage } from "./sprint-model";
export default function DeliveryReadiness({
  items,
  onOpen,
}: {
  items: WorkItem[];
  onOpen: (w: WorkItem) => void;
}) {
  const icons = [Layers, Workflow, Users];
  return (
    <section className="delivery-readiness">
      <div className="section-heading">
        <div>
          <span className="eyebrow">CONNECTED DELIVERABLES</span>
          <h3>Turn workshop outputs into a target picture</h3>
          <p>
            Coverage across filtered, non-archived use cases. Completeness is
            not approval or proof of effectiveness.
          </p>
        </div>
      </div>
      <div className="delivery-grid">
        {deliveryCoverage(items).map((d, i) => {
          const Icon = icons[i];
          return (
            <article key={d.id}>
              <Icon size={28} />
              <h3>{d.title}</h3>
              <div className="delivery-score">
                <strong>{d.covered}</strong>
                <span>/ {d.total} cases connected</span>
              </div>
              <div className="progress-track">
                <span
                  style={{
                    width: d.total ? `${(100 * d.covered) / d.total}%` : "0%",
                  }}
                />
              </div>
              <p>{d.missing}.</p>
              {!d.total ? (
                <p className="wb-help">No use cases in this selection.</p>
              ) : !d.gaps.length ? (
                <p className="sprint-covered">
                  All selected cases have the required connections. Review their
                  quality with the team.
                </p>
              ) : (
                <div className="delivery-gaps">
                  {d.gaps.slice(0, 6).map((w) => (
                    <button key={w.id} onClick={() => onOpen(w)}>
                      {w.title}
                      <ArrowUpRight size={15} />
                    </button>
                  ))}
                  {d.gaps.length > 6 && (
                    <small>
                      {d.gaps.length - 6} more cases need attention; use filters
                      to narrow the selection.
                    </small>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
