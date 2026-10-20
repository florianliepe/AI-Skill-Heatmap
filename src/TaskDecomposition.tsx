import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { newTask, taskGaps, taskModes, type DesignTask } from "./sprint-model";
import { CardPicker } from "./MethodLibrary";
import type { MethodCard } from "./method-model";

export default function TaskDecomposition({
  tasks,
  onChange,
  cards = [],
}: {
  tasks: DesignTask[];
  cards?: MethodCard[];
  onChange: (tasks: DesignTask[]) => void;
}) {
  const update = (id: string, key: keyof DesignTask, value: string) =>
    onChange(tasks.map((t) => (t.id === id ? { ...t, [key]: value } : t)));
  function move(index: number, delta: number) {
    const next = [...tasks];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    onChange(next);
  }
  return (
    <section className="task-decomposition">
      <div className="section-heading">
        <div>
          <span className="eyebrow">TASK DECOMPOSITION</span>
          <h3>Design one handover at a time</h3>
        </div>
        <button
          disabled={tasks.length >= 30}
          onClick={() => onChange([...tasks, newTask()])}
        >
          <Plus size={16} /> Add task
        </button>
      </div>
      <p>
        Choose up to two focal process steps. Start with the desired output,
        then work backward through input, transformation, review and handover.
        Break the use case into an ordered sequence. Choose human work,
        deterministic automation or AI for each task. Describe branches in the
        exception field; this plan does not execute a workflow.
      </p>
      <div className="task-summary">
        <strong>
          {tasks.filter((t) => !taskGaps(t).length).length} / {tasks.length}{" "}
          tasks described
        </strong>
        <span>Coverage of required fields, not feasibility or approval</span>
      </div>
      {!tasks.length && (
        <div className="task-empty">
          Start with a concrete verb: receive a request, check its sources,
          clarify a gap, draft an output, or approve a handover. Add up to 30
          tasks.
        </div>
      )}
      {tasks.length > 0 && (
        <ol className="task-flow" aria-label="Task sequence">
          {tasks.map((t, i) => (
            <li key={t.id}>
              <span>{i + 1}</span>
              <div>
                <strong>{t.title || "Untitled task"}</strong>
                <small>
                  {t.mode} · {t.owner || "Owner missing"}
                </small>
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className="task-editors">
        {tasks.map((t, i) => (
          <details className="task-editor" key={t.id} open>
            <summary>
              Task {i + 1} · {t.title || "Untitled task"}
              <span>
                {taskGaps(t).length
                  ? `${taskGaps(t).length} fields missing`
                  : "Described"}
              </span>
            </summary>
            <div className="task-toolbar">
              <CardPicker
                cards={cards}
                selected={t.cardIds || []}
                onChange={(ids) =>
                  onChange(
                    tasks.map((task) =>
                      task.id === t.id ? { ...task, cardIds: ids } : task,
                    ),
                  )
                }
              />
              <button
                disabled={i === 0}
                aria-label={`Move task ${i + 1} up`}
                onClick={() => move(i, -1)}
              >
                <ArrowUp size={15} /> Up
              </button>
              <button
                disabled={i === tasks.length - 1}
                aria-label={`Move task ${i + 1} down`}
                onClick={() => move(i, 1)}
              >
                <ArrowDown size={15} /> Down
              </button>
              <button
                aria-label={`Remove task ${i + 1}`}
                onClick={() => onChange(tasks.filter((x) => x.id !== t.id))}
              >
                <Trash2 size={15} /> Remove from draft
              </button>
            </div>
            <div className="wb-form-grid">
              <label className="wb-field">
                Task {i + 1} name
                <input
                  maxLength={4000}
                  value={t.title}
                  onChange={(e) => update(t.id, "title", e.target.value)}
                />
              </label>
              <label className="wb-field">
                Task {i + 1} execution mode
                <select
                  value={t.mode}
                  onChange={(e) => update(t.id, "mode", e.target.value)}
                >
                  {taskModes.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>
              {(
                [
                  ["input", "Input and source"],
                  ["output", "Output / next handover"],
                  ["owner", "Accountable role"],
                  ["acceptance", "Acceptance check"],
                  ["exception", "Exception, fallback or stop rule"],
                  ["cardReference", "AI card reference (optional)"],
                ] as const
              ).map(([key, label]) => (
                <label className="wb-field" key={key}>
                  Task {i + 1} {label}
                  <textarea
                    rows={2}
                    maxLength={4000}
                    value={t[key]}
                    onChange={(e) => update(t.id, key, e.target.value)}
                  />
                </label>
              ))}
            </div>
          </details>
        ))}
      </div>
      <small>
        Edits, ordering and removals remain in your draft until you save the use
        case. Card references are notes; they do not imply a verified card
        import.
      </small>
    </section>
  );
}
