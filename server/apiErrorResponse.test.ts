import { describe, expect, it, vi } from "vitest";
import type { Response } from "express";

import { DraftAutomationCreationError } from "./automation-builder/draftAutomationCreation.js";
import { sendApiError } from "./apiErrorResponse.js";

describe("sendApiError", () => {
  it("serializes safe diagnostics on draft automation creation errors", () => {
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    sendApiError(
      response as unknown as Response,
      new DraftAutomationCreationError(
        "INVALID_LLM_RESPONSE",
        "The configured draft automation creator did not return the required creation result shape.",
        502,
        {
          failureType: "invalid_json",
          model: "openrouter/free",
          stage: "assistant-json",
          providerStatus: 200,
          guidance: "The model returned assistant content that was not parseable JSON."
        }
      )
    );

    expect(response.status).toHaveBeenCalledWith(502);
    expect(response.json).toHaveBeenCalledWith({
      error: {
        code: "INVALID_LLM_RESPONSE",
        message: "The configured draft automation creator did not return the required creation result shape.",
        diagnostics: {
          failureType: "invalid_json",
          model: "openrouter/free",
          stage: "assistant-json",
          providerStatus: 200,
          guidance: "The model returned assistant content that was not parseable JSON."
        }
      }
    });
  });
});
