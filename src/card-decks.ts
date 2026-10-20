import type { MethodCard } from "./method-model";

export const cardClusters = [
  "AI thinks and acts",
  "AI perceives and communicates",
  "AI creates and controls",
  "Supporting technologies & open ideas",
  "Other methods",
];
const names = [
  "Finds and organizes information",
  "Interprets data",
  "Forecasts",
  "Decides and recommends",
  "Performs tasks",
  "Sees",
  "Reads and writes",
  "Hears and talks",
  "Senses the environment",
  "Creates",
  "Optimizes complex processes and systems",
  "Controls machines and robots",
  "Technologies that combine with AI",
  "Joker",
];
// Sampled from the category-guide PDFs on the source board. Labels accompany colour.
const colors = [
  "#e4a809",
  "#f46a2a",
  "#4dbe5a",
  "#ed0a91",
  "#ed1c24",
  "#99187f",
  "#743aa0",
  "#5443a3",
  "#2980c7",
  "#3d919f",
  "#4fc3b4",
  "#8acd25",
  "#aac110",
  "#858687",
];
export function cardCategory(card: MethodCard) {
  const guide =
    card.kind === "ai-card" && card.category === "Category guides"
      ? /^([A-M])\s*[·.]/.exec(card.title)?.[1]
      : undefined;
  const index = guide
    ? guide.charCodeAt(0) - 65
    : names.findIndex((n) => n.toLowerCase() === card.category.toLowerCase());
  return {
    code: index < 0 ? "—" : String.fromCharCode(65 + index),
    name: names[index] || card.category,
    color: colors[index] || "#858687",
    cluster: index < 0 ? 4 : index < 5 ? 0 : index < 9 ? 1 : index < 12 ? 2 : 3,
  };
}
export type CardDeck = "mapping" | "concept";
