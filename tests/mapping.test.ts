import { expect, it } from "vitest";
import { newWorkItem } from "../src/workbench-model";
import { newTask } from "../src/sprint-model";
import { emptyMapping, safeSource } from "../src/method-model";
import { costMapReady } from "../src/BenefitMap";
// @ts-ignore shared server implementation
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
const card = {
  id: "card",
  title: "A source prompt",
  category: "Mapping",
  body: "Verified wording",
  sourceUrl: "https://example.com/source",
  version: "1",
};
const mutation = (s: any, collection: string, record: any) =>
  applyMutation(s, {
    action: "create",
    collection,
    record,
    revision: s.revision,
  });
it("keeps private cards in the authenticated snapshot and validates source URLs", () => {
  expect(mutation(state(), "methodCards", card).write).toBe(true);
  expect(
    mutation(state(), "methodCards", {
      ...card,
      sourceUrl: "javascript:alert(1)",
    }).write,
  ).toBe(false);
  expect(safeSource("javascript:alert(1)")).toBe(false);
});
it("preserves case and task links and blocks dangling references or linked deletion", () => {
  const s = mutation(state(), "methodCards", card).response;
  const item = {
    ...newWorkItem(),
    title: "Case",
    problem: "Pain",
    cardIds: ["card"],
    workDesign: { tasks: [{ ...newTask(), cardIds: ["card"] }] },
  };
  const result = mutation(s, "workItems", item);
  expect(result.write).toBe(true);
  expect(result.response.data.workItems[0].workDesign.tasks[0].cardIds).toEqual(
    ["card"],
  );
  expect(
    applyMutation(result.response, {
      action: "delete",
      collection: "methodCards",
      id: "card",
      revision: result.response.revision,
    }).write,
  ).toBe(false);
  expect(
    mutation(s, "workItems", { ...item, cardIds: ["missing"] }).write,
  ).toBe(false);
});
it("requires valid upstream references and keeps unknown costs outside the map", () => {
  const item = {
    ...newWorkItem(),
    title: "Case",
    problem: "Pain",
    mapping: emptyMapping(),
  };
  expect(costMapReady(item)).toBe(false);
  expect(
    mutation(state(), "workItems", {
      ...item,
      mapping: { ...item.mapping, dependencies: [item.id] },
    }).write,
  ).toBe(false);
  expect(
    mutation(state(), "workItems", {
      ...item,
      mapping: { ...item.mapping, implementationCost: 0 },
    }).write,
  ).toBe(false);
  expect(
    costMapReady({
      ...item,
      impact: 4,
      evidenceNote: "Baseline",
      mapping: {
        ...emptyMapping(),
        implementationCost: 2,
        costRationale: "Compared scope",
      },
    }),
  ).toBe(true);
});
