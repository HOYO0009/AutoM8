import { Response } from "express";

import { DraftAutomationCreationError } from "./automation-builder/draftGenerator.js";
import { SaveAutomationCandidateError } from "./automation-builder/savedAutomationCandidateStore.js";
import { ExecutableActionPlanningError } from "./automation-runner/executableActionPlanner.js";
import { RunAutomationError } from "./automation-runner/automationRunStore.js";
import type { ApiErrorDiagnostics } from "../shared/apiResponses.js";
import { DraftValidationError } from "../shared/draftValidation.js";

export function sendApiError(response: Response, error: unknown): void {
  const apiError = toApiError(error);
  const errorBody = {
    code: apiError.code,
    message: apiError.message,
    ...(apiError.diagnostics ? { diagnostics: apiError.diagnostics } : {})
  };

  response.status(apiError.status).json({
    error: errorBody
  });
}

function toApiError(error: unknown): {
  code: string;
  message: string;
  status: number;
  diagnostics?: ApiErrorDiagnostics;
} {
  if (error instanceof DraftAutomationCreationError) {
    return {
      code: error.code,
      message: error.message,
      status: error.status,
      diagnostics: error.diagnostics
    };
  }

  if (error instanceof DraftValidationError) {
    return {
      code: "INVALID_DRAFT_AUTOMATION_CREATION_REQUEST",
      message: "Answer every clarification question before continuing.",
      status: 400
    };
  }

  if (error instanceof SaveAutomationCandidateError) {
    return {
      code: error.code,
      message: error.message,
      status: error.status
    };
  }

  if (error instanceof RunAutomationError) {
    return {
      code: error.code,
      message: error.message,
      status: error.status
    };
  }

  if (error instanceof ExecutableActionPlanningError) {
    return {
      code: error.code,
      message: error.message,
      status: error.status
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message: "AutoM8 could not generate a draft automation.",
    status: 500
  };
}
