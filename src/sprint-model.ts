import type { WorkItem } from "./workbench-model";
export const sprintModules = [
  "Awareness",
  "Opportunity mapping",
  "Process automation",
  "Products & services",
];
export type SprintSession = {
  id: string;
  title: string;
  problem: string;
  scope: string;
  facilitator: string;
  participants: string;
  module: string;
  methodVersion: string;
  date: string;
  outcome: string;
};
export type WorkDesign = {
  currentWork: string;
  input: string;
  aiTask: string;
  humanJudgment: string;
  handover: string;
  output: string;
  tools: string;
  autonomy: string;
};
export const emptyDesign = (): WorkDesign => ({
  currentWork: "",
  input: "",
  aiTask: "",
  humanJudgment: "",
  handover: "",
  output: "",
  tools: "",
  autonomy: "AI supported",
});
export const newSession = (): SprintSession => ({
  id: crypto.randomUUID(),
  title: "",
  problem: "",
  scope: "",
  facilitator: "",
  participants: "",
  module: "Opportunity mapping",
  methodVersion: "studio-guidance-2",
  date: "",
  outcome: "",
});
export const capabilityGuidance = [
  {
    category: "Organize information",
    verb: "Find the signal",
    description:
      "Turn scattered content into a usable, traceable knowledge base.",
    questions: [
      "Where do people repeatedly search or reconcile information?",
      "Which source is authoritative, and how do users check a statement?",
    ],
    example: "Assemble a requirements evidence pack with source references.",
  },
  {
    category: "Fulfill tasks",
    verb: "Reduce repeated work",
    description: "Draft or execute well-defined steps with explicit checks.",
    questions: [
      "Can the task be described with a stable input and acceptance test?",
      "Which exceptions need a human, and what happens after a failed check?",
    ],
    example:
      "Prepare a service request and check required fields before handover.",
  },
  {
    category: "Decision support",
    verb: "Improve a judgment",
    description:
      "Compare options and explain a recommendation for an accountable decision maker.",
    questions: [
      "Which decision needs better evidence rather than more output?",
      "How will the team test false positives, bias and the cost of a wrong decision?",
    ],
    example: "Compare renewal options while retaining commercial approval.",
  },
  {
    category: "Conversation",
    verb: "Clarify a need",
    description: "Use dialogue to elicit context and resolve ambiguity.",
    questions: [
      "Which question unlocks the next useful decision?",
      "How can the requester correct a misunderstanding or reach a person?",
    ],
    example: "Interview a requester about missing acceptance criteria.",
  },
  {
    category: "Listen & understand",
    verb: "Interpret a signal",
    description:
      "Extract meaning from speech, images or unstructured observations.",
    questions: [
      "What can the source reliably tell us, and what remains uncertain?",
      "How will a reviewer spot omitted context or recognition errors?",
    ],
    example:
      "Turn a workshop recording into candidate requirements for review.",
  },
  {
    category: "Optimize processes",
    verb: "Improve a sequence",
    description:
      "Explore changes to connected tasks under operational constraints.",
    questions: [
      "Which outcome and constraints define a better process?",
      "How do we test the recommendation safely against the existing process?",
    ],
    example: "Evaluate energy operating schedules under service constraints.",
  },
];
export function deliveryCoverage(items: WorkItem[]) {
  const cases = items.filter(
    (w) => w.kind === "usecase" && w.stage !== "Archived",
  );
  const definitions = [
    {
      id: "target",
      title: "AI target picture",
      test: (w: WorkItem) => !!w.objectiveId && !!w.nodeId,
      missing: "Link an objective and a target-picture shift",
      section: "Design",
    },
    {
      id: "work",
      title: "AI working approach",
      test: (w: WorkItem) => {
        const d = { ...emptyDesign(), ...w.workDesign };
        return [
          "currentWork",
          "input",
          "aiTask",
          "humanJudgment",
          "handover",
          "output",
        ].every((k) => !!d[k as keyof WorkDesign].trim());
      },
      missing: "Describe inputs, AI work, human judgment, handover and outputs",
      section: "Design",
    },
    {
      id: "team",
      title: "Team enablement",
      test: (w: WorkItem) => w.enablement.length > 0,
      missing: "Assign a role, skill, learning action and evidence criterion",
      section: "Design",
    },
  ];
  return definitions.map((d) => ({
    ...d,
    total: cases.length,
    covered: cases.filter(d.test).length,
    gaps: cases.filter((w) => !d.test(w)),
  }));
}
