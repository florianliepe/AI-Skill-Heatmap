export const categories = [
  "Organize information",
  "Fulfill tasks",
  "Decision support",
  "Conversation",
  "Listen & understand",
  "Optimize processes",
];
export const stages = [
  "Captured",
  "Framed",
  "Experiment planned",
  "Piloting",
  "In use",
  "Paused",
  "Archived",
];
export const evidenceStates = [
  "Assumption",
  "Source-supported",
  "Sampled",
  "Pilot-observed",
];
export type Economics = {
  volume: number | null;
  adoption: number | null;
  baseline: number | null;
  assisted: number | null;
  review: number | null;
  rate: number | null;
  realization: number | null;
  recurring: number | null;
  setup: number | null;
};
export type WorkItem = {
  sessionId?: string;
  workDesign?: import("./sprint-model").WorkDesign;
  id: string;
  kind: "idea" | "usecase";
  title: string;
  problem: string;
  process: string;
  session: string;
  categories: string[];
  methodVersion: string;
  owner: string;
  objectiveId: string;
  nodeId: string;
  sourceIds: string[];
  stage: string;
  evidence: string;
  evidenceNote: string;
  assumptionsNote: string;
  impact: number | null;
  nextAction: string;
  due: string;
  design: string;
  alternative: string;
  valueIntent: string;
  economics: Economics;
  overlap: string;
  experiment: {
    hypothesis: string;
    measure: string;
    unit: string;
    baseline: number | null;
    target: number | null;
    sample: string;
    stopRule: string;
    owner: string;
    due: string;
  };
  observations: {
    id: string;
    date: string;
    value: number;
    sample: string;
    evidence: string;
  }[];
  decisions: {
    id: string;
    date: string;
    action: string;
    owner: string;
    rationale: string;
  }[];
  enablement: {
    id: string;
    roleId: string;
    skillId: string;
    target: number;
    owner: string;
    action: string;
    due: string;
    criterion: string;
    status: string;
  }[];
};
export function newWorkItem(): WorkItem {
  return {
    id: crypto.randomUUID(),
    kind: "idea",
    title: "",
    problem: "",
    process: "",
    session: "",
    categories: [],
    methodVersion: "sprint-provisional-1",
    owner: "",
    objectiveId: "",
    nodeId: "",
    sourceIds: [],
    stage: "Captured",
    evidence: "Assumption",
    evidenceNote: "",
    assumptionsNote: "",
    impact: null,
    nextAction: "",
    due: "",
    design: "",
    alternative: "",
    valueIntent: "Capacity",
    overlap: "",
    economics: {
      volume: null,
      adoption: null,
      baseline: null,
      assisted: null,
      review: null,
      rate: null,
      realization: null,
      recurring: null,
      setup: null,
    },
    experiment: {
      hypothesis: "",
      measure: "",
      unit: "",
      baseline: null,
      target: null,
      sample: "",
      stopRule: "",
      owner: "",
      due: "",
    },
    observations: [],
    decisions: [],
    enablement: [],
  };
}
export function valueModel(e: Economics) {
  const hours = [e.volume, e.adoption, e.baseline, e.assisted, e.review].some(
    (x) => x === null,
  )
    ? null
    : (((e.volume! * e.adoption!) / 100) *
        (e.baseline! - e.assisted! - e.review!)) /
        60 +
      0;
  const capacity = hours === null || e.rate === null ? null : hours * e.rate;
  const cash =
    capacity === null || e.realization === null
      ? null
      : (capacity * e.realization) / 100;
  const net = cash === null || e.recurring === null ? null : cash - e.recurring;
  return {
    hours,
    capacity,
    cash,
    net,
    firstYear: net === null || e.setup === null ? null : net - e.setup,
    payback:
      net === null || net <= 0 || e.setup === null ? null : e.setup / net,
  };
}
export function readiness(w: WorkItem) {
  return [
    ["Experiment owner", w.experiment.owner],
    ["Hypothesis", w.experiment.hypothesis],
    ["Measure and unit", w.experiment.measure && w.experiment.unit],
    ["Representative sample / baseline plan", w.experiment.sample],
    ["Success threshold", w.experiment.target !== null],
    ["Stop rule", w.experiment.stopRule],
    ["Review date", w.experiment.due],
  ]
    .filter((x) => !x[1])
    .map((x) => String(x[0]));
}
export function cellSummary(items: WorkItem[]) {
  const assessed = items.filter(
    (i) => i.impact !== null && i.evidenceNote.trim(),
  );
  const scores = assessed.map((i) => i.impact!).sort((a, b) => a - b);
  const mid = Math.floor(scores.length / 2);
  return {
    total: items.length,
    assessed: assessed.length,
    median: scores.length
      ? scores.length % 2
        ? scores[mid]
        : (scores[mid - 1] + scores[mid]) / 2
      : null,
  };
}
export function mergeFields(base: WorkItem, mine: WorkItem, latest: WorkItem) {
  const merged = { ...latest };
  const conflicts: string[] = [];
  for (const key of Object.keys(mine) as (keyof WorkItem)[]) {
    if (JSON.stringify(base[key]) === JSON.stringify(mine[key])) continue;
    if (
      JSON.stringify(base[key]) !== JSON.stringify(latest[key]) &&
      JSON.stringify(mine[key]) !== JSON.stringify(latest[key])
    )
      conflicts.push(key);
    else (merged as Record<string, unknown>)[key] = mine[key];
  }
  return { merged, conflicts };
}
export function sampleItems(): WorkItem[] {
  const items: WorkItem[] = [
    [
      "Ready-to-develop requirements",
      "Demand & requirements",
      ["Organize information", "Conversation"],
      4,
      "Source-supported",
    ],
    [
      "Contract renewal review",
      "Licence management",
      ["Organize information", "Decision support"],
      3,
      "Sampled",
    ],
    [
      "Energy anomaly investigation",
      "Energy efficiency",
      ["Decision support", "Optimize processes"],
      5,
      "Assumption",
    ],
    [
      "Request triage",
      "Demand & requirements",
      ["Fulfill tasks", "Listen & understand"],
      null,
      "Assumption",
    ],
    [
      "Licence evidence pack",
      "Licence management",
      ["Fulfill tasks"],
      2,
      "Source-supported",
    ],
    [
      "Consumption forecast",
      "Energy efficiency",
      ["Optimize processes"],
      null,
      "Assumption",
    ],
  ].map((row, i) => ({
    ...newWorkItem(),
    id: "example-" + i,
    title: String(row[0]),
    problem:
      "Illustrative opportunity for exploring the workbench. Validate the problem and evidence with your team.",
    process: String(row[1]),
    categories: row[2] as string[],
    impact: row[3] as number | null,
    evidence: String(row[4]),
    evidenceNote:
      row[3] === null
        ? ""
        : "Illustrative assessment only; not client evidence.",
    kind: i < 3 ? "usecase" : "idea",
    stage: i < 3 ? "Framed" : "Captured",
    session: "Example sprint",
    owner: "Example owner",
  }));
  Object.assign(items[0], {
    workDesign: {
      currentWork:
        "Manual clarification across requester, service provider and developer.",
      input: "Requester notes, system constraints and approved standards.",
      aiTask:
        "Structure a requirements draft and flag missing acceptance criteria.",
      humanJudgment:
        "Requirements engineer challenges the proposal; requester confirms the need.",
      handover:
        "Developer confirms readiness. Unresolved critical gaps return to the requester.",
      output:
        "Reviewed requirements package with source links and acceptance criteria.",
      tools: "Approved knowledge store and controlled workflow service.",
      autonomy: "AI augmented",
    },
    stage: "Piloting",
    design:
      "AI structures source material and challenges gaps. A requirements engineer reviews the package; the developer confirms readiness.",
    alternative:
      "Use a consistent template and checklist without AI as the comparison.",
    assumptionsNote:
      "Fictional demonstration assumptions. Replace with a measured baseline before investment decisions.",
    economics: {
      volume: 2400,
      adoption: 75,
      baseline: 120,
      assisted: 60,
      review: 20,
      rate: 80,
      realization: 25,
      recurring: 18000,
      setup: 45000,
    },
    experiment: {
      hypothesis:
        "Reduce request handling time while preserving review quality",
      measure: "Minutes per request",
      unit: "minutes",
      baseline: 120,
      target: 80,
      sample:
        "Illustrative batches of 10 requests; compare like-for-like complexity",
      stopRule: "Stop if a critical requirement is missed",
      owner: "Example owner",
      due: "2026-11-15",
    },
    observations: [100, 90, 82].map((value, i) => ({
      id: "example-observation-" + i,
      date: `2026-10-${String(5 + i * 7).padStart(2, "0")}`,
      value,
      sample: "Fictional batch of 10",
      evidence: "Illustrative values only; not measured client results",
    })),
    decisions: [
      {
        id: "example-decision",
        date: "2026-10-05",
        action: "Test",
        owner: "Example owner",
        rationale:
          "Fictional decision: test a limited sample before committing to scale.",
      },
    ],
  });
  return items;
}
