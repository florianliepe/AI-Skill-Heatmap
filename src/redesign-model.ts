import type { DesignTask } from "./sprint-model";
import {
  readiness,
  valueModel,
  type WorkItem,
  type Economics,
} from "./workbench-model";
export const redesignActions = [
  "Keep",
  "Remove",
  "Simplify",
  "Combine",
  "Reorder",
  "Automate",
  "Augment",
  "Add",
];
export const processMetrics = [
  "processing",
  "waiting",
  "rework",
  "handoverQuality",
] as const;
export type ProcessMetric = (typeof processMetrics)[number];
export const metricLabels: Record<ProcessMetric, string> = {
  processing: "Active effort (min/case)",
  waiting: "Waiting (min/case)",
  rework: "Rework (%)",
  handoverQuality: "Complete & accurate handovers (%)",
};
export function processSummary(tasks: DesignTask[]) {
  const active = tasks.filter((t) => t.redesign !== "Remove");
  const sum = (k: "processing" | "waiting") =>
    active.length && active.every((t) => t[k] != null)
      ? active.reduce((n, t) => n + t[k]!, 0)
      : null;
  const processing = sum("processing"),
    waiting = sum("waiting");
  return {
    count: active.length,
    processing,
    waiting,
    elapsed:
      processing === null || waiting === null ? null : processing + waiting,
    measured: active.filter((t) => t.processing != null && t.waiting != null)
      .length,
    handovers:
      !active.length || active.some((t) => !(t.lane || t.owner).trim())
        ? null
        : active
            .slice(1)
            .filter(
              (t, i) =>
                (t.lane || t.owner) !== (active[i].lane || active[i].owner),
            ).length,
  };
}
export function taskChange(task: DesignTask, current: DesignTask[]) {
  if (task.redesign === "Remove") return "Removed";
  const before = current.find((t) => t.id === task.id);
  if (!before) return current.length ? "Added" : "No baseline";
  return JSON.stringify(before) === JSON.stringify(task)
    ? "Unchanged"
    : "Changed";
}
export function pilotGaps(w: WorkItem) {
  return [
    ...readiness(w),
    ...(!w.feasibility?.risks?.trim()
      ? ["Risk and constraint assessment"]
      : []),
    ...(!w.owner.trim() ? ["Use-case owner"] : []),
    ...(!w.evidenceNote.trim() ? ["Impact evidence"] : []),
    ...(!w.feasibility?.score || !w.feasibility.rationale.trim()
      ? ["Feasibility evidence"]
      : []),
    ...(!w.mapping?.dataReadiness?.trim() ? ["Data/access assessment"] : []),
  ];
}
export function scenarioEconomics(
  w: WorkItem,
  scenario: "low" | "base" | "high",
): Economics | undefined {
  return scenario === "base" ? w.economics : w.valueScenarios?.[scenario];
}
export function scenarioValue(w: WorkItem, scenario: "low" | "base" | "high") {
  const e = scenarioEconomics(w, scenario);
  return e ? valueModel(e) : null;
}
export const displayNumber = (n: number | null | undefined, unit = "") =>
  n == null
    ? "Unknown"
    : new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }).format(n) +
      (unit ? " " + unit : "");
