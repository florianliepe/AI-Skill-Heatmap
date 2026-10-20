export type MethodCard = {
  kind?: "method" | "ai-card";
  backText?: string;
  backSourceUrl?: string;
  explanation?: string;
  tags?: string;
  reviewStatus?: "unreviewed" | "reviewed";
  backlogOwner?: string;
  nextAction?: string;
  dueDate?: string;
  applicationNotes?: string;
  applicationIds?: string[];
  id: string;
  title: string;
  category: string;
  body: string;
  sourceUrl: string;
  version: string;
};
export function cardCoverage(card: MethodCard) {
  if (card.kind !== "ai-card") return "Method extract";
  if (!card.body.trim()) return "Missing front";
  if (!card.backText?.trim()) return "Missing reverse";
  if (!card.backSourceUrl?.trim()) return "Missing reverse source";
  if (!card.explanation?.trim()) return "Needs explanation";
  return card.reviewStatus === "reviewed" ? "Reviewed" : "Needs review";
}
export function cardSearchText(card: MethodCard) {
  return [
    card.title,
    card.category,
    card.body,
    card.backText,
    card.explanation,
    card.tags,
    card.applicationNotes,
    card.nextAction,
  ]
    .join(" ")
    .toLowerCase();
}
export type Mapping = {
  strategy: string;
  pain: string;
  sharedSolution: string;
  costOfDelay: string;
  dataReadiness: string;
  humanValue: string;
  businessViability: string;
  costRationale: string;
  implementationCost: number | null;
  dependencies: string[];
};
export const emptyMapping = (): Mapping => ({
  strategy: "",
  pain: "",
  sharedSolution: "",
  costOfDelay: "",
  dataReadiness: "",
  humanValue: "",
  businessViability: "",
  costRationale: "",
  implementationCost: null,
  dependencies: [],
});
export function safeSource(url: string) {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}
