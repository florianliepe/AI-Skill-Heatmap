import { expect, it } from "vitest";
import { newTask, emptyDesign } from "../src/sprint-model";
import { newWorkItem } from "../src/workbench-model";
import {
  processSummary,
  scenarioValue,
  taskChange,
  pilotGaps,
} from "../src/redesign-model";
// @ts-ignore shared backend
import { applyMutation } from "../n8n/workspace-logic.mjs";
const state = () => ({
  revision: 1,
  data: {
    visions: [],
    objectives: [],
    keyResults: [],
    skills: [],
    roles: [],
    assessments: [],
    nodes: [],
    edges: [],
    audit: [],
  },
});
const item = () => ({
  ...newWorkItem(),
  title: "Process redesign test",
  problem: "Synthetic",
  kind: "usecase" as const,
});
const create = (record: unknown) =>
  applyMutation(state(), {
    action: "create",
    collection: "workItems",
    record,
    revision: 1,
  });
it("does not turn missing timing or missing value scenarios into zero", () => {
  expect(processSummary([newTask()]).elapsed).toBeNull();
  expect(processSummary([]).processing).toBeNull();
  expect(scenarioValue(item(), "low")).toBeNull();
  expect(scenarioValue(item(), "base")?.firstYear).toBeNull();
});
it("keeps real zeros, excludes removed work and counts lane transitions in order", () => {
  const tasks = [
    { ...newTask(), processing: 0, waiting: 0, lane: "Requester" },
    { ...newTask(), processing: 10, waiting: 5, lane: "Provider" },
    {
      ...newTask(),
      processing: 90,
      waiting: 100,
      lane: "Provider",
      redesign: "Remove",
    },
  ];
  expect(processSummary(tasks)).toMatchObject({
    count: 2,
    processing: 10,
    waiting: 5,
    elapsed: 15,
    handovers: 1,
    measured: 2,
  });
});
it("preserves all process variants and independent value assumptions through backend save", () => {
  const w = item();
  const t = {
    ...newTask(),
    lane: "Requester",
    processing: 10,
    waiting: 100,
    rework: 20,
    handoverQuality: 80,
    redesign: "Simplify",
    rationale: "Check evidence",
  };
  w.workDesign = {
    ...emptyDesign(),
    tasks: [t],
    currentTasks: [{ ...t, processing: 30 }],
    variants: [
      {
        id: "alternative",
        name: "Rules first",
        tasks: [{ ...t, mode: "Rules / automation" }],
      },
    ],
  };
  w.valueScenarios = {
    low: { ...w.economics, adoption: 30 },
    high: { ...w.economics, adoption: 80 },
  };
  const result = create(w);
  expect(result.write).toBe(true);
  const saved = result.response.data.workItems[0];
  expect(saved.workDesign).toEqual(w.workDesign);
  expect(saved.valueScenarios).toEqual(w.valueScenarios);
  expect(saved.economics.adoption).toBeNull();
});
it("rejects invalid metrics, duplicate task ids and excess alternatives in every process version", () => {
  for (const container of ["tasks", "currentTasks", "variants"]) {
    for (const bad of [
      [{ ...newTask(), waiting: -1 }],
      [{ ...newTask(), rework: 101 }],
      [{ ...newTask(), processing: Infinity }],
      [{ ...newTask(), redesign: "Invented" }],
    ]) {
      const w = item();
      w.workDesign = {
        ...emptyDesign(),
        [container]:
          container === "variants"
            ? [{ id: "variant", name: "Variant", tasks: bad }]
            : bad,
      };
      expect(create(w).write).toBe(false);
    }
  }
  const t = newTask();
  expect(
    create({
      ...item(),
      workDesign: { ...emptyDesign(), currentTasks: [t, t] },
    }).write,
  ).toBe(false);
  expect(
    create({
      ...item(),
      workDesign: {
        ...emptyDesign(),
        variants: Array.from({ length: 4 }, (_, i) => ({
          id: `v${i}`,
          name: "Alternative",
          tasks: [],
        })),
      },
    }).write,
  ).toBe(false);
});
it("rejects invalid scenario economics while keeping legacy records editable", () => {
  const w = item();
  expect(create(w).write).toBe(true);
  expect(
    create({ ...w, valueScenarios: { low: { ...w.economics, adoption: 101 } } })
      .write,
  ).toBe(false);
  expect(
    create({ ...w, valueScenarios: { high: { ...w.economics, setup: -1 } } })
      .write,
  ).toBe(false);
});
it("distinguishes absent baselines from added work and never claims readiness for an empty record", () => {
  const t = newTask();
  expect(taskChange(t, [])).toBe("No baseline");
  expect(taskChange(t, [newTask()])).toBe("Added");
  expect(taskChange(t, [t])).toBe("Unchanged");
  expect(taskChange({ ...t, redesign: "Remove" }, [t])).toBe("Removed");
  expect(pilotGaps(item())).toContain("Data/access assessment");
});
it("prevents deleting a card referenced only in a process alternative", () => {
  const s = state() as any;
  s.data.methodCards = [{ id: "linked-card" }];
  s.data.workItems = [
    {
      id: "case",
      workDesign: {
        variants: [{ id: "variant", tasks: [{ cardIds: ["linked-card"] }] }],
      },
    },
  ];
  const result = applyMutation(s, {
    action: "delete",
    collection: "methodCards",
    id: "linked-card",
    revision: 1,
  });
  expect(result.write).toBe(false);
});
