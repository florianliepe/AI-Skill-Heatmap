export type AssessmentEntry = {
  id: string;
  kind: "data-card" | "resource-card" | "risk-card";
  cardId: string;
  taskId: string;
  specification: string;
  owner: string;
  evidence: string;
  action: string;
  status: "Unknown" | "Needed" | "Available" | "Gap" | "Controlled";
  origin: "Unknown" | "Internal" | "External";
  structure: "Unknown" | "Structured" | "Unstructured";
  shortlist: boolean;
};
export function assessmentGaps(entries: AssessmentEntry[]) {
  return entries.filter(
    (e) =>
      !e.owner.trim() ||
      !e.evidence.trim() ||
      !e.specification.trim() ||
      !["Available", "Controlled"].includes(e.status) ||
      (e.kind === "data-card" &&
        (e.origin === "Unknown" || e.structure === "Unknown")) ||
      (e.kind === "risk-card" && !e.action.trim()),
  );
}
