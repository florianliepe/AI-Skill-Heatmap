export type Vision = {
  id: string;
  title: string;
  statement: string;
  purpose: string;
  horizon: string;
  owner: string;
};
export type Objective = {
  id: string;
  title: string;
  description: string;
  owner: string;
  period: string;
  pillar: string;
};
export type KeyResult = {
  id: string;
  objectiveId: string;
  title: string;
  baseline: number;
  target: number;
  current: number | null;
  unit: string;
  owner: string;
  dueDate: string;
  evidence: string;
  updatedAt?: string;
};
export type Skill = {
  id: string;
  name: string;
  family: string;
  definition: string;
  levels: string[];
  relevance: number;
  impact: number;
  upskilling: number;
  horizon: string;
  status: string;
  evidence: string;
};
export type Role = {
  id: string;
  name: string;
  accountability: string;
  workMode: string;
};
export type Assessment = {
  id: string;
  roleId: string;
  skillId: string;
  target: number;
  current: number | null;
  evidence: string;
  priority: string;
};
export type CanvasNode = {
  id: string;
  label: string;
  category: string;
  description: string;
  currentState: string;
  targetState: string;
  owner: string;
  mode: string;
  x: number;
  y: number;
};
export type CanvasEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
};
export type Audit = {
  id: string;
  at: string;
  action: string;
  collection: string;
  recordId: string;
  label: string;
};
export type Workspace = {
  schemaVersion?: number;
  workItems?: import("./workbench-model").WorkItem[];
  visions: Vision[];
  objectives: Objective[];
  keyResults: KeyResult[];
  skills: Skill[];
  roles: Role[];
  assessments: Assessment[];
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  audit: Audit[];
};
export type Collection = Exclude<
  keyof Workspace,
  "audit" | "schemaVersion" | "workItems"
>;
export type RecordValue = Workspace[Collection][number];
export type Snapshot = { data: Workspace; revision: number };
