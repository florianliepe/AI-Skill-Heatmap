import assert from "node:assert/strict";
import fs from "node:fs/promises";
import ts from "typescript";
import { secretDir, host } from "./n8n-client.mjs";
const source = await fs.readFile("src/workbench-model.ts", "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { newWorkItem } = await import(
  "data:text/javascript;base64," + Buffer.from(js).toString("base64")
);
const password = (
  await fs.readFile(secretDir + "/team-password", "utf8")
).trim();
async function call(body) {
  const r = await fetch(host + "/webhook/ai-vision-studio-v1", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Basic " + Buffer.from("team:" + password).toString("base64"),
    },
    body: JSON.stringify(body),
  });
  assert.equal(r.status, 200);
  return r.json();
}
const initial = await call({ action: "read" });
let state = initial;
const ids = [];
async function mutate(action, record) {
  const r = await call({
    action,
    collection: "workItems",
    revision: state.revision,
    record,
    requestId: crypto.randomUUID(),
  });
  assert.ok(!r.error, r.error);
  state = r;
  return r;
}
const idea = {
  ...newWorkItem(),
  title: "QA workbench API",
  problem: "Temporary integration verification",
  process: "QA",
};
try {
  const body = {
    action: "create",
    collection: "workItems",
    record: idea,
    revision: state.revision,
    requestId: crypto.randomUUID(),
  };
  state = await call(body);
  assert.ok(!state.error, state.error);
  ids.push(idea.id);
  const retry = await call(body);
  assert.equal(retry.revision, state.revision);
  assert.equal(retry.data.workItems.filter((x) => x.id === idea.id).length, 1);
  const bad = await call({
    ...body,
    requestId: crypto.randomUUID(),
    record: { ...idea, id: crypto.randomUUID(), impact: 5 },
  });
  assert.ok(bad.error);
  const usecase = {
    ...newWorkItem(),
    title: "QA linked case",
    problem: idea.problem,
    kind: "usecase",
    sourceIds: [idea.id],
    objectiveId: state.data.objectives[0]?.id || "",
    nodeId: state.data.nodes[0]?.id || "",
  };
  await mutate("create", usecase);
  ids.push(usecase.id);
  const linked = await call({
    action: "delete",
    collection: "workItems",
    id: idea.id,
    revision: state.revision,
  });
  assert.ok(linked.error);
  const stale = await call({
    action: "update",
    collection: "workItems",
    record: usecase,
    revision: state.revision - 1,
  });
  assert.match(stale.error, /Someone else/);
  usecase.experiment = {
    hypothesis: "Reduce time without quality loss",
    measure: "Minutes per request",
    unit: "minutes",
    baseline: 90,
    target: 60,
    sample: "10 controlled QA requests",
    stopRule: "Stop if quality declines",
    owner: "QA",
    due: "2026-10-30",
  };
  usecase.stage = "Piloting";
  usecase.decisions = [
    {
      id: crypto.randomUUID(),
      date: "2026-10-05",
      action: "Test",
      owner: "QA",
      rationale: "Controlled sample",
    },
  ];
  usecase.observations = [
    {
      id: crypto.randomUUID(),
      date: "2026-10-05",
      value: 0,
      sample: "Zero-value acceptance test",
      evidence: "QA only",
    },
  ];
  usecase.enablement = [
    {
      id: crypto.randomUUID(),
      roleId: state.data.roles[0].id,
      skillId: state.data.skills[0].id,
      target: 2,
      owner: "QA",
      action: "Review evidence",
      due: "2026-10-30",
      criterion: "Review documented",
      status: "Planned",
    },
  ];
  await mutate("update", usecase);
  assert.equal(
    state.data.workItems.find((x) => x.id === usecase.id).observations[0].value,
    0,
  );
  const tamper = structuredClone(usecase);
  tamper.observations[0].value = 42;
  const rejected = await call({
    action: "update",
    collection: "workItems",
    record: tamper,
    revision: state.revision,
  });
  assert.ok(rejected.error);
  console.log(
    "Workbench API: create, idempotent retry, linked use case, stale-write rejection, experiment, zero observation, enablement and immutable evidence passed.",
  );
} finally {
  for (const id of ids.reverse()) {
    state = await call({ action: "read" });
    const r = await call({
      action: "delete",
      collection: "workItems",
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
  ])
    assert.deepEqual(state.data[key], initial.data[key], key + " changed");
  assert.deepEqual(state.data.workItems, initial.data.workItems);
  console.log(
    "Temporary API records removed; all pre-existing records preserved.",
  );
}
