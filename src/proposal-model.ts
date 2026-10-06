export const proposalFields = ["design", "alternative", "nextAction"] as const;
export type Proposal = {
  field: (typeof proposalFields)[number];
  proposed: string;
  reason: string;
};
export type ChallengerResult = {
  caseId: string;
  revision: number;
  proposals: Proposal[];
  questions: string[];
};
export function parseProposal(
  raw: unknown,
): Pick<ChallengerResult, "proposals" | "questions"> {
  let value: unknown = raw;
  if (typeof raw === "string") {
    const clean = raw
      .trim()
      .replace(/^```(?:json)?\s*/, "")
      .replace(/\s*```$/, "");
    value = JSON.parse(clean);
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(
      "The challenger did not return a valid proposal. Try a more specific question.",
    );
  const result = value as Record<string, unknown>;
  if (
    Object.keys(result).some((k) => !["proposals", "questions"].includes(k)) ||
    !Array.isArray(result.proposals) ||
    result.proposals.length > 3 ||
    !Array.isArray(result.questions) ||
    result.questions.length > 5
  )
    throw new Error(
      "The proposal has unsupported fields. No changes were applied.",
    );
  const fields = new Set<string>();
  for (const p of result.proposals) {
    if (
      !p ||
      typeof p !== "object" ||
      Object.keys(p).some(
        (k) => !["field", "proposed", "reason"].includes(k),
      ) ||
      !proposalFields.includes(p.field) ||
      fields.has(p.field) ||
      typeof p.proposed !== "string" ||
      !p.proposed.trim() ||
      p.proposed.length > 4000 ||
      typeof p.reason !== "string" ||
      !p.reason.trim() ||
      p.reason.length > 1500
    )
      throw new Error(
        "The challenger returned an invalid edit. No changes were applied.",
      );
    fields.add(p.field);
  }
  if (
    result.questions.some(
      (q) => typeof q !== "string" || !q.trim() || q.length > 800,
    )
  )
    throw new Error("The challenger returned invalid questions.");
  return {
    proposals: result.proposals as Proposal[],
    questions: result.questions as string[],
  };
}
