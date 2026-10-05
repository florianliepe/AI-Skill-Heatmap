import type { Collection, RecordValue, Snapshot } from "./types";
const endpoint =
  "https://eraneos-agentic-platform.azurewebsites.net/webhook/ai-vision-studio-v1";
let authorization = "";
let sessionVersion = 0;
export function clearSession() {
  authorization = "";
  sessionVersion++;
}
async function request(body: object): Promise<Snapshot> {
  const startedInSession = sessionVersion;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authorization,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
    cache: "no-store",
  });
  if (response.status === 401)
    throw new Error(
      "The team password is incorrect or your session has expired.",
    );
  if (!response.ok)
    throw new Error(
      "The workspace request failed. Refresh to confirm the save status before retrying.",
    );
  const result = await response.json();
  if (sessionVersion !== startedInSession)
    throw new Error("Your session ended. Sign in again.");
  if (result.error) throw new Error(result.error);
  if (!result.data || typeof result.revision !== "number")
    throw new Error(
      "The server returned an invalid response. Please try again.",
    );
  return result;
}
export async function login(password: string) {
  sessionVersion++;
  authorization = "Basic " + btoa("team:" + password);
  try {
    return await request({ action: "read" });
  } catch (e) {
    clearSession();
    throw e;
  }
}
export const refresh = () => request({ action: "read" });
export const saveWorkItem = (
  record: import("./workbench-model").WorkItem,
  revision: number,
  create: boolean,
  requestId: string,
) =>
  request({
    action: create ? "create" : "update",
    collection: "workItems",
    record,
    revision,
    requestId,
  });
export const save = (
  collection: Collection,
  record: RecordValue,
  revision: number,
  create: boolean,
) =>
  request({
    action: create ? "create" : "update",
    collection,
    record,
    revision,
  });
export const remove = (collection: Collection, id: string, revision: number) =>
  request({ action: "delete", collection, id, revision });
export async function chat(message: string): Promise<string> {
  const startedInSession = sessionVersion;
  const response = await fetch(
    "https://eraneos-agentic-platform.azurewebsites.net/webhook/ai-vision-assistant-v1/chat",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify({
        action: "sendMessage",
        chatInput: message,
        sessionId: crypto.randomUUID(),
      }),
      signal: AbortSignal.timeout(60000),
      cache: "no-store",
    },
  );
  if (!response.ok)
    throw new Error(
      "The assistant is unavailable. Your workspace data is unaffected.",
    );
  const result = await response.json();
  if (sessionVersion !== startedInSession)
    throw new Error("Your session ended.");
  return (
    result.output ||
    result.message ||
    "No answer was returned. Please try again."
  );
}
