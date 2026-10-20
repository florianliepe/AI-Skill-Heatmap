import { expect, it } from "vitest";
import {
  cardCoverage,
  cardSearchText,
  type MethodCard,
} from "../src/method-model";
// @ts-ignore shared server implementation
import { applyMutation } from "../n8n/workspace-logic.mjs";
const card: MethodCard = {
  id: "pair",
  kind: "ai-card",
  title: "Example capability",
  category: "Test",
  body: "Front",
  backText: "Reverse evidence",
  sourceUrl: "https://example.com/front",
  backSourceUrl: "https://example.com/back",
  version: "1",
  explanation: "Interpretation",
  reviewStatus: "reviewed",
};
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
const save = (record: unknown) =>
  applyMutation(state(), {
    action: "create",
    collection: "methodCards",
    record,
    revision: 1,
  });
it("requires both sides and evidence before declaring coverage reviewed", () => {
  expect(cardCoverage(card)).toBe("Reviewed");
  expect(cardCoverage({ ...card, backText: "" })).toBe("Missing reverse");
  expect(cardCoverage({ ...card, backSourceUrl: "" })).toBe(
    "Missing reverse source",
  );
  expect(cardCoverage({ ...card, kind: "method" })).toBe("Method extract");
});
it("searches reverse text, interpretation and application notes", () => {
  expect(
    cardSearchText({ ...card, applicationNotes: "Process intake" }),
  ).toContain("process intake");
  expect(cardSearchText(card)).toContain("reverse evidence");
  expect(cardSearchText(card)).toContain("interpretation");
});
it("rejects incomplete review and preserves valid pairs", () => {
  expect(save({ ...card, backText: "" }).write).toBe(false);
  expect(save(card).response.data.methodCards[0].backText).toBe(
    "Reverse evidence",
  );
  expect(
    save({ ...card, body: "", backText: "", reviewStatus: "unreviewed" }).write,
  ).toBe(true);
});
it("rejects invalid application references, source URLs and dates", () => {
  for (const extra of [
    { applicationIds: ["missing"] },
    { backSourceUrl: "javascript:alert(1)" },
    { dueDate: "2026-02-30" },
  ])
    expect(save({ ...card, ...extra }).write).toBe(false);
});
