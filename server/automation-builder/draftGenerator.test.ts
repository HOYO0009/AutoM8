import { describe, expect, it, vi } from "vitest";

import { SavedAutomationCandidate } from "../../shared/automationDraft.js";
import { createDraftAutomationCreationResult } from "./draftGenerator.js";

describe("createDraftAutomationCreationResult", () => {
  it("rejects an empty prompt", async () => {
    await expect(
      createDraftAutomationCreationResult("   ", [], {
        apiKey: "test-key",
        model: "test-model"
      })
    ).rejects.toMatchObject({
      code: "EMPTY_PROMPT"
    });
  });

  it("reports missing OpenRouter configuration", async () => {
    await expect(
      createDraftAutomationCreationResult("Open Notepad and type hello", [], {})
    ).rejects.toMatchObject({
      code: "LLM_CONFIG_MISSING"
    });
  });

  it("returns Clarification Questions before creating an incomplete Draft Automation", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                status: "needs_clarification",
                draft: null,
                questions: [
                  {
                    id: "sales-spreadsheet",
                    question: "Which sales spreadsheet should AutoM8 open?",
                    reason: "The workflow names a spreadsheet but not the exact source."
                  },
                  {
                    id: "email-recipients",
                    question: "Who should receive the team email summary?",
                    reason: "Draft Automation Creation needs a concrete destination before modeling the email step."
                  }
                ]
              })
            }
          }
        ]
      })
    );

    const creationResult = await createDraftAutomationCreationResult(
      "Every morning, open the sales spreadsheet, collect yesterday's total revenue, and draft a short email summary for the team.",
      [],
      {
        apiKey: "test-key",
        model: "test-model",
        baseUrl: "https://example.test/",
        fetchImpl
      }
    );

    expect(creationResult).toEqual({
      status: "needs_clarification",
      draft: null,
      questions: [
        {
          id: "sales-spreadsheet",
          question: "Which sales spreadsheet should AutoM8 open?",
          reason: "The workflow names a spreadsheet but not the exact source."
        },
        {
          id: "email-recipients",
          question: "Who should receive the team email summary?",
          reason: "Draft Automation Creation needs a concrete destination before modeling the email step."
        }
      ]
    });

    const requestBody = requestBodyFor(fetchImpl);
    expect(requestBody.provider).toEqual({ require_parameters: true });
    expect(requestBody.response_format.type).toBe("json_schema");
    expect(requestBody.response_format.json_schema.strict).toBe(true);
    expect(requestBody.response_format.json_schema.schema.properties.status.enum).toEqual([
      "needs_clarification",
      "draft_created"
    ]);
    expect(requestBody.messages[1].content).toContain("v1ExecutionBlockers");
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://example.test/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key"
        }),
        signal: expect.any(AbortSignal)
      })
    );
  });

  it("uses Clarification Answers to create a Draft Automation with Draft Step Details", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                status: "draft_created",
                draft: {
                  name: "Daily Sales Summary",
                  summary: "Collect yesterday's revenue and draft a team email.",
                  steps: [
                    {
                      title: "Open sales spreadsheet",
                      nodeType: "deterministic",
                      description: "Open the workbook that contains daily sales data.",
                      details: {
                        inputs: ["C:/Reports/Sales.xlsx"],
                        outputs: ["Sales workbook is open"],
                        fallbacks: ["Ask the user to choose the sales workbook if the file is unavailable"],
                        verification: ["Workbook title shows Sales.xlsx"]
                      }
                    },
                    {
                      title: "Extract yesterday's total revenue",
                      nodeType: "perception",
                      description: "Read the total revenue value for yesterday from the Daily Revenue tab.",
                      details: {
                        inputs: ["Daily Revenue tab", "Date column", "Total Revenue column"],
                        outputs: ["Yesterday's total revenue value"],
                        fallbacks: ["Ask the user to identify the revenue cell if the expected columns are missing"],
                        verification: ["Extracted value is tied to yesterday's date"]
                      }
                    },
                    {
                      title: "Draft team email",
                      nodeType: "llm",
                      description: "Draft a short email summary without sending it.",
                      details: {
                        inputs: ["Sender account: sales@example.com", "Recipients: team@example.com", "Yesterday's total revenue value"],
                        outputs: ["Unsent email draft addressed to the team"],
                        fallbacks: ["Ask for approval before creating the draft if the recipient list is unavailable"],
                        verification: ["Email draft contains the revenue value and remains unsent"]
                      }
                    }
                  ]
                },
                questions: []
              })
            }
          }
        ]
      })
    );

    const clarificationAnswers = [
      { questionId: "sales-spreadsheet", answer: "C:/Reports/Sales.xlsx" },
      { questionId: "revenue-location", answer: "Daily Revenue tab, Date and Total Revenue columns" },
      { questionId: "sender-account", answer: "sales@example.com" },
      { questionId: "email-recipients", answer: "team@example.com" }
    ];

    const creationResult = await createDraftAutomationCreationResult(
      "Every morning, open the sales spreadsheet, collect yesterday's total revenue, and draft a short email summary for the team.",
      clarificationAnswers,
      {
        apiKey: "test-key",
        model: "test-model",
        fetchImpl
      }
    );

    expect(creationResult.status).toBe("draft_created");
    expect(creationResult.draft?.steps[0].details.inputs).toEqual(["C:/Reports/Sales.xlsx"]);
    expect(creationResult.draft?.steps[1].details.outputs).toEqual(["Yesterday's total revenue value"]);
    expect(creationResult.draft?.steps[2].details.verification).toEqual([
      "Email draft contains the revenue value and remains unsent"
    ]);
    expect(JSON.parse(requestBodyFor(fetchImpl).messages[1].content).clarificationAnswers).toEqual(clarificationAnswers);
  });

  it("includes saved automation context when creating an edited Draft Automation", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                status: "draft_created",
                draft: {
                  name: "Daily Sales Summary with Slack",
                  summary: "Collect yesterday's revenue, draft a team email, and post a Slack summary.",
                  steps: [
                    {
                      title: "Open sales spreadsheet",
                      nodeType: "deterministic",
                      description: "Open the workbook that contains daily sales data.",
                      details: {
                        inputs: ["C:/Reports/Sales.xlsx"],
                        outputs: ["Sales workbook is open"],
                        fallbacks: ["Ask the user to choose the sales workbook if the file is unavailable"],
                        verification: ["Workbook title shows Sales.xlsx"]
                      }
                    },
                    {
                      title: "Post Slack summary",
                      nodeType: "llm",
                      description: "Draft a short Slack update for the revenue channel.",
                      details: {
                        inputs: ["Slack channel: #revenue", "Yesterday's total revenue value"],
                        outputs: ["Unsent Slack message draft"],
                        fallbacks: ["Ask for the Slack channel if it is unavailable"],
                        verification: ["Slack draft contains the revenue value and remains unsent"]
                      }
                    }
                  ]
                },
                questions: []
              })
            }
          }
        ]
      })
    );
    const savedAutomationContext: SavedAutomationCandidate = {
      id: "saved-1",
      createdAt: "2026-06-24T12:00:00.000Z",
      name: "Daily Sales Summary",
      summary: "Collect yesterday's revenue and draft a team email.",
      steps: [
        {
          title: "Open sales spreadsheet",
          nodeType: "deterministic",
          description: "Open the workbook that contains daily sales data.",
          details: {
            inputs: ["C:/Reports/Sales.xlsx"],
            outputs: ["Sales workbook is open"],
            fallbacks: ["Ask the user to choose the sales workbook if the file is unavailable"],
            verification: ["Workbook title shows Sales.xlsx"]
          }
        }
      ]
    };

    const creationResult = await createDraftAutomationCreationResult(
      "Also post the summary to #revenue in Slack.",
      [],
      {
        apiKey: "test-key",
        model: "test-model",
        fetchImpl
      },
      { savedAutomationContext }
    );

    expect(creationResult.status).toBe("draft_created");
    const requestBody = requestBodyFor(fetchImpl);
    expect(requestBody.messages[0].content).toContain("complete updated Draft Automation");
    expect(JSON.parse(requestBody.messages[1].content).savedAutomationContext).toEqual({
      name: "Daily Sales Summary",
      summary: "Collect yesterday's revenue and draft a team email.",
      steps: savedAutomationContext.steps
    });
  });

  it("surfaces provider rejection messages", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse(
        {
          error: {
            message: "This model does not support response_format json_schema."
          }
        },
        { status: 400 }
      )
    );

    await expect(
      createDraftAutomationCreationResult("Open Notepad and type hello", [], {
        apiKey: "test-key",
        model: "test-model",
        fetchImpl
      })
    ).rejects.toMatchObject({
      code: "LLM_REQUEST_FAILED",
      message: "This model does not support response_format json_schema."
    });
  });

  it("reports invalid provider JSON with actionable guidance", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        choices: [
          {
            message: {
              content: "not json"
            }
          }
        ]
      })
    );

    await expect(
      createDraftAutomationCreationResult("Open Notepad and type hello", [], {
        apiKey: "test-key",
        model: "test-model",
        fetchImpl
      })
    ).rejects.toMatchObject({
      code: "INVALID_LLM_RESPONSE",
      message:
        "The configured draft automation creator did not return the required creation result shape. Choose an OpenRouter model that supports structured outputs, then try again."
    });

    expect(warnSpy).toHaveBeenCalledWith("AutoM8 draft automation creator returned an invalid response.", {
      model: "test-model",
      stage: "assistant-json",
      providerStatus: 200
    });
    warnSpy.mockRestore();
  });

  it("reports invalid creation result shape with safe diagnostics", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                status: "draft_created",
                draft: null,
                questions: []
              })
            }
          }
        ]
      })
    );

    await expect(
      createDraftAutomationCreationResult("Open Notepad and type hello", [], {
        apiKey: "test-key",
        model: "test-model",
        fetchImpl
      })
    ).rejects.toMatchObject({
      code: "INVALID_LLM_RESPONSE"
    });

    expect(warnSpy).toHaveBeenCalledWith("AutoM8 draft automation creator returned an invalid response.", {
      model: "test-model",
      stage: "creation-result-draft",
      providerStatus: 200
    });
    warnSpy.mockRestore();
  });

  it("reports timed out provider requests", async () => {
    vi.useFakeTimers();
    try {
      const fetchImpl = vi.fn<typeof fetch>(
        (_input, init) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => {
              reject(new DOMException("Aborted", "AbortError"));
            });
          })
      );

      const draftPromise = createDraftAutomationCreationResult("Open Notepad and type hello", [], {
        apiKey: "test-key",
        model: "test-model",
        fetchImpl
      });
      const expectation = expect(draftPromise).rejects.toMatchObject({
        code: "LLM_REQUEST_TIMEOUT",
        message:
          "The configured draft automation creator took too long to respond. Try again or choose a faster OpenRouter model."
      });

      await vi.advanceTimersByTimeAsync(90_000);
      await expectation;
    } finally {
      vi.useRealTimers();
    }
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

function requestBodyFor(fetchImpl: ReturnType<typeof vi.fn>): {
  provider: { require_parameters: boolean };
  messages: { content: string }[];
  response_format: {
    type: string;
    json_schema: {
      strict: boolean;
      schema: {
        properties: {
          status: { enum: string[] };
        };
      };
    };
  };
} {
  return JSON.parse(fetchImpl.mock.calls[0][1]?.body as string);
}
