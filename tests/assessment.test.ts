import { expect, it } from "vitest";
import { assessmentGaps, type AssessmentEntry } from "../src/assessment-model";
import { newWorkItem } from "../src/workbench-model";
import { emptyDesign, newTask } from "../src/sprint-model";
import { cardCoverage } from "../src/method-model";
// @ts-ignore shared backend
import { applyMutation } from "../n8n/workspace-logic.mjs";
const card = {
  id: "synthetic-card",
  kind: "data-card" as const,
  title: "Synthetic source",
  category: "Test",
  body: "Synthetic wording",
  sourceUrl: "https://example.org/source",
  version: "test",
  color: "#77929a",
};
const entry = (): AssessmentEntry => ({
  id: "entry",
  cardId: card.id,
  kind: "data-card",
  taskId: "",
  specification: "",
  owner: "",
  evidence: "",
  action: "",
  status: "Unknown",
  origin: "Unknown",
  structure: "Unknown",
  shortlist: false,
});
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
    methodCards: [card],
  },
});
const item = () => ({
  ...newWorkItem(),
  title: "Synthetic assessment",
  problem: "Test",
  kind: "usecase",
  workDesign: { ...emptyDesign(), assessment: [entry()] },
});
const create = (record: unknown) =>
  applyMutation(state(), {
    action: "create",
    collection: "workItems",
    record,
    revision: 1,
  });
it("imports cards atomically, retains unrelated data and rejects partial or stale batches", () => {
  const original = state();
  const result = applyMutation(original, {
    action: "importCards",
    records: [
      { ...card, id: "second" },
      { ...card, color: "#123456" },
    ],
    revision: 1,
    requestId: "batch-test",
  });
  expect(result.write).toBe(true);
  expect(result.previousRevision).toBe(1);
  expect(result.response.data.methodCards).toHaveLength(2);
  expect(original.data.methodCards).toEqual([card]);
  expect(
    applyMutation(original, {
      action: "importCards",
      records: [
        { ...card, id: "second" },
        { ...card, id: "third", color: "invalid" },
      ],
      revision: 1,
    }).write,
  ).toBe(false);
  expect(
    applyMutation(original, {
      action: "importCards",
      records: [card],
      revision: 0,
    }).write,
  ).toBe(false);
  const retry = applyMutation(result.response, {
    action: "importCards",
    records: [
      { ...card, id: "second" },
      { ...card, color: "#123456" },
    ],
    revision: 1,
    requestId: "batch-test",
  });
  expect(retry.write).toBe(false);
  expect(retry.response.revision).toBe(result.response.revision);
});
it("preserves an unknown assessment without certifying readiness", () => {
  const result = create(item());
  expect(result.write).toBe(true);
  expect(result.response.data.workItems[0].workDesign.assessment).toEqual([
    entry(),
  ]);
  expect(assessmentGaps([entry()])).toHaveLength(1);
  expect(cardCoverage(card)).toBe("Front available · review pending");
});
it("requires evidence and a risk action even when status claims control", () => {
  const e = {
    ...entry(),
    kind: "risk-card" as const,
    status: "Controlled" as const,
    owner: "Owner",
    specification: "Harm",
    evidence: "Test",
  };
  expect(assessmentGaps([e])).toHaveLength(1);
  expect(assessmentGaps([{ ...e, action: "Human stop" }])).toHaveLength(0);
});
it("rejects mismatched cards, invalid classifications and duplicate applications", () => {
  for (const patch of [
    { cardId: "absent" },
    { kind: "risk-card" },
    { status: "Controlled" },
    { origin: "Invented" },
    { shortlist: "yes" },
    { owner: 42 },
    { taskId: "deleted" },
  ]) {
    const w = item();
    Object.assign(w.workDesign.assessment[0], patch);
    expect(create(w).write).toBe(false);
  }
  const w = item();
  w.workDesign.assessment.push({ ...entry(), id: "second" });
  expect(create(w).write).toBe(false);
});
it("preserves task scope and prevents card deletion or deck change while referenced", () => {
  const w = item();
  const t = newTask();
  Object.assign(w.workDesign, { tasks: [t] });
  w.workDesign.assessment[0].taskId = t.id;
  const result = create(w);
  expect(result.write).toBe(true);
  const next = result.response;
  expect(
    applyMutation(next, {
      action: "delete",
      collection: "methodCards",
      id: card.id,
      revision: next.revision,
    }).write,
  ).toBe(false);
  expect(
    applyMutation(next, {
      action: "update",
      collection: "methodCards",
      record: { ...card, kind: "resource-card" },
      revision: next.revision,
    }).write,
  ).toBe(false);
});
it("validates card colour without embedding source content in public fixtures", () => {
  for (const color of ["red", "url(secret)", "#123"]) {
    expect(
      applyMutation(state(), {
        action: "update",
        collection: "methodCards",
        record: { ...card, color },
        revision: 1,
      }).write,
    ).toBe(false);
  }
});
