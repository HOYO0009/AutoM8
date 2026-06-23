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

export interface SavedAutomation extends DraftAutomation {
  id: string;
  createdAt: string;
}

export type AutomationRunStatus = "completed" | "failed";
export type AutomationStepRunStatus = "completed" | "failed";

export interface AutomationStepRun {
  title: string;
  nodeType: DraftNodeType;
  status: AutomationStepRunStatus;
  message: string;
}

export interface AutomationRun {
  id: string;
  automationId: string;
  status: AutomationRunStatus;
  startedAt: string;
  completedAt: string;
  steps: AutomationStepRun[];
}

export interface DraftAutomationResponse {
  draft: DraftAutomation;
}

export interface SavedAutomationsResponse {
  savedAutomations: SavedAutomation[];
}

export interface SaveDraftAutomationResponse extends SavedAutomationsResponse {
  savedAutomation: SavedAutomation;
}

export interface RunAutomationResponse {
  run: AutomationRun;
  runs: AutomationRun[];
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
