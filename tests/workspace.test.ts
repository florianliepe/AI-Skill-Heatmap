import { describe, it, expect } from "vitest";
import { progress, objectiveProgress, gap } from "../src/metrics";
// @ts-ignore pure JS module shared with the n8n runtime
import { applyMutation } from "../n8n/workspace-logic.mjs";
const data = {
  visions: [],
  objectives: [{ id: "obj", title: "Objective" }],
  keyResults: [],
  skills: [{ id: "skill" }],
  roles: [{ id: "role" }],
  assessments: [],
  nodes: [{ id: "a" }, { id: "b" }],
  edges: [],
  audit: [],
};
const kr = {
  id: "kr",
  objectiveId: "obj",
  title: "Lead time",
  baseline: 100,
  target: 65,
  current: 80,
  unit: "index",
  owner: "Owner",
  dueDate: "2027-12-31",
  evidence: "",
};
describe("Outcome measurement", () => {
  it("measures increasing and decreasing goals", () => {
    expect(progress({ baseline: 0, target: 80, current: 40 })).toBe(50);
    expect(progress({ baseline: 100, target: 60, current: 80 })).toBe(50);
  });
  it("does not confuse missing measurements with zero", () => {
    expect(progress({ ...kr, current: null })).toBeNull();
    expect(progress({ baseline: 0, target: 100, current: 0 })).toBe(0);
    expect(objectiveProgress([])).toBeNull();
  });
  it("caps overachievement and regression", () => {
    expect(progress({ ...kr, current: 0 })).toBe(100);
    expect(progress({ ...kr, current: 150 })).toBe(0);
    expect(progress({ baseline: 1, target: 1, current: 1 })).toBeNull();
  });
  it("preserves unassessed skill gaps", () => {
    expect(gap({ current: null, target: 3 } as never)).toBeNull();
    expect(gap({ current: 1, target: 3 } as never)).toBe(2);
  });
});
describe("Shared mutation rules", () => {
  it("accepts valid records and creates an audit entry", () => {
    const r = applyMutation(
      { data, revision: 1 },
      { action: "create", collection: "keyResults", record: kr, revision: 1 },
    );
    expect(r.write).toBe(true);
    expect(r.response.data.keyResults[0].id).toBe("kr");
    expect(r.response.data.audit).toHaveLength(1);
    expect(data.keyResults).toHaveLength(0);
  });
  it("rejects stale clients", () => {
    expect(
      applyMutation(
        { data, revision: 2 },
        { action: "create", collection: "keyResults", record: kr, revision: 1 },
      ).response.error,
    ).toContain("Someone else");
  });
  it("rejects invalid references and zero-distance targets", () => {
    for (const record of [
      { ...kr, objectiveId: "missing" },
      { ...kr, target: 100 },
    ])
      expect(
        applyMutation(
          { data, revision: 1 },
          { action: "create", collection: "keyResults", record, revision: 1 },
        ).write,
      ).toBe(false);
  });
  it("rejects duplicate role-skill pairs", () => {
    const record = {
      id: "test",
      roleId: "role",
      skillId: "skill",
      target: 3,
      current: null,
      evidence: "",
      priority: "Core",
    };
    const d = { ...data, assessments: [record] };
    expect(
      applyMutation(
        { data: d, revision: 1 },
        {
          action: "create",
          collection: "assessments",
          record: { ...record, id: "other" },
          revision: 1,
        },
      ).response.error,
    ).toContain("already");
  });
  it("cascades objective deletion to key results", () => {
    const d = { ...data, keyResults: [kr] };
    const r = applyMutation(
      { data: d, revision: 1 },
      { action: "delete", collection: "objectives", id: "obj", revision: 1 },
    );
    expect(r.response.data.keyResults).toEqual([]);
  });
  it("rejects unknown collections and malformed values", () => {
    expect(
      applyMutation(
        { data, revision: 1 },
        { action: "create", collection: "__proto__", record: kr, revision: 1 },
      ).write,
    ).toBe(false);
    expect(
      applyMutation(
        { data, revision: 1 },
        {
          action: "create",
          collection: "keyResults",
          record: { ...kr, current: "oops" },
          revision: 1,
        },
      ).write,
    ).toBe(false);
  });
});
