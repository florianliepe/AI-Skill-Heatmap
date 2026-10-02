import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { secretDir, host } from "./n8n-client.mjs";
const password = await fs.readFile(secretDir + "/team-password", "utf8");
const url = host + "/webhook/ai-vision-studio-v1";
const headers = {
  "Content-Type": "application/json",
  Authorization: "Basic " + Buffer.from("team:" + password).toString("base64"),
};
async function call(body) {
  const r = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  assert.equal(r.status, 200);
  return r.json();
}
const anon = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: '{"action":"read"}',
});
assert.equal(anon.status, 401);
const wrong = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Basic " + Buffer.from("team:invalid").toString("base64"),
  },
  body: '{"action":"read"}',
});
assert.equal(wrong.status, 401);
let state = await call({ action: "read" });
assert.equal(state.data.skills.length, 40);
const record = {
  id: "qa-" + Date.now(),
  title: "QA verification (temporary)",
  description: "Temporary integration test",
  owner: "QA",
  period: "2027",
  pillar: "Business value",
};
try {
  const created = await call({
    action: "create",
    collection: "objectives",
    record,
    revision: state.revision,
  });
  assert.ok(!created.error, created.error);
  assert.ok(created.data.objectives.some((o) => o.id === record.id));
  state = created;
  const stale = await call({
    action: "update",
    collection: "objectives",
    record: { ...record, title: "Stale" },
    revision: state.revision - 1,
  });
  assert.match(stale.error, /Someone else/);
  const results = await Promise.all(
    ["A", "B"].map((suffix) =>
      call({
        action: "update",
        collection: "objectives",
        record: { ...record, title: "QA " + suffix },
        revision: state.revision,
      }),
    ),
  );
  assert.equal(
    results.filter((r) => !r.error).length,
    1,
    "Exactly one simultaneous write should succeed",
  );
  state = await call({ action: "read" });
  assert.ok(
    state.data.objectives
      .find((o) => o.id === record.id)
      .title.startsWith("QA "),
  );
  console.log(
    "PASS: auth, read, create, cross-request persistence, stale-write rejection and concurrent-write conflict",
  );
} finally {
  state = await call({ action: "read" });
  if (state.data.objectives.some((o) => o.id === record.id)) {
    const deleted = await call({
      action: "delete",
      collection: "objectives",
      id: record.id,
      revision: state.revision,
    });
    assert.ok(!deleted.error, deleted.error);
    assert.ok(!deleted.data.objectives.some((o) => o.id === record.id));
  }
}
console.log("PASS: delete and test-record cleanup");
