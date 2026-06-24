import { describe, expect, it, vi } from "vitest";

import { createAdaptiveDesktopExecutor } from "./adaptiveDesktopExecutor.js";
import { DesktopDriver } from "./desktopDriver.js";

const screenshotDataUrl = "data:image/png;base64,iVBORw0KGgo=";

describe("createAdaptiveDesktopExecutor", () => {
  it("executes one bounded action and verifies from fresh screenshot and accessibility evidence", async () => {
    const driver = mockDriver();
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(modelResponse({ decision: "act", reason: "Click the target.", action: { type: "click", x: 12, y: 34 } }))
      .mockResolvedValueOnce(modelResponse({ decision: "complete", reason: "Target is open." }));
    const executor = createAdaptiveDesktopExecutor(driver, {
      apiKey: "key",
      model: "vision-model",
      fetchImpl
    });

    const result = await executor.runTask({
      type: "llm_desktop_task",
      goal: "Open the target",
      maxIterations: 2,
      timeoutMs: 1000
    });

    expect(result).toMatchObject({
      status: "completed",
      message: "Target is open."
    });
    expect(driver.click).toHaveBeenCalledWith(12, 34);
    expect(driver.observeDesktop).toHaveBeenCalledTimes(2);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(requestContent(fetchImpl, 0)).toContainEqual({
      type: "image_url",
      image_url: { url: screenshotDataUrl }
    });
    expect(requestText(fetchImpl, 1)).toContain("Verify whether the goal is complete");
    expect(result.logs).toEqual([
      "Observation 1: Window: Target app",
      "Accessibility 1: Button: Open target",
      "Clicked.",
      "Verification observation 1: Window: Target app",
      "Verification accessibility 1: Button: Target is open"
    ]);
  });

  it("fails when screenshot evidence is unavailable", async () => {
    const executor = createAdaptiveDesktopExecutor(
      mockDriver({
        observeDesktop: vi.fn().mockResolvedValue({
          summary: "Window: Target app",
          accessibility: "Button: Open target"
        })
      }),
      { apiKey: "key", model: "vision-model", fetchImpl: vi.fn() }
    );

    const result = await executor.runTask({
      type: "llm_desktop_task",
      goal: "Open the target",
      maxIterations: 1,
      timeoutMs: 1000
    });

    expect(result).toMatchObject({
      status: "failed",
      message: "The adaptive desktop task needs screenshot and accessibility evidence before using the model."
    });
  });

  it("returns waiting_for_approval for model-selected approval gates", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(
      modelResponse({
        decision: "act",
        reason: "Needs permission.",
        action: {
          type: "approval_gate",
          action: "Submit form",
          destination: "form",
          dataSummary: "Submit the visible form."
        }
      })
    );
    const executor = createAdaptiveDesktopExecutor(mockDriver(), {
      apiKey: "key",
      model: "vision-model",
      fetchImpl
    });

    const result = await executor.runTask({
      type: "llm_desktop_task",
      goal: "Submit the form",
      maxIterations: 1,
      timeoutMs: 1000
    });

    expect(result).toMatchObject({
      status: "waiting_for_approval",
      message: "Needs permission.",
      approval: {
        type: "approval_gate",
        action: "Submit form",
        destination: "form",
        dataSummary: "Submit the visible form."
      }
    });
  });

  it("retries until maxIterations before failing", async () => {
    const driver = mockDriver();
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(modelResponse({ decision: "act", reason: "Wait for the screen.", action: { type: "wait", ms: 10 } }))
      .mockResolvedValueOnce(modelResponse({ decision: "act", reason: "Still not ready." }))
      .mockResolvedValueOnce(modelResponse({ decision: "act", reason: "Wait again.", action: { type: "wait", ms: 10 } }))
      .mockResolvedValueOnce(modelResponse({ decision: "act", reason: "Still not ready." }));
    const executor = createAdaptiveDesktopExecutor(driver, {
      apiKey: "key",
      model: "vision-model",
      fetchImpl
    });

    const result = await executor.runTask({
      type: "llm_desktop_task",
      goal: "Wait for ready",
      maxIterations: 2,
      timeoutMs: 1000
    });

    expect(result).toMatchObject({
      status: "failed",
      message: "The LLM-assisted desktop task reached its action limit."
    });
    expect(driver.wait).toHaveBeenCalledTimes(2);
    expect(result.logs.filter((log) => log.startsWith("Observation "))).toHaveLength(2);
  });
});

function mockDriver(overrides: Partial<DesktopDriver> = {}): DesktopDriver & {
  click: ReturnType<typeof vi.fn>;
  wait: ReturnType<typeof vi.fn>;
  observeDesktop: ReturnType<typeof vi.fn>;
} {
  let observationCount = 0;

  return {
    listApps: vi.fn().mockResolvedValue(["target"]),
    listWindows: vi.fn().mockResolvedValue([]),
    observeDesktop: vi.fn().mockImplementation(() => {
      observationCount += 1;
      return Promise.resolve({
        summary: "Window: Target app",
        screenshotDataUrl,
        accessibility: observationCount === 1 ? "Button: Open target" : "Button: Target is open"
      });
    }),
    captureWindow: vi.fn().mockResolvedValue({
      summary: "Window: Target app",
      screenshotDataUrl,
      accessibility: "Button: Open target"
    }),
    readAccessibilityTree: vi.fn().mockResolvedValue({
      summary: "Button: Open target",
      screenshotDataUrl,
      accessibility: "Button: Open target"
    }),
    launchApp: vi.fn().mockResolvedValue("Launched."),
    focusWindow: vi.fn().mockResolvedValue("Focused."),
    openUrl: vi.fn().mockResolvedValue("Opened URL."),
    click: vi.fn().mockResolvedValue("Clicked."),
    typeText: vi.fn().mockResolvedValue("Typed."),
    pressKey: vi.fn().mockResolvedValue("Pressed key."),
    wait: vi.fn().mockResolvedValue("Waited."),
    verifyText: vi.fn().mockResolvedValue("Verified."),
    ...overrides
  };
}

function modelResponse(content: unknown): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(content) } }] }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

function requestBody(fetchImpl: ReturnType<typeof vi.fn>, index: number): { messages: { content: unknown }[] } {
  const body = fetchImpl.mock.calls[index][1]?.body;
  if (typeof body !== "string") {
    throw new Error("Expected JSON request body.");
  }

  return JSON.parse(body) as { messages: { content: unknown }[] };
}

function requestContent(fetchImpl: ReturnType<typeof vi.fn>, index: number): unknown[] {
  const content = requestBody(fetchImpl, index).messages[1].content;
  if (!Array.isArray(content)) {
    throw new Error("Expected multipart message content.");
  }

  return content;
}

function requestText(fetchImpl: ReturnType<typeof vi.fn>, index: number): string {
  const textPart = requestContent(fetchImpl, index).find(
    (part): part is { type: "text"; text: string } =>
      typeof part === "object" && part !== null && "type" in part && part.type === "text"
  );

  return textPart?.text ?? "";
}
