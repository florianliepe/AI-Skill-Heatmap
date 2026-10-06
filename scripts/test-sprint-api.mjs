import fs from "node:fs/promises";
import assert from "node:assert/strict";
import ts from "typescript";
import { host, secretDir } from "./n8n-client.mjs";
const load = async (file) =>
  import(
    "data:text/javascript;base64," +
      Buffer.from(
        ts.transpileModule(await fs.readFile(file, "utf8"), {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
          },
        }).outputText,
      ).toString("base64")
  );
const { newWorkItem } = await load("src/workbench-model.ts");
const { newSession, emptyDesign } = await load("src/sprint-model.ts");
const { parseProposal } = await load("src/proposal-model.ts");
const pass = (await fs.readFile(secretDir + "/team-password", "utf8")).trim();
const headers = {
  "Content-Type": "application/json",
  Authorization: "Basic " + Buffer.from("team:" + pass).toString("base64"),
};
async function call(body) {
  const r = await fetch(host + "/webhook/ai-vision-studio-v1", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  assert.equal(r.status, 200);
  return r.json();
}
let state = await call({ action: "read" });
const initial = structuredClone(state.data);
const session = {
  ...newSession(),
  title: "QA sprint R2",
  problem: "Temporary test of session persistence",
  date: "2026-10-06",
};
const w = {
  ...newWorkItem(),
  kind: "usecase",
  title: "QA sprint handover",
  problem: "Requesters provide incomplete acceptance criteria.",
  session: session.title,
  sessionId: session.id,
  design:
    "AI asks clarification questions; a requirements engineer approves the document.",
  alternative: "Use a checklist without AI",
  workDesign: {
    ...emptyDesign(),
    currentWork: "Manual clarification",
    input: "Requester notes",
    aiTask: "Propose missing questions",
    humanJudgment: "Engineer approves requirements",
    handover: "Developer confirms definition of ready",
    output: "Reviewed requirements",
  },
};
const owned = [];
try {
  for (const [collection, record] of [
    ["sprintSessions", session],
    ["workItems", w],
  ]) {
    state = await call({
      action: "create",
      collection,
      record,
      revision: state.revision,
      requestId: crypto.randomUUID(),
    });
    assert.ok(!state.error, state.error);
    owned.push([collection, record.id]);
  }
  const linked = await call({
    action: "delete",
    collection: "sprintSessions",
    id: session.id,
    revision: state.revision,
  });
  assert.ok(linked.error);
  const url = host + "/webhook/ai-vision-challenger-v2/chat";
  const anonymous = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatInput: "test" }),
  });
  assert.equal(anonymous.status, 401);
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      action: "sendMessage",
      sessionId: crypto.randomUUID(),
      caseId: w.id,
      revision: state.revision,
      chatInput:
        "Challenge the missing acceptance criteria and propose one practical next action.",
    }),
    signal: AbortSignal.timeout(75000),
  });
  const result = await response.json();
  assert.equal(response.status, 200, JSON.stringify(result));
  assert.equal(result.caseId, w.id, JSON.stringify(result));
  assert.equal(result.revision, state.revision);
  const parsed = parseProposal({
    proposals: result.proposals,
    questions: result.questions,
  });
  assert.ok(parsed.proposals.length + parsed.questions.length > 0);
  const after = await call({ action: "read" });
  assert.equal(after.revision, state.revision);
  assert.deepEqual(after.data.workItems, state.data.workItems);
  console.log(
    "PASS: session persistence, link protection, challenger authentication, scoped workflow-tool response, schema validation and read-only execution.",
  );
} finally {
  for (const [collection, id] of owned.reverse()) {
    state = await call({ action: "read" });
    const r = await call({
      action: "delete",
      collection,
      id,
      revision: state.revision,
    });
    assert.ok(!r.error, r.error);
  }
  state = await call({ action: "read" });
  for (const key of [
    "visions",
    "objectives",
    "keyResults",
    "skills",
    "roles",
    "assessments",
    "nodes",
    "edges",
    "workItems",
    "sprintSessions",
  ])
    assert.deepEqual(state.data[key], initial[key]);
  console.log(
    "PASS: temporary records removed; existing collections unchanged.",
  );
}
