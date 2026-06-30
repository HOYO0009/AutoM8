import { describe, expect, it, vi } from "vitest";

import { DraftAutomationStep, SavedAutomation } from "../../shared/automationDraft.js";
import { actionRequiresApproval, createExecutableActionPlanner, createHeuristicExecutableActionPlan, validateAction, validateExecutableActionPlan } from "./executableActionPlanner.js";

describe("createHeuristicExecutableActionPlan", () => {
  it("turns concrete Notepad instructions into deterministic actions", () => {
    const plan = createHeuristicExecutableActionPlan(
      savedAutomation({
        steps: [
          {
            title: "Open Notepad",
            nodeType: "deterministic",
            description: "Open Notepad and type \"hello\".",
            details: draftStepDetails()
          }
        ]
      })
    );

    expect(plan.steps[0].actions).toEqual([
      { type: "launch_app", app: "notepad" },
      { type: "wait", ms: 500 },
      { type: "type_text", text: "hello" }
    ]);
  });

  it("adds approval before side-effect work and keeps ambiguous work non-deterministic", () => {
    const plan = createHeuristicExecutableActionPlan(
      savedAutomation({
        steps: [
          {
            title: "Schedule event",
            nodeType: "control",
            description: "Create the meeting in Google Calendar.",
            details: draftStepDetails()
          }
        ]
      })
    );

    expect(plan.steps[0].actions[0]).toMatchObject({
      type: "approval_gate",
      destination: "calendar",
      dataSummary: "Create the meeting in Google Calendar."
    });
    expect(plan.steps[0].actions[1]).toMatchObject({
      type: "llm_desktop_task",
      maxIterations: 5
    });
  });
});

describe("createExecutableActionPlanner", () => {
  it("falls back to the local planner when configured model planning fails", async () => {
    const planner = createExecutableActionPlanner({
      apiKey: "key",
      model: "model",
      fetchImpl: async () =>
        new Response(JSON.stringify({ choices: [{ message: { content: "{}" } }] }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
    });

    const plan = await planner.createPlan(
      savedAutomation({
        steps: [
          {
            title: "Open Notepad",
            nodeType: "deterministic",
            description: "Open Notepad and type \"hello\".",
            details: draftStepDetails()
          }
        ]
      })
    );

    expect(plan.steps[0].actions).toContainEqual({ type: "launch_app", app: "notepad" });
  });

  it("does not call the model for fully deterministic local plans", async () => {
    const fetchImpl = vi.fn();
    const planner = createExecutableActionPlanner({
      apiKey: "key",
      model: "model",
      fetchImpl
    });

    const plan = await planner.createPlan(
      savedAutomation({
        steps: [
          {
            title: "Open Notepad",
            nodeType: "deterministic",
            description: "Open Notepad and type \"hello\".",
            details: draftStepDetails()
          }
        ]
      })
    );

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(plan.steps[0].actions).toContainEqual({ type: "type_text", text: "hello" });
  });

  it("falls back after timed out model planning requests", async () => {
    vi.useFakeTimers();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    try {
      const fetchImpl = vi.fn<typeof fetch>(
        (_input, init) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => {
              reject(new DOMException("Aborted", "AbortError"));
            });
          })
      );
      const planner = createExecutableActionPlanner({
        apiKey: "key",
        model: "model",
        fetchImpl
      });

      const planPromise = planner.createPlan(
        savedAutomation({
          steps: [
            {
              title: "Find target",
              nodeType: "perception",
              description: "Find the visible target and open it.",
              details: draftStepDetails()
            }
          ]
        })
      );

      await vi.advanceTimersByTimeAsync(90_000);
      await expect(planPromise).resolves.toMatchObject({
        steps: [
          {
            actions: [
              {
                type: "llm_desktop_task",
                goal: "Morning workflow: Find target. Find the visible target and open it."
              }
            ]
          }
        ]
      });
      expect(warnSpy).toHaveBeenCalledWith(
        "AutoM8 executable action planner fell back to the local heuristic planner.",
        expect.objectContaining({ error: "The configured executable action planner took too long to respond." })
      );
    } finally {
      warnSpy.mockRestore();
      vi.useRealTimers();
    }
  });
});

describe("validateExecutableActionPlan", () => {
  it("rejects invalid model actions", () => {
    expect(() =>
      validateExecutableActionPlan(savedAutomation(), {
        steps: [
          {
            title: "Bad",
            nodeType: "deterministic",
            description: "Bad action.",
            actions: [{ type: "shell", command: "Remove-Item *" }]
          }
        ]
      })
    ).toThrow("The configured executable action planner did not return a runnable AutoM8 action plan.");
  });

  it("bounds non-deterministic desktop task controls", () => {
    expect(
      validateAction({
        type: "llm_desktop_task",
        goal: "Find the button.",
        maxIterations: 100,
        timeoutMs: 9999999
      })
    ).toEqual({
      type: "llm_desktop_task",
      goal: "Find the button.",
      maxIterations: 10,
      timeoutMs: 300000
    });
  });
});

describe("actionRequiresApproval", () => {
  it("flags external side-effect actions", () => {
    expect(
      actionRequiresApproval({
        type: "approval_gate",
        action: "Send email",
        destination: "email"
      })
    ).toBe(true);
    expect(actionRequiresApproval({ type: "type_text", text: "send the customer email" })).toBe(true);
    expect(actionRequiresApproval({ type: "type_text", text: "hello" })).toBe(false);
  });
});

function savedAutomation(overrides: Partial<SavedAutomation> = {}): SavedAutomation {
  return {
    id: "saved-1",
    createdAt: "2026-06-24T11:00:00.000Z",
    name: "Morning workflow",
    summary: "Do the morning workflow.",
    steps: [
      {
        title: "Open Notepad",
        nodeType: "deterministic",
        description: "Open Notepad and type hello.",
        details: draftStepDetails()
      }
    ],
    ...overrides
  };
}

function draftStepDetails(): DraftAutomationStep["details"] {
  return {
    inputs: [],
    outputs: [],
    fallbacks: [],
    verification: []
  };
}
