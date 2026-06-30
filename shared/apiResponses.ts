import { DraftAutomationCreationResult, SavedAutomation } from "./automationDraft.js";
import { AutomationRun } from "./automationRun.js";

export interface DraftAutomationCreationResponse {
  creationResult: DraftAutomationCreationResult;
}

export interface SavedAutomationsResponse {
  savedAutomations: SavedAutomation[];
}

export interface SaveDraftAutomationResponse extends SavedAutomationsResponse {
  savedAutomation: SavedAutomation;
}

export interface ReplaceSavedAutomationResponse extends SavedAutomationsResponse {
  savedAutomation: SavedAutomation;
}

export interface DeleteSavedAutomationResponse extends SavedAutomationsResponse {}

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
