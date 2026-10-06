import {
  ArrowRight,
  Database,
  UserCheck,
  Sparkles,
  PackageCheck,
} from "lucide-react";
import { emptyDesign, type WorkDesign } from "./sprint-model";
export default function WorkDesignCanvas({
  value,
  onChange,
}: {
  value?: WorkDesign;
  onChange: (v: WorkDesign) => void;
}) {
  const d = { ...emptyDesign(), ...value };
  const flow = [
    { key: "input", title: "Input & context", icon: Database },
    { key: "aiTask", title: "AI contribution", icon: Sparkles },
    { key: "humanJudgment", title: "Human judgment", icon: UserCheck },
    { key: "output", title: "Accepted output", icon: PackageCheck },
  ] as const;
  return (
    <section className="work-design">
      <span className="eyebrow">HUMAN–AI WORKING APPROACH</span>
      <h3>Make the handover explicit</h3>
      <p>
        Describe the work before choosing tools. This is a design view; no
        workflow is executed.
      </p>
      <label className="wb-field">
        Level of AI involvement
        <select
          value={d.autonomy}
          onChange={(e) => onChange({ ...d, autonomy: e.target.value })}
        >
          {["AI supported", "AI augmented", "Agentic"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </label>
      <p className="sprint-autonomy">
        {d.autonomy === "AI supported"
          ? "People execute the process; AI assists an individual task."
          : d.autonomy === "AI augmented"
            ? "AI connects several tasks; people review the proposed output and manage exceptions."
            : "An agent can coordinate bounded steps. Define approval points, permitted tools and stop conditions before a pilot."}
      </p>
      <div className="work-design-flow" aria-label="Proposed workflow">
        {flow.map(({ key, title, icon: Icon }, i) => (
          <div className="work-design-step" key={key}>
            <span>
              <Icon size={18} />
              {title}
            </span>
            <p>{d[key] || "Not defined yet"}</p>
            {i < 3 && <ArrowRight className="work-design-arrow" size={19} />}
          </div>
        ))}
      </div>
      <div className="wb-form-grid">
        {(
          [
            "currentWork",
            "input",
            "aiTask",
            "humanJudgment",
            "handover",
            "output",
            "tools",
          ] as const
        ).map((k) => (
          <label key={k} className="wb-field">
            {
              {
                currentWork: "Current task / process",
                input: "Input data and trusted sources",
                aiTask: "AI task and its limits",
                humanJudgment: "Human judgment and accountable role",
                handover: "Handover, exceptions and stop condition",
                output: "Output and acceptance criteria",
                tools: "Tools, services and access required",
              }[k]
            }
            <textarea
              rows={3}
              value={d[k]}
              onChange={(e) => onChange({ ...d, [k]: e.target.value })}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
