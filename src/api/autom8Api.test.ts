import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ApiClientError,
  createDraftAutomationCreationResult,
  createSavedAutomationEditDraft,
  replaceSavedAutomation
} from "./autom8Api";

describe("autom8Api draft automation creation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("preserves safe diagnostics from draft creation API errors", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse(
        {
          error: {
            code: "INVALID_LLM_RESPONSE",
            message:
              "The configured draft automation creator did not return the required creation result shape.",
            diagnostics: {
              failureType: "invalid_json",
              model: "openrouter/free",
              stage: "assistant-json",
              providerStatus: 200,
              guidance: "The model returned assistant content that was not parseable JSON."
            }
          }
        },
        { status: 502 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(createDraftAutomationCreationResult("Open Notepad and type hello")).rejects.toMatchObject({
      name: "ApiClientError",
      message: "The configured draft automation creator did not return the required creation result shape.",
      code: "INVALID_LLM_RESPONSE",
      diagnostics: {
        failureType: "invalid_json",
        model: "openrouter/free",
        stage: "assistant-json",
        providerStatus: 200,
        guidance: "The model returned assistant content that was not parseable JSON."
      }
    } satisfies Partial<ApiClientError>);
  });
});

describe("autom8Api saved automation editing", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests an edited draft for an existing saved automation", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        creationResult: {
          status: "needs_clarification",
          draft: null,
          questions: [
            {
              id: "slack-channel",
              question: "Which Slack channel should AutoM8 use?",
              reason: "The edit asks for Slack without a concrete destination."
            }
          ]
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await createSavedAutomationEditDraft("saved 1", "Also post this to Slack.", [
      { questionId: "team", answer: "Revenue team" }
    ]);

    expect(result.status).toBe("needs_clarification");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/saved-automations/saved%201/edit-draft",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          prompt: "Also post this to Slack.",
          clarificationAnswers: [{ questionId: "team", answer: "Revenue team" }]
        })
      })
    );
  });

  it("replaces a saved automation with an edited draft", async () => {
    const draft = {
      name: "Updated",
      summary: "Updated saved automation.",
      steps: [
        {
          title: "Updated step",
          nodeType: "deterministic" as const,
          description: "Do the updated work.",
          details: {
            inputs: ["Input"],
            outputs: ["Output"],
            fallbacks: ["Fallback"],
            verification: ["Verified"]
          }
        }
      ]
    };
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        savedAutomationCandidate: {
          ...draft,
          id: "saved-1",
          createdAt: "2026-06-24T12:00:00.000Z"
        },
        savedAutomationCandidates: [
          {
            ...draft,
            id: "saved-1",
            createdAt: "2026-06-24T12:00:00.000Z"
          }
        ]
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await replaceSavedAutomation("saved-1", draft);

    expect(result.savedAutomationCandidate.id).toBe("saved-1");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/saved-automations/saved-1",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ draft })
      })
    );
  });
});

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    },
    ...init
  });
}
