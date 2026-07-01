import { describe, expect, it, vi } from "vitest";

import { createDraftAutomationCreationResult } from "./draftAutomationCreation.js";
import type { SavedAutomation } from "../../shared/automationDraft.js";

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
                    reason: "The workflow names a spreadsheet but not the exact source.",
                    answerKind: "local_spreadsheet"
                  },
                  {
                    id: "email-recipients",
                    question: "Who should receive the team email summary?",
                    reason: "Draft Automation Creation needs a concrete destination before modeling the email step.",
                    answerKind: "text"
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
          reason: "The workflow names a spreadsheet but not the exact source.",
          answerKind: "local_spreadsheet"
        },
        {
          id: "email-recipients",
          question: "Who should receive the team email summary?",
          reason: "Draft Automation Creation needs a concrete destination before modeling the email step.",
          answerKind: "text"
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
    expect(requestBody.response_format.json_schema.schema.properties.questions.items.properties.answerKind.enum).toEqual([
      "text",
      "local_file",
      "local_spreadsheet"
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

  it("uses Clarification Answers to create an ordered Draft Automation with Draft Step Details", async () => {
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
                      title: "Run every morning",
                      nodeType: "control",
                      description: "Start the workflow every morning at the configured time.",
                      details: {
                        inputs: ["Schedule: 8:00 AM Asia/Singapore"],
                        outputs: ["Workflow run is started"],
                        fallbacks: ["Ask the user to confirm the schedule if the trigger is unavailable"],
                        verification: ["Workflow only starts at the configured morning schedule"]
                      }
                    },
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
      {
        questionId: "sales-spreadsheet",
        question: "Which sales spreadsheet should AutoM8 open?",
        reason: "The workflow names a spreadsheet but not the exact source.",
        answer: "C:/Reports/Sales.xlsx"
      },
      {
        questionId: "revenue-location",
        question: "Where is yesterday's total revenue in the spreadsheet?",
        reason: "AutoM8 needs the exact tab and columns before modeling extraction.",
        answer: "Daily Revenue tab, Date and Total Revenue columns"
      },
      {
        questionId: "sender-account",
        question: "Which sender account should AutoM8 use?",
        reason: "AutoM8 needs the sender identity before drafting the email.",
        answer: "sales@example.com"
      },
      {
        questionId: "email-recipients",
        question: "Who should receive the team email summary?",
        reason: "Draft Automation Creation needs a concrete destination before modeling the email step.",
        answer: "team@example.com"
      },
      {
        questionId: "schedule-time-zone",
        question: "What exact morning schedule and time zone should AutoM8 use?",
        reason: "AutoM8 needs an exact schedule before modeling the trigger.",
        answer: "Every morning at 8:00 AM Asia/Singapore"
      }
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
    expect(creationResult.draft?.steps.map((step) => step.title)).toEqual([
      "Run every morning",
      "Open sales spreadsheet",
      "Extract yesterday's total revenue",
      "Draft team email"
    ]);
    expect(creationResult.draft?.steps[0].nodeType).toBe("control");
    expect(creationResult.draft?.steps[1].details.inputs).toEqual(["C:/Reports/Sales.xlsx"]);
    expect(creationResult.draft?.steps[2].details.outputs).toEqual(["Yesterday's total revenue value"]);
    expect(creationResult.draft?.steps[3].details.verification).toEqual([
      "Email draft contains the revenue value and remains unsent"
    ]);
    const requestBody = requestBodyFor(fetchImpl);
    expect(requestBody.messages[0].content).toContain("Clarification Answers include questionId, question, reason, and answer");
    expect(JSON.parse(requestBody.messages[1].content).clarificationAnswers).toEqual(clarificationAnswers);
  });

  it("repairs screenshot-style meta nodes instead of accepting them as a Draft Automation", async () => {
    const screenshotStyleDraft = {
      status: "draft_created",
      draft: {
        name: "Generate Daily Revenue Summary Email",
        summary:
          "The system has prepared a draft workflow that will automatically compile yesterday's revenue and compose a team email.",
        steps: [
          {
            title: "Generate Daily Revenue Summary Email",
            nodeType: "deterministic",
            description: "Open the sales spreadsheet and extract yesterday's total revenue.",
            details: {
              inputs: ["sales spreadsheet"],
              outputs: ["daily revenue summary"],
              fallbacks: [],
              verification: ["Draft step details confirm revenue extraction"]
            }
          },
          {
            title: "Execution Blocker Resolution",
            nodeType: "perception",
            description: "Draft a concise email to the team summarizing yesterday's revenue.",
            details: {
              inputs: ["daily revenue summary"],
              outputs: ["email draft"],
              fallbacks: [],
              verification: ["Ensure email includes correct revenue figure"]
            }
          },
          {
            title: "Status: Draft Created",
            nodeType: "deterministic",
            description: "Draft Automation created successfully with detailed steps.",
            details: {
              inputs: ["sales spreadsheet", "yesterday's total revenue"],
              outputs: ["summary email"],
              fallbacks: [],
              verification: ["Confirm email content matches extracted revenue"]
            }
          }
        ]
      },
      questions: []
    };
    const fetchImpl = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          choices: [
            {
              message: {
                content: JSON.stringify(screenshotStyleDraft)
              }
            }
          ]
        })
      )
      .mockResolvedValueOnce(
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
                      question: "Which exact sales spreadsheet should AutoM8 open?",
                      reason: "The workflow names a spreadsheet but not the exact source.",
                      answerKind: "local_spreadsheet"
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
        fetchImpl
      }
    );

    expect(creationResult.status).toBe("needs_clarification");
    expect(creationResult.draft).toBeNull();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const repairPayload = JSON.parse(requestBodyFor(fetchImpl, 1).messages[1].content);
    expect(repairPayload.invalidStage).toBe("draft-semantic-meta-step");
    expect(repairPayload.semanticFailureReason).toContain("workflow action nodes");
    expect(repairPayload.workflowPrompt).toContain("Every morning");
    expect(repairPayload.clarificationAnswers).toEqual([]);
    expect(repairPayload.v1ExecutionBlockers).toContain("specific app, file, spreadsheet, or website");
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
    const savedAutomationContext: SavedAutomation = {
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
    const clarificationAnswers = [
      {
        questionId: "slack-channel",
        question: "Which Slack channel should AutoM8 use?",
        reason: "The edit asks for Slack without a concrete destination.",
        answer: "#revenue"
      }
    ];

    const creationResult = await createDraftAutomationCreationResult(
      "Also post the summary to #revenue in Slack.",
      clarificationAnswers,
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
    expect(JSON.parse(requestBody.messages[1].content).clarificationAnswers).toEqual(clarificationAnswers);
  });

  it("surfaces provider rejection messages", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse(
        {
          error: {
            message: "This model does not support response_format json_schema.",
            metadata: {
              rawProviderPayload: "do not expose"
            }
          }
        },
        { status: 400 }
      )
    );

    let rejectedError: unknown;
    try {
      await createDraftAutomationCreationResult("Open Notepad and type hello", [], {
        apiKey: "test-key",
        model: "openrouter/free",
        fetchImpl
      });
    } catch (error) {
      rejectedError = error;
    }

    expect(rejectedError).toMatchObject({
      code: "LLM_REQUEST_FAILED",
      message: "This model does not support response_format json_schema.",
      diagnostics: {
        failureType: "provider_rejection",
        model: "openrouter/free",
        providerStatus: 400,
        guidance: expect.stringContaining("OpenRouter rejected")
      }
    });
    expect(JSON.stringify(rejectedError)).not.toContain("do not expose");
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
        model: "openrouter/free",
        fetchImpl
      })
    ).rejects.toMatchObject({
      code: "INVALID_LLM_RESPONSE",
      message:
        "The configured draft automation creator did not return the required creation result shape. Choose an OpenRouter model that supports structured outputs, then try again.",
      diagnostics: {
        failureType: "invalid_json",
        model: "openrouter/free",
        stage: "assistant-json",
        providerStatus: 200,
        guidance: expect.stringContaining("not parseable JSON")
      }
    });

    expect(warnSpy).toHaveBeenCalledWith("AutoM8 draft automation creator returned an invalid response.", {
      model: "openrouter/free",
      stage: "assistant-json",
      providerStatus: 200
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it("repairs an invalid creation result status once", async () => {
    const priorParsedJson = {
      status: "done",
      draft: null,
      questions: []
    };
    const fetchImpl = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          choices: [
            {
              message: {
                content: JSON.stringify(priorParsedJson)
              }
            }
          ]
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  status: "needs_clarification",
                  draft: null,
                  questions: [
                    {
                      id: "target-app",
                      question: "Which app should AutoM8 open?",
                      reason: "The workflow names an action but not the exact app.",
                      answerKind: "text"
                    }
                  ]
                })
              }
            }
          ]
        })
      );

    const creationResult = await createDraftAutomationCreationResult("Open the app and type hello", [], {
      apiKey: "test-key",
      model: "openrouter/free",
      fetchImpl
    });

    expect(creationResult).toEqual({
      status: "needs_clarification",
      draft: null,
      questions: [
        {
          id: "target-app",
          question: "Which app should AutoM8 open?",
          reason: "The workflow names an action but not the exact app.",
          answerKind: "text"
        }
      ]
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);

    const repairBody = requestBodyFor(fetchImpl, 1);
    const repairPayload = JSON.parse(repairBody.messages[1].content);
    expect(repairBody.messages[0].content).toContain("Return corrected JSON only");
    expect(repairPayload.invalidStage).toBe("creation-result-status");
    expect(repairPayload.allowedSchemaSummary.allowedStatuses).toEqual([
      "needs_clarification",
      "draft_created"
    ]);
    expect(repairPayload.allowedSchemaSummary.allowedNodeTypes).toEqual([
      "deterministic",
      "perception",
      "llm",
      "control",
      "verification"
    ]);
    expect(repairPayload.priorParsedJson).toEqual(priorParsedJson);
    expect(repairBody.response_format.type).toBe("json_schema");
    expect(repairBody.response_format.json_schema.strict).toBe(true);
  });

  it("reports invalid creation result shape with safe diagnostics after repair fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const fetchImpl = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  status: "done",
                  draft: null,
                  questions: []
                })
              }
            }
          ]
        })
      )
      .mockResolvedValueOnce(
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
        model: "openrouter/free",
        fetchImpl
      })
    ).rejects.toMatchObject({
      code: "INVALID_LLM_RESPONSE",
      diagnostics: {
        failureType: "invalid_creation_result_shape",
        model: "openrouter/free",
        stage: "creation-result-draft",
        providerStatus: 200,
        guidance: expect.stringContaining("did not match AutoM8")
      }
    });

    expect(warnSpy).toHaveBeenCalledWith("AutoM8 draft automation creator returned an invalid response.", {
      model: "openrouter/free",
      stage: "creation-result-draft",
      providerStatus: 200
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    warnSpy.mockRestore();
  });

  it("reports semantic draft failures with safe diagnostics after repair fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const metaDraftResponse = {
      status: "draft_created",
      draft: {
        name: "Generate Daily Revenue Summary Email",
        summary: "Create a daily revenue email draft.",
        steps: [
          {
            title: "Status: Draft Created",
            nodeType: "deterministic",
            description: "Draft Automation created successfully with detailed steps.",
            details: {
              inputs: ["sales spreadsheet"],
              outputs: ["summary email"],
              fallbacks: [],
              verification: ["Confirm email content matches extracted revenue"]
            }
          }
        ]
      },
      questions: []
    };
    const fetchImpl = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          choices: [
            {
              message: {
                content: JSON.stringify(metaDraftResponse)
              }
            }
          ]
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          choices: [
            {
              message: {
                content: JSON.stringify(metaDraftResponse)
              }
            }
          ]
        })
      );

    await expect(
      createDraftAutomationCreationResult(
        "Every morning, open the sales spreadsheet, collect yesterday's total revenue, and draft a short email summary for the team.",
        [],
        {
          apiKey: "test-key",
          model: "test-model",
          fetchImpl
        }
      )
    ).rejects.toMatchObject({
      code: "INVALID_LLM_RESPONSE",
      diagnostics: {
        failureType: "invalid_creation_result_shape",
        model: "test-model",
        stage: "draft-semantic-meta-step",
        providerStatus: 200,
        guidance: expect.stringContaining("did not match AutoM8")
      }
    });

    expect(warnSpy).toHaveBeenCalledWith("AutoM8 draft automation creator returned an invalid response.", {
      model: "test-model",
      stage: "draft-semantic-meta-step",
      providerStatus: 200
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
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

function requestBodyFor(fetchImpl: ReturnType<typeof vi.fn>, callIndex = 0): {
  provider: { require_parameters: boolean };
  messages: { content: string }[];
  response_format: {
    type: string;
    json_schema: {
      strict: boolean;
      schema: {
        properties: {
          status: { enum: string[] };
          questions: {
            items: {
              properties: {
                answerKind: { enum: string[] };
              };
            };
          };
        };
      };
    };
  };
} {
  return JSON.parse(fetchImpl.mock.calls[callIndex][1]?.body as string);
}
