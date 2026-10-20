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
const before = structuredClone(s.data);
assert.ok(s.data.methodCards.length > 0);
const card = s.data.methodCards[0].id;
let item = {
  ...newWorkItem(),
  title: "QA mapping integration",
  problem: "Synthetic disposable verification",
  cardIds: [card],
  mapping: {
    strategy: "Start small",
    implementationCost: 2,
    costRationale: "Synthetic scope",
    dependencies: [],
  },
  workDesign: {
    tasks: [
      {
        id: crypto.randomUUID(),
        title: "Review",
        mode: "Human",
        cardIds: [card],
      },
    ],
  },
};
let created = false;
try {
  let r = await call({
    action: "create",
    collection: "workItems",
    record: item,
    revision: s.revision,
  });
  assert.ok(!r.error, r.error);
  s = r;
  created = true;
  item = s.data.workItems.find((w) => w.id === item.id);
  assert.deepEqual(item.workDesign.tasks[0].cardIds, [card]);
  assert.equal(item.mapping.implementationCost, 2);
  r = await call({
    action: "update",
    collection: "workItems",
    record: {
      ...item,
      mapping: { ...item.mapping, costOfDelay: "Synthetic waiting cost" },
    },
    revision: s.revision,
  });
  assert.ok(!r.error, r.error);
  s = r;
  r = await call({ action: "read" });
  assert.equal(
    r.data.workItems.find((w) => w.id === item.id).mapping.costOfDelay,
    "Synthetic waiting cost",
  );
  console.log("Live mapping and task-card round-trip passed.");
} finally {
  if (created) {
    s = await call({ action: "read" });
    s = await call({
      action: "delete",
      collection: "workItems",
      id: item.id,
      revision: s.revision,
    });
    assert.ok(!s.error, s.error);
  }
}
for (const key of Object.keys(before).filter(
  (k) => !["audit", "_requests", "schemaVersion"].includes(k),
))
  assert.deepEqual(s.data[key], before[key]);
console.log(
  "Disposable QA record removed; existing data and private cards preserved.",
);
