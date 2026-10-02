import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
export const secretDir = path.join(
  os.homedir(),
  ".codex",
  "secrets",
  "ai-vision-mvp",
);
export const host = "https://eraneos-agentic-platform.azurewebsites.net";
export async function api(route, method = "GET", body) {
  const key = (
    await fs.readFile(path.join(secretDir, "n8n-api-key"), "utf8")
  ).trim();
  const r = await fetch(host + "/api/v1" + route, {
    method,
    headers: { "X-N8N-API-KEY": key, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok)
    throw new Error(`${method} ${route}: ${r.status} ${await r.text()}`);
  return r.json();
}
