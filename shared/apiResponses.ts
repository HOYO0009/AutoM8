import { DraftAutomation, SavedAutomationCandidate } from "./automationDraft.js";
import { AutomationRun } from "./automationRun.js";

export interface DraftAutomationResponse {
  draft: DraftAutomation;
}

export interface SavedAutomationCandidatesResponse {
  savedAutomationCandidates: SavedAutomationCandidate[];
}

export interface SaveDraftAutomationCandidateResponse extends SavedAutomationCandidatesResponse {
  savedAutomationCandidate: SavedAutomationCandidate;
}

export interface RunAutomationResponse {
  runId: string;
  run: AutomationRun;
}

export interface AutomationRunsResponse {
  runs: AutomationRun[];
}

export interface AutomationRunResponse {
  run: AutomationRun;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
