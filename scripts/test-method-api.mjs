import fs from "node:fs/promises";
import assert from "node:assert/strict";
import ts from "typescript";
import { host, secretDir } from "./n8n-client.mjs";
const js = ts.transpileModule(
  await fs.readFile("src/workbench-model.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.ESNext } },
).outputText;
const { newWorkItem } = await import(
  "data:text/javascript;base64," + Buffer.from(js).toString("base64")
);
const pass = (await fs.readFile(secretDir + "/team-password", "utf8")).trim();
const call = async (body) => {
  const r = await fetch(host + "/webhook/ai-vision-studio-v1", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from("team:" + pass).toString("base64"),
    },
    body: JSON.stringify(body),
  });
  assert.equal(r.status, 200);
  return r.json();
};
let s = await call({ action: "read" });
const initial = structuredClone(s.data);
const record = {
  ...newWorkItem(),
  kind: "usecase",
  title: "QA method decomposition",
  problem: "Temporary verification",
  impact: 3,
  evidenceNote: "Synthetic evidence",
  feasibility: {
    score: 4,
    rationale: "Synthetic feasibility",
    risks: "Synthetic risk",
  },
};
const task = (title) => ({
  id: crypto.randomUUID(),
  title,
  input: "Source",
  output: "Result",
  owner: "QA role",
  mode: "AI assisted",
  acceptance: "Check source",
  exception: "Escalate",
  cardReference: "",
});
record.workDesign = { tasks: [task("Receive"), task("Check")] };
let created = false;
try {
  s = await call({
    action: "create",
    collection: "workItems",
    record,
    revision: s.revision,
    requestId: crypto.randomUUID(),
  });
  assert.ok(!s.error, s.error);
  created = true;
  let persisted = (await call({ action: "read" })).data.workItems.find(
    (w) => w.id === record.id,
  );
  assert.deepEqual(persisted.workDesign.tasks, record.workDesign.tasks);
  assert.deepEqual(persisted.feasibility, record.feasibility);
  persisted.workDesign.tasks.reverse();
  const prior = s.revision;
  s = await call({
    action: "update",
    collection: "workItems",
    record: persisted,
    revision: s.revision,
  });
  assert.ok(!s.error, s.error);
  assert.equal(
    s.data.workItems.find((w) => w.id === record.id).workDesign.tasks[0].title,
    "Check",
  );
  const stale = await call({
    action: "update",
    collection: "workItems",
    record,
    revision: prior,
  });
  assert.ok(stale.error);
  const bad = await call({
    action: "update",
    collection: "workItems",
    record: { ...persisted, feasibility: { score: 6 } },
    revision: s.revision,
  });
  assert.ok(bad.error);
  persisted.workDesign.tasks.splice(1, 1);
  s = await call({
    action: "update",
    collection: "workItems",
    record: persisted,
    revision: s.revision,
  });
  assert.ok(!s.error, s.error);
  assert.equal(
    s.data.workItems.find((w) => w.id === record.id).workDesign.tasks.length,
    1,
  );
  console.log(
    "PASS: live task persistence, order, removal, feasibility, validation and stale-write protection.",
  );
} finally {
  if (created) {
    s = await call({ action: "read" });
    s = await call({
      action: "delete",
      collection: "workItems",
      id: record.id,
      revision: s.revision,
    });
    assert.ok(!s.error, s.error);
  }
  const after = (await call({ action: "read" })).data;
  for (const key of Object.keys(initial).filter(
    (k) => Array.isArray(initial[k]) && !["audit", "_requests"].includes(k),
  ))
    assert.deepEqual(after[key], initial[key]);
  console.log(
    "PASS: temporary record removed; all existing entity collections unchanged.",
  );
}
