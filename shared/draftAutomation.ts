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

export interface DraftAutomationResponse {
  draft: DraftAutomation;
}

export interface SavedAutomationsResponse {
  savedAutomations: SavedAutomation[];
}

export interface SaveDraftAutomationResponse extends SavedAutomationsResponse {
  savedAutomation: SavedAutomation;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
