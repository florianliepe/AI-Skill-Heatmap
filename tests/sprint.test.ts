import { describe, it, expect } from "vitest";
import { newSession, emptyDesign, deliveryCoverage } from "../src/sprint-model";
import { newWorkItem } from "../src/workbench-model";
import { parseProposal } from "../src/proposal-model";
// @ts-ignore shared server logic
import { applyMutation } from "../n8n/workspace-logic.mjs";
const legacy = {
  visions: [],
  objectives: [{ id: "o" }],
  keyResults: [],
  skills: [],
  roles: [],
  assessments: [],
  nodes: [{ id: "n" }],
  edges: [],
  audit: [],
};
const state = () => ({ data: structuredClone(legacy), revision: 1 });
describe("Sprint sessions and work design", () => {
  it("normalizes legacy workspaces without discarding data", () => {
    const s = state();
    const r = applyMutation(s, { action: "read" }).response;
    expect(r.data.sprintSessions).toEqual([]);
    expect(r.data.schemaVersion).toBe(3);
    expect(r.data.objectives).toEqual(s.data.objectives);
    expect(s.data).not.toHaveProperty("sprintSessions");
  });
  it("persists sessions and rejects invalid dates or missing problem", () => {
    const record = {
      ...newSession(),
      title: "Sprint",
      problem: "Repeated handovers",
      date: "2026-10-06",
    };
    const s = state();
    const r = applyMutation(s, {
      action: "create",
      collection: "sprintSessions",
      record,
      revision: 1,
    });
    expect(r.write).toBe(true);
    for (const bad of [
      { ...record, date: "2026-02-30" },
      { ...record, problem: "" },
    ])
      expect(
        applyMutation(s, {
          action: "create",
          collection: "sprintSessions",
          record: bad,
          revision: 1,
        }).response.error,
      ).toBeTruthy();
  });
  it("retains session references and blocks deleting a linked session", () => {
    const record = {
      ...newSession(),
      title: "Sprint",
      problem: "Repeated handovers",
    };
    let s = applyMutation(state(), {
      action: "create",
      collection: "sprintSessions",
      record,
      revision: 1,
    }).response;
    const w = {
      ...newWorkItem(),
      title: "Idea",
      problem: "Gap",
      sessionId: record.id,
      workDesign: { ...emptyDesign(), aiTask: "Draft summary" },
    };
    s = applyMutation(s, {
      action: "create",
      collection: "workItems",
      record: w,
      revision: s.revision,
    }).response;
    expect(s.data.workItems[0].workDesign.aiTask).toBe("Draft summary");
    expect(
      applyMutation(s, {
        action: "delete",
        collection: "sprintSessions",
        id: record.id,
        revision: s.revision,
      }).response.error,
    ).toMatch(/linked/);
  });
  it("rejects invented sessions and unsupported autonomy levels", () => {
    for (const extra of [
      { sessionId: "missing" },
      { workDesign: { ...emptyDesign(), autonomy: "Unbounded" } },
    ]) {
      const r = applyMutation(state(), {
        action: "create",
        collection: "workItems",
        record: { ...newWorkItem(), title: "Idea", problem: "Gap", ...extra },
        revision: 1,
      });
      expect(r.write).toBe(false);
    }
  });
  it("counts coverage only over non-archived use cases", () => {
    const draft = { ...newWorkItem(), title: "Case", kind: "usecase" as const };
    const complete = {
      ...draft,
      id: "complete",
      objectiveId: "o",
      nodeId: "n",
      workDesign: {
        ...emptyDesign(),
        currentWork: "Current",
        input: "Data",
        aiTask: "AI",
        humanJudgment: "Review",
        handover: "Gate",
        output: "Ready",
      },
    };
    const result = deliveryCoverage([
      draft,
      complete,
      { ...draft, id: "archived", stage: "Archived" },
      newWorkItem(),
    ]);
    expect(result.map((x) => [x.covered, x.total])).toEqual([
      [1, 2],
      [1, 2],
      [0, 2],
    ]);
    expect(result[0].gaps.map((x) => x.id)).toEqual([draft.id]);
  });
  it("does not present empty selections as complete", () => {
    expect(
      deliveryCoverage([]).every((d) => d.total === 0 && d.covered === 0),
    ).toBe(true);
  });
});
describe("Reviewable AI proposals", () => {
  it("accepts bounded text edits and questions", () => {
    const p = {
      proposals: [
        {
          field: "nextAction",
          proposed: "Interview the requester",
          reason: "Validate the assumption",
        },
      ],
      questions: ["Who owns the decision?"],
    };
    expect(parseProposal(JSON.stringify(p))).toEqual(p);
  });
  it("rejects scores, measurements and arbitrary fields", () => {
    for (const field of ["impact", "observations", "owner", "__proto__"])
      expect(() =>
        parseProposal({
          proposals: [{ field, proposed: "5", reason: "Guess" }],
          questions: [],
        }),
      ).toThrow();
  });
  it("rejects duplicate edits, unbounded content and malformed output", () => {
    const p = { field: "design", proposed: "Draft", reason: "Test" };
    for (const raw of [
      { proposals: [p, p], questions: [] },
      { proposals: [{ ...p, proposed: "x".repeat(4001) }], questions: [] },
      { proposals: [], questions: [], save: true },
      "not JSON",
    ])
      expect(() => parseProposal(raw)).toThrow();
  });
});
