import { describe, expect, it, vi } from "vitest";

import { SavedAutomation } from "../../shared/draftAutomation.js";
import { actionRequiresApproval, createExecutionPlanner, createHeuristicPlan, validateAction, validateExecutablePlan } from "./executionPlanner.js";

describe("createHeuristicPlan", () => {
  it("turns concrete Notepad instructions into deterministic actions", () => {
    const plan = createHeuristicPlan(
      savedAutomation({
        steps: [
          {
            title: "Open Notepad",
            nodeType: "deterministic",
            description: "Open Notepad and type \"hello\"."
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

  it("adds approval before side-effect work and keeps ambiguous work adaptive", () => {
    const plan = createHeuristicPlan(
      savedAutomation({
        steps: [
          {
            title: "Schedule event",
            nodeType: "control",
            description: "Create the meeting in Google Calendar."
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

describe("createExecutionPlanner", () => {
  it("falls back to the local planner when configured model planning fails", async () => {
    const planner = createExecutionPlanner({
      apiKey: "key",
      model: "model",
      fetchImpl: async () =>
        new Response(JSON.stringify({ choices: [{ message: { content: "{}" } }] }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
    });

    const plan = await planner.plan(
      savedAutomation({
        steps: [
          {
            title: "Open Notepad",
            nodeType: "deterministic",
            description: "Open Notepad and type \"hello\"."
          }
        ]
      })
    );

    expect(plan.steps[0].actions).toContainEqual({ type: "launch_app", app: "notepad" });
  });

  it("does not call the model for fully deterministic local plans", async () => {
    const fetchImpl = vi.fn();
    const planner = createExecutionPlanner({
      apiKey: "key",
      model: "model",
      fetchImpl
    });

    const plan = await planner.plan(
      savedAutomation({
        steps: [
          {
            title: "Open Notepad",
            nodeType: "deterministic",
            description: "Open Notepad and type \"hello\"."
          }
        ]
      })
    );

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(plan.steps[0].actions).toContainEqual({ type: "type_text", text: "hello" });
  });
});

describe("validateExecutablePlan", () => {
  it("rejects invalid model actions", () => {
    expect(() =>
      validateExecutablePlan(savedAutomation(), {
        steps: [
          {
            title: "Bad",
            nodeType: "deterministic",
            description: "Bad action.",
            actions: [{ type: "shell", command: "Remove-Item *" }]
          }
        ]
      })
    ).toThrow("The configured execution planner did not return a runnable AutoM8 action plan.");
  });

  it("bounds adaptive loop controls", () => {
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
        description: "Open Notepad and type hello."
      }
    ],
    ...overrides
  };
}
