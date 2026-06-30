import { DraftAutomationCreationResult, SavedAutomationCandidate } from "./automationDraft.js";
import { AutomationRun } from "./automationRun.js";

export interface DraftAutomationCreationResponse {
  creationResult: DraftAutomationCreationResult;
}

export interface SavedAutomationCandidatesResponse {
  savedAutomationCandidates: SavedAutomationCandidate[];
}

export interface SaveDraftAutomationCandidateResponse extends SavedAutomationCandidatesResponse {
  savedAutomationCandidate: SavedAutomationCandidate;
}

export interface ReplaceSavedAutomationCandidateResponse extends SavedAutomationCandidatesResponse {
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

export type ApiErrorDiagnosticFailureType =
  | "provider_rejection"
  | "invalid_assistant_message"
  | "invalid_json"
  | "invalid_creation_result_shape";

export interface ApiErrorDiagnostics {
  failureType?: ApiErrorDiagnosticFailureType;
  model?: string;
  stage?: string;
  providerStatus?: number;
  guidance?: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    diagnostics?: ApiErrorDiagnostics;
  };
}
