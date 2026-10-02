import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { host, secretDir } from "./n8n-client.mjs";
const password = await fs.readFile(secretDir + "/team-password", "utf8");
const headers = {
  "Content-Type": "application/json",
  Authorization: "Basic " + Buffer.from("team:" + password).toString("base64"),
};
async function call(body) {
  const r = await fetch(host + "/webhook/ai-vision-studio-v1", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.ok(!j.error, j.error);
  return j;
}
let state = await call({ action: "read" });
const prefix = "qa-entities-" + Date.now();
const id = (name) => prefix + "-" + name;
const cases = [
  [
    "visions",
    {
      id: id("vision"),
      title: "QA vision",
      statement: "Temporary test",
      purpose: "QA",
      horizon: "2027",
      owner: "QA",
    },
  ],
  [
    "objectives",
    {
      id: id("objective"),
      title: "QA objective",
      description: "QA",
      owner: "QA",
      period: "2027",
      pillar: "Business value",
    },
  ],
  [
    "keyResults",
    {
      id: id("kr"),
      objectiveId: id("objective"),
      title: "QA lower-is-better",
      baseline: 100,
      target: 60,
      current: 80,
      unit: "index",
      owner: "QA",
      dueDate: "2027-12-31",
      evidence: "Temporary test",
    },
  ],
  [
    "skills",
    {
      id: id("skill"),
      name: "QA skill",
      family: "QA",
      definition: "Temporary test",
      levels: ["Guided", "Proficient", "Advanced", "Expert"],
      relevance: 3,
      impact: 3,
      upskilling: 3,
      horizon: "Now",
      status: "Proposed",
      evidence: "QA",
    },
  ],
  [
    "roles",
    {
      id: id("role"),
      name: "QA role",
      accountability: "QA",
      workMode: "AI-supported",
    },
  ],
  [
    "assessments",
    {
      id: id("assessment"),
      roleId: id("role"),
      skillId: id("skill"),
      target: 3,
      current: 1,
      evidence: "QA",
      priority: "Core",
    },
  ],
  [
    "nodes",
    {
      id: id("node-a"),
      label: "QA node A",
      category: "Capability",
      description: "QA",
      currentState: "A",
      targetState: "B",
      owner: "QA",
      mode: "AI-supported",
      x: 0,
      y: 0,
    },
  ],
  [
    "nodes",
    {
      id: id("node-b"),
      label: "QA node B",
      category: "Capability",
      description: "QA",
      currentState: "A",
      targetState: "B",
      owner: "QA",
      mode: "AI-supported",
      x: 300,
      y: 0,
    },
  ],
  [
    "edges",
    {
      id: id("edge"),
      source: id("node-a"),
      target: id("node-b"),
      label: "QA dependency",
    },
  ],
];
try {
  for (const [collection, record] of cases) {
    state = await call({
      action: "create",
      collection,
      record,
      revision: state.revision,
    });
    assert.ok(state.data[collection].some((r) => r.id === record.id));
  }
  for (const [collection, record] of cases) {
    const changed = { ...record };
    if ("title" in changed) changed.title += " updated";
    else if ("name" in changed) changed.name += " updated";
    else if ("label" in changed) changed.label += " updated";
    else changed.current = 2;
    state = await call({
      action: "update",
      collection,
      record: changed,
      revision: state.revision,
    });
    assert.ok(state.data[collection].some((r) => r.id === record.id));
  }
  const read = await call({ action: "read" });
  for (const [collection, record] of cases)
    assert.ok(read.data[collection].some((r) => r.id === record.id));
  console.log(
    "PASS: create, update and persisted read across every editable collection",
  );
} finally {
  state = await call({ action: "read" });
  for (const [collection, record] of [...cases].reverse())
    if (state.data[collection].some((r) => r.id === record.id))
      state = await call({
        action: "delete",
        collection,
        id: record.id,
        revision: state.revision,
      });
  for (const [collection, record] of cases)
    assert.ok(!state.data[collection].some((r) => r.id === record.id));
  console.log("PASS: deletion and cleanup across every editable collection");
}
