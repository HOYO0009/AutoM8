import { describe, expect, it, vi } from "vitest";

import { createDraftAutomation, DraftGenerationError } from "./draftGenerator.js";

describe("createDraftAutomation", () => {
  it("rejects an empty prompt", async () => {
    await expect(
      createDraftAutomation("   ", {
        apiKey: "test-key",
        model: "test-model"
      })
    ).rejects.toMatchObject({
      code: "EMPTY_PROMPT"
    });
  });

  it("reports missing OpenRouter configuration", async () => {
    await expect(
      createDraftAutomation("Open Notepad and type hello", {})
    ).rejects.toMatchObject({
      code: "LLM_CONFIG_MISSING"
    });
  });

  it("returns a validated draft automation from provider JSON", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                name: "Write Hello",
                summary: "Open Notepad and write a greeting.",
                steps: [
                  {
                    title: "Open Notepad",
                    nodeType: "deterministic",
                    description: "Launch Notepad from the desktop."
                  },
                  {
                    title: "Type greeting",
                    nodeType: "deterministic",
                    description: "Enter hello into the active document."
                  }
                ]
              })
            }
          }
        ]
      })
    );

    const draft = await createDraftAutomation("Open Notepad and type hello", {
      apiKey: "test-key",
      model: "test-model",
      baseUrl: "https://example.test/",
      fetchImpl
    });

    expect(draft.name).toBe("Write Hello");
    expect(draft.steps).toHaveLength(2);
    const requestBody = JSON.parse(fetchImpl.mock.calls[0][1]?.body as string) as {
      provider: { require_parameters: boolean };
      response_format: {
        type: string;
        json_schema: {
          strict: boolean;
          schema: {
            properties: {
              steps: {
                items: {
                  properties: {
                    nodeType: { enum: string[] };
                  };
                };
              };
            };
          };
        };
      };
    };

    expect(requestBody.provider).toEqual({ require_parameters: true });
    expect(requestBody.response_format.type).toBe("json_schema");
    expect(requestBody.response_format.json_schema.strict).toBe(true);
    expect(requestBody.response_format.json_schema.schema.properties.steps.items.properties.nodeType.enum).toEqual([
      "deterministic",
      "perception",
      "llm",
      "control",
      "verification"
    ]);
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
      createDraftAutomation("Open Notepad and type hello", {
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
      createDraftAutomation("Open Notepad and type hello", {
        apiKey: "test-key",
        model: "test-model",
        fetchImpl
      })
    ).rejects.toMatchObject({
      code: "INVALID_LLM_RESPONSE",
      message:
        "The configured draft generator did not return the required draft automation shape. Choose an OpenRouter model that supports structured outputs, then try again."
    });

    expect(warnSpy).toHaveBeenCalledWith("AutoM8 draft generator returned an invalid response.", {
      model: "test-model",
      stage: "assistant-json",
      providerStatus: 200
    });
    warnSpy.mockRestore();
  });

  it("reports invalid draft shape with safe diagnostics", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                name: "Write Hello",
                summary: "Open Notepad and write a greeting.",
                steps: []
              })
            }
          }
        ]
      })
    );

    await expect(
      createDraftAutomation("Open Notepad and type hello", {
        apiKey: "test-key",
        model: "test-model",
        fetchImpl
      })
    ).rejects.toMatchObject({
      code: "INVALID_LLM_RESPONSE"
    });

    expect(warnSpy).toHaveBeenCalledWith("AutoM8 draft generator returned an invalid response.", {
      model: "test-model",
      stage: "draft-steps",
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

      const draftPromise = createDraftAutomation("Open Notepad and type hello", {
        apiKey: "test-key",
        model: "test-model",
        fetchImpl
      });
      const expectation = expect(draftPromise).rejects.toMatchObject({
        code: "LLM_REQUEST_TIMEOUT",
        message:
          "The configured draft generator took too long to respond. Try again or choose a faster OpenRouter model."
      });

      await vi.advanceTimersByTimeAsync(30_000);
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
