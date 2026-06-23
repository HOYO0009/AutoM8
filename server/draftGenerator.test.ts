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
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://example.test/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key"
        })
      })
    );
  });

  it("reports invalid provider JSON", async () => {
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
      code: "INVALID_LLM_RESPONSE"
    });
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
