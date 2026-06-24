export const nodeTypes = [
  "deterministic",
  "perception",
  "llm",
  "control",
  "verification"
] as const;

export type DraftNodeType = (typeof nodeTypes)[number];

export interface DraftAutomationStep {
  title: string;
  nodeType: DraftNodeType;
  description: string;
}

export interface DraftAutomation {
  name: string;
  summary: string;
  steps: DraftAutomationStep[];
}

export interface SavedAutomationCandidate extends DraftAutomation {
  id: string;
  createdAt: string;
}
