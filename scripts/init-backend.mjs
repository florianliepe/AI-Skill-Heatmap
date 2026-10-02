import fs from "node:fs/promises";
import { api } from "./n8n-client.mjs";
await fs.mkdir(".local", { recursive: true });
try {
  await fs.access(".local/deployment.json");
  console.log("Deployment configuration already exists; preserving it.");
} catch {
  const table = await api("/data-tables", "POST", {
    name: "AI Vision Studio workspace",
    columns: [
      { name: "workspace", type: "string" },
      { name: "revision", type: "number" },
      { name: "payload", type: "string" },
    ],
  });
  await fs.writeFile(
    ".local/deployment.json",
    JSON.stringify({ tableId: table.id }, null, 2),
  );
  console.log({ created: true, tableId: table.id });
}
