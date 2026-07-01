import type {
  ApiErrorDiagnostics,
  ApiErrorResponse,
  AutomationRunResponse,
  AutomationRunsResponse,
  ClarificationAnswerPickerResponse,
  DeleteSavedAutomationResponse,
  DraftAutomationCreationResponse,
  ReplaceSavedAutomationResponse,
  RunAutomationResponse,
  SavedAutomationsResponse,
  SaveDraftAutomationResponse
} from "../../shared/apiResponses";
import type {
  ClarificationAnswer,
  ClarificationAnswerKind,
  DraftAutomation,
  DraftAutomationCreationResult,
  SavedAutomation
} from "../../shared/automationDraft";
import type { AutomationRun } from "../../shared/automationRun";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly diagnostics?: ApiErrorDiagnostics
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function createDraftAutomationCreationResult(
  prompt: string,
  clarificationAnswers: ClarificationAnswer[] = []
): Promise<DraftAutomationCreationResult> {
  const payload = await requestJson<DraftAutomationCreationResponse>(
    "/api/draft-automation",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt, clarificationAnswers })
    },
    "AutoM8 could not create a draft."
  );

  return payload.creationResult;
}

export async function pickClarificationAnswer(answerKind: ClarificationAnswerKind): Promise<string | null> {
  const payload = await requestJson<ClarificationAnswerPickerResponse>(
    "/api/clarification-answer-picker",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ answerKind })
    },
    "AutoM8 could not open the local picker."
  );

  return payload.selectedPath;
}

export async function fetchSavedAutomations(): Promise<SavedAutomation[]> {
  const payload = await requestJson<SavedAutomationsResponse>(
    "/api/saved-automations",
    undefined,
    "AutoM8 could not load saved automations."
  );

  return payload.savedAutomations;
}

export async function saveDraftAutomation(draft: DraftAutomation): Promise<SaveDraftAutomationResponse> {
  return requestJson<SaveDraftAutomationResponse>(
    "/api/saved-automations",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ draft })
    },
    "AutoM8 could not save the draft."
  );
}

export async function createSavedAutomationEditDraft(
  automationId: string,
  prompt: string,
  clarificationAnswers: ClarificationAnswer[] = []
): Promise<DraftAutomationCreationResult> {
  const payload = await requestJson<DraftAutomationCreationResponse>(
    `/api/saved-automations/${encodeURIComponent(automationId)}/edit-draft`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt, clarificationAnswers })
    },
    "AutoM8 could not create an edited draft."
  );

  return payload.creationResult;
}

export async function replaceSavedAutomation(
  automationId: string,
  draft: DraftAutomation
): Promise<ReplaceSavedAutomationResponse> {
  return requestJson<ReplaceSavedAutomationResponse>(
    `/api/saved-automations/${encodeURIComponent(automationId)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ draft })
    },
    "AutoM8 could not save automation changes."
  );
}

export async function deleteSavedAutomation(automationId: string): Promise<DeleteSavedAutomationResponse> {
  return requestJson<DeleteSavedAutomationResponse>(
    `/api/saved-automations/${encodeURIComponent(automationId)}`,
    {
      method: "DELETE"
    },
    "AutoM8 could not delete the saved automation."
  );
}

export async function fetchAutomationRuns(): Promise<AutomationRun[]> {
  const payload = await requestJson<AutomationRunsResponse>(
    "/api/automation-runs",
    undefined,
    "AutoM8 could not load automation runs."
  );

  return payload.runs;
}

export async function runSavedAutomation(automationId: string): Promise<AutomationRun> {
  const payload = await requestJson<RunAutomationResponse>(
    `/api/saved-automations/${automationId}/run`,
    {
      method: "POST"
    },
    "AutoM8 could not run the automation."
  );

  return payload.run;
}

export async function decideAutomationApproval(
  runId: string,
  approvalId: string,
  decision: "approve" | "deny"
): Promise<AutomationRun> {
  const payload = await requestJson<AutomationRunResponse>(
    `/api/automation-runs/${runId}/approvals/${approvalId}/${decision}`,
    {
      method: "POST"
    },
    "AutoM8 could not update the approval."
  );

  return payload.run;
}

async function requestJson<T>(path: string, init: RequestInit | undefined, fallbackMessage: string): Promise<T> {
  const response = await fetch(path, init);
  const payload = (await response.json()) as T | ApiErrorResponse;

  if (!response.ok || isApiErrorResponse(payload)) {
    const apiError = isApiErrorResponse(payload) ? payload.error : undefined;
    throw new ApiClientError(apiError?.message ?? fallbackMessage, apiError?.code, apiError?.diagnostics);
  }

  return payload;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "object" &&
    value.error !== null &&
    "message" in value.error &&
    typeof value.error.message === "string"
  );
}
