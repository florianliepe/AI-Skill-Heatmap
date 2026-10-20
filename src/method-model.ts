export type MethodCard = {
  id: string;
  title: string;
  category: string;
  body: string;
  sourceUrl: string;
  version: string;
};
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
