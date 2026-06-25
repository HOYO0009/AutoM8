import {
  ApiErrorResponse,
  AutomationRun,
  AutomationRunResponse,
  AutomationRunsResponse,
  ClarificationAnswer,
  DraftAutomation,
  DraftAutomationCreationResult,
  DraftAutomationCreationResponse,
  ReplaceSavedAutomationCandidateResponse,
  RunAutomationResponse,
  SavedAutomationCandidate,
  SavedAutomationCandidatesResponse,
  SaveDraftAutomationCandidateResponse
} from "../../shared/draftAutomation";

export class ApiClientError extends Error {
  constructor(message: string) {
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

export async function fetchSavedAutomationCandidates(): Promise<SavedAutomationCandidate[]> {
  const payload = await requestJson<SavedAutomationCandidatesResponse>(
    "/api/saved-automations",
    undefined,
    "AutoM8 could not load saved automations."
  );

  return payload.savedAutomationCandidates;
}

export async function saveDraftAutomation(draft: DraftAutomation): Promise<SaveDraftAutomationCandidateResponse> {
  return requestJson<SaveDraftAutomationCandidateResponse>(
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
): Promise<ReplaceSavedAutomationCandidateResponse> {
  return requestJson<ReplaceSavedAutomationCandidateResponse>(
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
    throw new ApiClientError(isApiErrorResponse(payload) ? payload.error.message : fallbackMessage);
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
