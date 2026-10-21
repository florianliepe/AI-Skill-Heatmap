import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  newTask,
  taskGaps,
  taskModes,
  type DesignTask,
  type WorkDesign,
} from "./sprint-model";
import type { MethodCard } from "./method-model";
import { CardPicker } from "./MethodLibrary";
import {
  displayNumber,
  metricLabels,
  processMetrics,
  processSummary,
  redesignActions,
  taskChange,
  type ProcessMetric,
} from "./redesign-model";
import "./redesign.css";

export function ProcessMap({
  tasks,
  baseline = [],
  selected,
  onSelect,
  overlay = "none",
}: {
  tasks: DesignTask[];
  baseline?: DesignTask[];
  selected?: string;
  onSelect?: (id: string) => void;
  overlay?: ProcessMetric | "none";
}) {
  const lanes = [
    ...new Set(tasks.map((t) => t.lane || t.owner || "Unassigned")),
  ];
  const max =
    overlay === "none" ? 0 : Math.max(0, ...tasks.map((t) => t[overlay] ?? 0));
  return (
    <div
      className="process-scroll"
      tabIndex={0}
      aria-label="Ordered process swimlanes"
    >
      {!tasks.length ? (
        <p className="process-empty">
          No steps recorded. Add a task or explicitly copy an existing process.
        </p>
      ) : (
        <div
          className="process-grid"
          style={{
            gridTemplateColumns: `150px repeat(${tasks.length}, 220px)`,
          }}
        >
          <div className="process-corner">Accountable lane</div>
          {tasks.map((t, i) => (
            <div key={t.id} className="process-sequence">
              {i + 1} {i < tasks.length - 1 ? "→" : ""}
            </div>
          ))}
          {lanes.map((lane) => (
            <div className="process-row" key={lane}>
              <div className="process-lane">{lane}</div>
              {tasks.map((t, i) => {
                const here = (t.lane || t.owner || "Unassigned") === lane;
                const metric = overlay === "none" ? null : t[overlay];
                const intensity =
                  metric == null || !max
                    ? 0
                    : overlay === "handoverQuality"
                      ? 1 - metric / 100
                      : metric / max;
                return (
                  <div key={t.id} className="process-cell">
                    {here ? (
                      <button
                        type="button"
                        className={`process-node ${selected === t.id ? "selected" : ""} ${t.redesign === "Remove" ? "removed" : ""}`}
                        onClick={() => onSelect?.(t.id)}
                        style={
                          {
                            "--heat": `${Math.round(8 + intensity * 45)}%`,
                          } as CSSProperties
                        }
                      >
                        <small>
                          {t.mode} · {t.redesign || "Keep"}
                        </small>
                        <strong title={t.title}>
                          {t.title || `Task ${i + 1}`}
                        </strong>
                        <span>
                          {overlay === "none"
                            ? `${t.cardIds?.length || 0} cards · ${taskGaps(t).length} gaps`
                            : displayNumber(
                                metric,
                                overlay === "processing" ||
                                  overlay === "waiting"
                                  ? "min"
                                  : "%",
                              )}
                        </span>
                        <em>{taskChange(t, baseline)}</em>
                      </button>
                    ) : (
                      <span className="process-empty-cell" aria-hidden="true">
                        ·
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProcessStudio({
  value,
  onChange,
  cards,
}: {
  value: WorkDesign;
  onChange: (v: WorkDesign) => void;
  cards: MethodCard[];
}) {
  const [target, setTarget] = useState("proposed");
  const [view, setView] = useState<"edit" | "compare">("edit");
  const [overlay, setOverlay] = useState<ProcessMetric | "none">("none");
  const [selected, setSelected] = useState("");
  const [history, setHistory] = useState<WorkDesign[]>([]);
  const [compare, setCompare] = useState(["current", "proposed"]);
  const inspector = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selected)
      inspector.current?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
  }, [selected]);
  useEffect(() => {
    if (
      target !== "current" &&
      target !== "proposed" &&
      !value.variants?.some((v) => v.id === target)
    ) {
      setTarget("proposed");
      setSelected("");
    }
  }, [target, value.variants]);
  const options = [
    { id: "current", name: "Current process", tasks: value.currentTasks || [] },
    { id: "proposed", name: "Proposed process", tasks: value.tasks || [] },
    ...(value.variants || []),
  ];
  const active = options.find((o) => o.id === target) || options[1];
  const task = active.tasks.find((t) => t.id === selected);
  function change(next: WorkDesign) {
    setHistory((h) => [...h.slice(-29), structuredClone(value)]);
    onChange(next);
  }
  function updateTasks(tasks: DesignTask[]) {
    change(
      target === "current"
        ? { ...value, currentTasks: tasks }
        : target === "proposed"
          ? { ...value, tasks }
          : {
              ...value,
              variants: (value.variants || []).map((v) =>
                v.id === target ? { ...v, tasks } : v,
              ),
            },
    );
  }
  function edit(key: keyof DesignTask, v: string | number | null) {
    if (task)
      updateTasks(
        active.tasks.map((t) => (t.id === task.id ? { ...t, [key]: v } : t)),
      );
  }
  const summary = processSummary(active.tasks);
  const assessments = options.filter((o) => compare.includes(o.id));
  return (
    <section className="process-studio">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            CONCEPT DEVELOPMENT · PROCESS REDESIGN
          </span>
          <h3>See the work. Compare the change.</h3>
        </div>
        <button
          type="button"
          disabled={!history.length}
          onClick={() => {
            onChange(history[history.length - 1]);
            setHistory((h) => h.slice(0, -1));
          }}
        >
          Undo design change
        </button>
      </div>
      <p>
        Map steps in execution order across accountable lanes. Select one task
        to edit its inputs, handover, evidence and AI cards. All changes remain
        in the use-case draft until saved.
      </p>
      <div className="redesign-toolbar">
        <label>
          Process version
          <select
            value={target}
            onChange={(e) => {
              setTarget(e.target.value);
              setSelected("");
            }}
          >
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Visual overlay
          <select
            value={overlay}
            onChange={(e) =>
              setOverlay(e.target.value as ProcessMetric | "none")
            }
          >
            <option value="none">Task design</option>
            {processMetrics.map((k) => (
              <option key={k} value={k}>
                {metricLabels[k]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          aria-pressed={view === "edit"}
          onClick={() => setView("edit")}
        >
          Edit process
        </button>
        <button
          type="button"
          aria-pressed={view === "compare"}
          onClick={() => setView("compare")}
        >
          Compare scenarios
        </button>
      </div>
      {overlay !== "none" && (
        <p className="overlay-legend">
          <i /> Darker orange ={" "}
          {overlay === "handoverQuality"
            ? "lower handover quality"
            : "higher " + metricLabels[overlay].toLowerCase()}
          . Values appear on every task; unknown is not zero. Colours here show
          process metrics, not AI card categories.
        </p>
      )}
      {view === "edit" ? (
        <>
          <div className="process-actions">
            <button
              type="button"
              disabled={active.tasks.length >= 30}
              onClick={() => {
                const t = {
                  ...newTask(),
                  redesign: target === "current" ? "Keep" : "Add",
                };
                updateTasks([...active.tasks, t]);
                setSelected(t.id);
              }}
            >
              + Add task
            </button>
            <button
              type="button"
              disabled={(value.variants?.length || 0) >= 3}
              onClick={() => {
                const id = crypto.randomUUID();
                change({
                  ...value,
                  variants: [
                    ...(value.variants || []),
                    {
                      id,
                      name: `Alternative ${(value.variants?.length || 0) + 1}`,
                      tasks: structuredClone(active.tasks),
                    },
                  ],
                });
                setTarget(id);
                setSelected("");
              }}
            >
              Duplicate as alternative
            </button>
            {target === "proposed" &&
              !active.tasks.length &&
              !!value.currentTasks?.length && (
                <button
                  type="button"
                  onClick={() =>
                    updateTasks(structuredClone(value.currentTasks!))
                  }
                >
                  Start from current process
                </button>
              )}
            {target === "current" &&
              !active.tasks.length &&
              !!value.tasks?.length && (
                <button
                  type="button"
                  onClick={() => updateTasks(structuredClone(value.tasks!))}
                >
                  Copy proposed as baseline draft
                </button>
              )}
          </div>
          {!["current", "proposed"].includes(target) && (
            <label className="wb-field">
              Alternative name
              <input
                maxLength={200}
                value={active.name}
                onChange={(e) =>
                  change({
                    ...value,
                    variants: value.variants?.map((v) =>
                      v.id === target ? { ...v, name: e.target.value } : v,
                    ),
                  })
                }
              />
            </label>
          )}
          <div className="process-kpis">
            <span>
              <b>{summary.count}</b>active tasks
            </span>
            <span>
              <b>{displayNumber(summary.processing, "min")}</b>active effort /
              case
            </span>
            <span>
              <b>{displayNumber(summary.waiting, "min")}</b>waiting / case
            </span>
            <span>
              <b>{displayNumber(summary.handovers)}</b>cross-lane handovers
            </span>
            <span>
              <b>
                {summary.measured}/{summary.count}
              </b>
              timing coverage
            </span>
          </div>
          <ProcessMap
            tasks={active.tasks}
            baseline={value.currentTasks || []}
            selected={selected}
            onSelect={setSelected}
            overlay={overlay}
          />
          <p className="redesign-note">
            Sequence runs left to right across lanes. Timing excludes removed
            tasks and assumes sequential work; parallel paths require separate
            analysis. Rework and handover percentages are shown per task, not
            averaged into a process claim.
          </p>
          {task ? (
            <div
              className="task-inspector"
              ref={inspector}
              role="region"
              aria-label="Selected task inspector"
              onKeyDown={(e) => {
                if (e.key === "Escape") setSelected("");
              }}
            >
              <div className="section-heading">
                <h4>{task.title || "New task"}</h4>
                <button type="button" onClick={() => setSelected("")}>
                  Close inspector
                </button>
              </div>
              <div className="redesign-toolbar">
                <button
                  type="button"
                  disabled={active.tasks.indexOf(task) === 0}
                  onClick={() => {
                    const list = [...active.tasks],
                      i = list.indexOf(task);
                    [list[i - 1], list[i]] = [list[i], list[i - 1]];
                    updateTasks(list);
                  }}
                >
                  ← Earlier
                </button>
                <button
                  type="button"
                  disabled={
                    active.tasks.indexOf(task) === active.tasks.length - 1
                  }
                  onClick={() => {
                    const list = [...active.tasks],
                      i = list.indexOf(task);
                    [list[i + 1], list[i]] = [list[i], list[i + 1]];
                    updateTasks(list);
                  }}
                >
                  Later →
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateTasks(active.tasks.filter((t) => t.id !== task.id));
                    setSelected("");
                  }}
                >
                  Delete task from draft
                </button>
                <span>{taskGaps(task).length} required fields missing</span>
              </div>
              <div className="wb-form-grid">
                <label className="wb-field">
                  Task name
                  <input
                    value={task.title}
                    onChange={(e) => edit("title", e.target.value)}
                  />
                </label>
                <label className="wb-field">
                  Accountable lane
                  <input
                    value={task.lane || ""}
                    placeholder="Business Partner / Value Stream / Developers"
                    onChange={(e) => edit("lane", e.target.value)}
                  />
                </label>
                <label className="wb-field">
                  Execution mode
                  <select
                    value={task.mode}
                    onChange={(e) => edit("mode", e.target.value)}
                  >
                    {taskModes.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </label>
                <label className="wb-field">
                  Redesign action
                  <select
                    value={task.redesign || "Keep"}
                    onChange={(e) => edit("redesign", e.target.value)}
                  >
                    {redesignActions.map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </select>
                </label>
                {(
                  [
                    ["input", "Input and trusted source"],
                    ["output", "Output / next handover"],
                    ["owner", "Accountable owner"],
                    ["acceptance", "Acceptance check"],
                    ["exception", "Exception / fallback"],
                    [
                      "rationale",
                      "Why this redesign? Evidence and assumptions",
                    ],
                  ] as const
                ).map(([key, label]) => (
                  <label className="wb-field" key={key}>
                    {label}
                    <textarea
                      rows={2}
                      maxLength={4000}
                      value={task[key] || ""}
                      onChange={(e) => edit(key, e.target.value)}
                    />
                  </label>
                ))}
                {processMetrics.map((k) => (
                  <label className="wb-field" key={k}>
                    {metricLabels[k]}
                    <input
                      type="number"
                      min="0"
                      max={
                        k === "rework" || k === "handoverQuality" ? 100 : 1e7
                      }
                      placeholder="Unknown"
                      value={task[k] ?? ""}
                      onChange={(e) =>
                        edit(
                          k,
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                    />
                  </label>
                ))}
              </div>
              <CardPicker
                cards={cards}
                selected={task.cardIds || []}
                onChange={(ids) =>
                  updateTasks(
                    active.tasks.map((t) =>
                      t.id === task.id ? { ...t, cardIds: ids } : t,
                    ),
                  )
                }
              />
            </div>
          ) : (
            <p className="process-empty">
              Select a task on the canvas to open its inspector. Card selection
              stays attached to that task.
            </p>
          )}
        </>
      ) : (
        <>
          <div className="comparison-selectors">
            {options.map((o) => (
              <label key={o.id}>
                <input
                  type="checkbox"
                  checked={compare.includes(o.id)}
                  disabled={!compare.includes(o.id) && compare.length >= 3}
                  onChange={(e) =>
                    setCompare(
                      e.target.checked
                        ? [...compare, o.id]
                        : compare.filter((id) => id !== o.id),
                    )
                  }
                />
                {o.name}
              </label>
            ))}
          </div>
          <div className="comparison-table-wrap">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Process measure</th>
                  {assessments.map((o) => (
                    <th key={o.id}>{o.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    "count",
                    "processing",
                    "waiting",
                    "elapsed",
                    "handovers",
                  ] as const
                ).map((k) => (
                  <tr key={k}>
                    <th>
                      {
                        {
                          count: "Active tasks",
                          processing: "Active effort (min/case)",
                          waiting: "Waiting (min/case)",
                          elapsed: "Sequential elapsed estimate (min)",
                          handovers: "Cross-lane handovers",
                        }[k]
                      }
                    </th>
                    {assessments.map((o) => (
                      <td key={o.id}>
                        {displayNumber(processSummary(o.tasks)[k])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {assessments.map((o) => (
            <section key={o.id}>
              <h4>{o.name}</h4>
              <ProcessMap
                tasks={o.tasks}
                baseline={value.currentTasks || []}
                overlay={overlay}
                onSelect={(id) => {
                  setTarget(o.id);
                  setSelected(id);
                  setView("edit");
                }}
              />
            </section>
          ))}
          <p className="redesign-note">
            Compare alternatives, then edit the chosen version. No alternative
            replaces the proposed process automatically. Removed steps stay
            visible with a strike-through. Missing baseline steps are visible in
            the Current process row.
          </p>
        </>
      )}
    </section>
  );
}
