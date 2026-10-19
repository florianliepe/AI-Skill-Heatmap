import { describe, it, expect } from "vitest";
import { newTask, taskGaps } from "../src/sprint-model";
import { newWorkItem } from "../src/workbench-model";
import { priorityPosition } from "../src/PriorityMap";
// @ts-ignore shared server logic
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
  kind: "usecase" as const,
  title: "Test",
  problem: "Missing context",
});
const create = (record: unknown) =>
  applyMutation(state(), {
    action: "create",
    collection: "workItems",
    record,
    revision: 1,
  });
describe("Task decomposition and prioritization", () => {
  it("keeps legacy records and blank task drafts editable without inventing readiness", () => {
    const r = create(item());
    expect(r.write).toBe(true);
    expect(r.response.data.workItems[0].workDesign.tasks).toEqual([]);
    expect(r.response.data.workItems[0].feasibility.score).toBeNull();
    expect(taskGaps(newTask())).toHaveLength(6);
  });
  it("retains order and stable identifiers through save, reorder and removal", () => {
    const a = { ...newTask(), title: "Receive" },
      b = { ...newTask(), title: "Review" };
    const record = { ...item(), workDesign: { tasks: [a, b] } };
    let s = create(record).response;
    s = applyMutation(s, {
      action: "update",
      collection: "workItems",
      record: { ...record, workDesign: { tasks: [b, a] } },
      revision: s.revision,
    }).response;
    expect(s.data.workItems[0].workDesign.tasks.map((t: any) => t.id)).toEqual([
      b.id,
      a.id,
    ]);
    s = applyMutation(s, {
      action: "update",
      collection: "workItems",
      record: { ...record, workDesign: { tasks: [b] } },
      revision: s.revision,
    }).response;
    expect(s.data.workItems[0].workDesign.tasks).toEqual([b]);
  });
  it("rejects malformed tasks, duplicate identifiers, excessive length and invalid modes", () => {
    const t = newTask();
    for (const tasks of [
      [t, t],
      [null],
      [{ ...t, mode: "Autonomous approval" }],
      [{ ...t, input: "x".repeat(4001) }],
      Array.from({ length: 31 }, () => newTask()),
      "text",
    ]) {
      expect(create({ ...item(), workDesign: { tasks } }).write).toBe(false);
    }
  });
  it("validates feasibility score and narrative bounds", () => {
    for (const score of [0, 6, 2.5, "4"])
      expect(create({ ...item(), feasibility: { score } }).write).toBe(false);
    expect(
      create({
        ...item(),
        feasibility: { score: 3, rationale: "x".repeat(12001) },
      }).write,
    ).toBe(false);
    const r = create({
      ...item(),
      feasibility: {
        score: 3,
        rationale: "Data sampled",
        risks: "Quality untested",
      },
    });
    expect(r.response.data.workItems[0].feasibility.score).toBe(3);
  });
  it("does not plot unknowns, ideas or archived cases as low-scoring cases", () => {
    const w = {
      ...item(),
      impact: 4,
      evidenceNote: "Small sample",
      feasibility: {
        score: 3,
        rationale: "Access tested",
        risks: "Evaluation gap",
      },
    };
    expect(priorityPosition(w)).toEqual({ impact: 4, feasibility: 3 });
    expect(priorityPosition({ ...w, kind: "idea" })).toBeNull();
    expect(priorityPosition({ ...w, stage: "Archived" })).toBeNull();
    expect(priorityPosition({ ...w, impact: null })).toBeNull();
    expect(priorityPosition({ ...w, evidenceNote: "" })).toBeNull();
    expect(
      priorityPosition({ ...w, feasibility: { ...w.feasibility, risks: "" } }),
    ).toBeNull();
  });
});
