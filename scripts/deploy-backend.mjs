import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { api, secretDir } from "./n8n-client.mjs";
const deployment = JSON.parse(
  await fs.readFile(".local/deployment.json", "utf8"),
);
const seed = JSON.parse(await fs.readFile(".local/seed.json", "utf8"));
if (!deployment.seeded) {
  await api(`/data-tables/${deployment.tableId}/rows`, "POST", {
    data: [{ workspace: "main", revision: 1, payload: JSON.stringify(seed) }],
  });
  deployment.seeded = true;
  await persist();
}
if (!deployment.credentialId) {
  const password = crypto.randomBytes(18).toString("base64url");
  await fs.writeFile(path.join(secretDir, "team-password"), password, {
    mode: 0o600,
  });
  const cred = await api("/credentials", "POST", {
    name: "AI Vision Studio team access",
    type: "httpBasicAuth",
    data: { user: "team", password },
  });
  deployment.credentialId = cred.id;
  await persist();
}
const logic = (await fs.readFile("n8n/workspace-logic.mjs", "utf8")).replace(
  "export function",
  "function",
);
const nodes = [];
const node = (name, type, parameters, x, extras = {}) => {
  const n = {
    id: crypto.randomUUID(),
    name,
    type,
    typeVersion: 1,
    position: [x, 300],
    parameters,
    ...extras,
  };
  nodes.push(n);
  return n;
};
node(
  "Team API",
  "n8n-nodes-base.webhook",
  {
    httpMethod: "POST",
    path: "ai-vision-studio-v1",
    authentication: "basicAuth",
    responseMode: "responseNode",
    options: {
      allowedOrigins:
        "https://florianliepe.github.io,http://127.0.0.1:5173,http://localhost:5173",
      responseHeaders: {
        entries: [{ name: "Cache-Control", value: "no-store" }],
      },
    },
  },
  0,
  {
    typeVersion: 2,
    webhookId: "ai-vision-studio-v1",
    credentials: {
      httpBasicAuth: {
        id: deployment.credentialId,
        name: "AI Vision Studio team access",
      },
    },
  },
);
node(
  "Read workspace",
  "n8n-nodes-base.dataTable",
  {
    operation: "get",
    dataTableId: { __rl: true, value: deployment.tableId, mode: "id" },
    matchType: "allConditions",
    filters: {
      conditions: [{ keyName: "workspace", condition: "eq", keyValue: "main" }],
    },
    returnAll: true,
  },
  240,
);
node(
  "Validate and apply",
  "n8n-nodes-base.code",
  {
    jsCode:
      logic +
      '\nconst row=$input.first().json; const snapshot={data:JSON.parse(row.payload),revision:row.revision};return [{json:applyMutation(snapshot,$("Team API").first().json.body)}];',
  },
  480,
  { typeVersion: 2 },
);
node(
  "Needs write",
  "n8n-nodes-base.if",
  {
    conditions: {
      options: {
        caseSensitive: true,
        leftValue: "",
        typeValidation: "strict",
        version: 2,
      },
      conditions: [
        {
          id: "write",
          leftValue: "={{ $json.write }}",
          rightValue: true,
          operator: { type: "boolean", operation: "true", singleValue: true },
        },
      ],
      combinator: "and",
    },
    options: {},
  },
  720,
  { typeVersion: 2.2 },
);
node(
  "Commit if unchanged",
  "n8n-nodes-base.dataTable",
  {
    operation: "update",
    dataTableId: { __rl: true, value: deployment.tableId, mode: "id" },
    matchType: "allConditions",
    filters: {
      conditions: [
        { keyName: "workspace", condition: "eq", keyValue: "main" },
        {
          keyName: "revision",
          condition: "eq",
          keyValue: "={{ $json.previousRevision }}",
        },
      ],
    },
    columns: {
      mappingMode: "defineBelow",
      value: {
        payload: "={{ $json.payload }}",
        revision: "={{ $json.revision }}",
      },
      matchingColumns: [],
      schema: [],
      attemptToConvertTypes: false,
      convertFieldsToString: false,
    },
    options: {},
  },
  960,
  { alwaysOutputData: true },
);
node(
  "Confirm commit",
  "n8n-nodes-base.code",
  {
    jsCode:
      'const row=$input.first().json;return [{json:{response:row.payload?{data:JSON.parse(row.payload),revision:row.revision}:{error:"Someone else updated this workspace. Refresh to load their changes, then try again."}}}];',
  },
  1200,
  { typeVersion: 2 },
);
node(
  "Respond",
  "n8n-nodes-base.respondToWebhook",
  {
    respondWith: "json",
    responseBody: "={{ $json.response }}",
    options: {
      responseHeaders: {
        entries: [{ name: "Cache-Control", value: "no-store" }],
      },
    },
  },
  1440,
  { typeVersion: 1.4 },
);
const link = (name) => ({ node: name, type: "main", index: 0 });
const connections = {
  "Team API": { main: [[link("Read workspace")]] },
  "Read workspace": { main: [[link("Validate and apply")]] },
  "Validate and apply": { main: [[link("Needs write")]] },
  "Needs write": { main: [[link("Commit if unchanged")], [link("Respond")]] },
  "Commit if unchanged": { main: [[link("Confirm commit")]] },
  "Confirm commit": { main: [[link("Respond")]] },
};
const workflow = {
  name: "AI Vision Studio | authenticated workspace API",
  nodes,
  connections,
  settings: {
    executionOrder: "v1",
    saveDataErrorExecution: "none",
    saveDataSuccessExecution: "none",
    saveManualExecutions: false,
    executionTimeout: 30,
  },
};
await fs.writeFile(
  "n8n/workspace-api.template.json",
  JSON.stringify(
    workflow,
    (k, v) =>
      k === "id" && v === deployment.credentialId
        ? "TEAM_CREDENTIAL_ID"
        : v === deployment.tableId
          ? "WORKSPACE_TABLE_ID"
          : v,
    2,
  ),
);
const result = deployment.workflowId
  ? await api("/workflows/" + deployment.workflowId, "PUT", workflow)
  : await api("/workflows", "POST", workflow);
deployment.workflowId = result.id;
await persist();
await api(`/workflows/${result.id}/activate`, "POST", {});
console.log({
  workflowId: result.id,
  active: true,
  tableId: deployment.tableId,
});
async function persist() {
  await fs.writeFile(
    ".local/deployment.json",
    JSON.stringify(deployment, null, 2),
  );
}
