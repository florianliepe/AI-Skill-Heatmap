import { describe, it, expect } from "vitest";
import {
  newWorkItem,
  valueModel,
  cellSummary,
  mergeFields,
  readiness,
} from "../src/workbench-model";
// @ts-ignore shared server logic
import { applyMutation } from "../n8n/workspace-logic.mjs";
const legacy = {
  visions: [],
  objectives: [{ id: "obj" }],
  keyResults: [],
  skills: [{ id: "skill" }],
  roles: [{ id: "role" }],
  assessments: [],
  nodes: [{ id: "node" }],
  edges: [],
  audit: [],
};
const idea = () => ({
  ...newWorkItem(),
  title: "Requirements",
  problem: "Repeated clarification",
});
describe("Workbench evidence and value", () => {
  it("separates released hours, capacity value and cash", () => {
    expect(
      valueModel({
        volume: 2400,
        adoption: 75,
        baseline: 120,
        assisted: 60,
        review: 20,
        rate: 80,
        realization: 25,
        recurring: 18000,
        setup: 45000,
      }),
    ).toEqual({
      hours: 1200,
      capacity: 96000,
      cash: 24000,
      net: 6000,
      firstYear: -39000,
      payback: 7.5,
    });
  });
  it("preserves unknowns, zero adoption and negative benefits", () => {
    const e = idea().economics;
    expect(valueModel(e).cash).toBeNull();
    const filled = {
      volume: 10,
      adoption: 100,
      baseline: 10,
      assisted: 20,
      review: 5,
      rate: 10,
      realization: 100,
      recurring: 100,
      setup: 0,
    };
    expect(valueModel(filled).hours).toBe(-2.5);
    expect(valueModel(filled).payback).toBeNull();
    expect(valueModel({ ...filled, adoption: 0 }).cash).toBe(0);
  });
  it("excludes unrationalized scores and distinguishes empty from unassessed", () => {
    const a = idea();
    expect(cellSummary([])).toEqual({ total: 0, assessed: 0, median: null });
    expect(cellSummary([a])).toEqual({ total: 1, assessed: 0, median: null });
    expect(cellSummary([{ ...a, impact: 5 }]).assessed).toBe(0);
    expect(
      cellSummary([
        { ...a, impact: 2, evidenceNote: "Interview" },
        { ...a, id: "b", impact: 5, evidenceNote: "Sample" },
      ]).median,
    ).toBe(3.5);
  });
  it("merges independent edits and identifies actual conflicts", () => {
    const base = idea(),
      mine = { ...base, title: "My title" },
      latest = { ...base, owner: "Colleague" };
    expect(mergeFields(base, mine, latest).merged).toMatchObject({
      title: "My title",
      owner: "Colleague",
    });
    expect(
      mergeFields(base, mine, { ...base, title: "Their title" }).conflicts,
    ).toEqual(["title"]);
  });
  it("permits a baseline experiment without a measured baseline", () => {
    const a = idea();
    a.experiment = {
      hypothesis: "Improve",
      measure: "Time",
      unit: "min",
      baseline: null,
      target: 30,
      sample: "20 historic cases",
      stopRule: "Stop at severe error",
      owner: "Lead",
      due: "2026-11-01",
    };
    expect(readiness(a)).toEqual([]);
  });
});
describe("Workbench migration and server contract", () => {
  it("normalizes legacy data without mutating it", () => {
    const out = applyMutation(
      { data: legacy, revision: 3 },
      { action: "read" },
    );
    expect(out.write).toBe(false);
    expect(out.response.data.workItems).toEqual([]);
    expect(out.response.data.schemaVersion).toBe(3);
    expect(legacy).not.toHaveProperty("workItems");
    expect(out.response.data.objectives).toEqual(legacy.objectives);
  });
  it("handles replay after an unknown save outcome without another write", () => {
    const w = idea(),
      r = {
        action: "create",
        collection: "workItems",
        record: w,
        revision: 1,
        requestId: "request-one",
      };
    const out = applyMutation({ data: legacy, revision: 1 }, r);
    expect(out.write).toBe(true);
    const replay = applyMutation(out.response, r);
    expect(replay.write).toBe(false);
    expect(replay.response.data.workItems).toHaveLength(1);
    expect(replay.response.revision).toBe(2);
    expect(
      applyMutation(out.response, { ...r, record: { ...w, title: "changed" } })
        .response.error,
    ).toBeTruthy();
  });
  it("rejects unknown links, missing rationale, invalid assumptions and premature stages", () => {
    for (const patch of [
      { objectiveId: "missing" },
      { impact: 5 },
      { economics: { ...idea().economics, adoption: 101 } },
      { stage: "Piloting" },
    ]) {
      const out = applyMutation(
        { data: legacy, revision: 1 },
        {
          action: "create",
          collection: "workItems",
          record: { ...idea(), ...patch },
          revision: 1,
        },
      );
      expect(out.write).toBe(false);
      expect(out.response.error).toBeTruthy();
    }
  });
  it("blocks stale writes and linked record deletion", () => {
    const w = { ...idea(), objectiveId: "obj" };
    const out = applyMutation(
      { data: legacy, revision: 1 },
      { action: "create", collection: "workItems", record: w, revision: 1 },
    );
    expect(
      applyMutation(out.response, {
        action: "update",
        collection: "workItems",
        record: w,
        revision: 1,
      }).write,
    ).toBe(false);
    expect(
      applyMutation(out.response, {
        action: "delete",
        collection: "objectives",
        id: "obj",
        revision: 2,
      }).response.error,
    ).toMatch(/linked/);
  });
  it("keeps saved evidence immutable", () => {
    const w = idea();
    w.experiment.measure = "Time";
    w.experiment.unit = "minutes";
    w.observations = [
      {
        id: "obs",
        date: "2026-10-05",
        value: 0,
        sample: "10 cases",
        evidence: "Measured log",
      },
    ];
    const out = applyMutation(
      { data: legacy, revision: 1 },
      { action: "create", collection: "workItems", record: w, revision: 1 },
    );
    expect(out.write).toBe(true);
    expect(
      applyMutation(out.response, {
        action: "update",
        collection: "workItems",
        record: { ...w, observations: [] },
        revision: 2,
      }).response.error,
    ).toMatch(/immutable/);
  });
});
