import { describe, expect, it, vi } from "vitest";

import { DraftAutomationStep, ExecutableActionPlan, SavedAutomationCandidate } from "../../shared/draftAutomation.js";
import { NonDeterministicDesktopTaskRunner } from "./nonDeterministicDesktopTaskRunner.js";
import { DesktopDriver } from "../desktop/desktopDriver.js";
import { createAutomationRunManager, RunAutomationError } from "./automationRunStore.js";
import { ExecutableActionPlanner } from "./executableActionPlanner.js";

describe("createAutomationRunManager", () => {
  it("runs deterministic desktop actions asynchronously with step logs", async () => {
    const automation = savedAutomationCandidate();
    const driver = mockDriver();
    const runManager = createAutomationRunManager({
      idFactory: sequentialIds("run-1"),
      now: () => new Date("2026-06-24T12:00:00.000Z"),
      actionPlanner: plannerFor({
        automationId: "saved-1",
        steps: [
          {
            title: "Open Notepad",
            nodeType: "deterministic",
            description: "Open Notepad.",
            actions: [
              { type: "launch_app", app: "notepad" },
              { type: "type_text", text: "hello" }
            ]
          }
        ]
      }),
      driver,
      nonDeterministicTaskRunner: mockNonDeterministicTaskRunner()
    });

    const run = runManager.start(automation);
    expect(run.status).toBe("running");

    await runManager.whenIdle(run.id);

    const completedRun = runManager.get(run.id);
    expect(completedRun.status).toBe("completed");
    expect(completedRun.steps[0]).toMatchObject({
      status: "completed",
      message: "Completed real desktop runner actions."
    });
    expect(completedRun.steps[0].logs.map((log) => log.message)).toContain("Launched notepad.");
    expect(completedRun.steps[0].logs.map((log) => log.message)).toContain("Typed 5 characters.");
    expect(driver.launchApp).toHaveBeenCalledWith("notepad");
    expect(driver.typeText).toHaveBeenCalledWith("hello");
  });

  it("pauses for approval before side-effect actions and resumes after approval", async () => {
    const automation = savedAutomationCandidate({
      steps: [
        {
          title: "Schedule calendar event",
          nodeType: "control",
          description: "Create the event in Google Calendar.",
          details: draftStepDetails()
        },
        {
          title: "Write confirmation",
          nodeType: "deterministic",
          description: "Write done in Notepad.",
          details: draftStepDetails()
        }
      ]
    });
    const runManager = createAutomationRunManager({
      idFactory: sequentialIds("run-1", "approval-1"),
      now: () => new Date("2026-06-24T12:00:00.000Z"),
      actionPlanner: plannerFor({
        automationId: "saved-1",
        steps: [
          {
            title: "Schedule calendar event",
            nodeType: "control",
            description: "Create the event in Google Calendar.",
            actions: [
              {
                type: "approval_gate",
                action: "Create calendar event",
                destination: "calendar",
                dataSummary: "Create the event in Google Calendar."
              },
              { type: "llm_desktop_task", goal: "Create the event", maxIterations: 1, timeoutMs: 1000 }
            ]
          },
          {
            title: "Write confirmation",
            nodeType: "deterministic",
            description: "Write done in Notepad.",
            actions: [{ type: "type_text", text: "done" }]
          }
        ]
      }),
      driver: mockDriver(),
      nonDeterministicTaskRunner: mockNonDeterministicTaskRunner({
        status: "completed",
        message: "Calendar event created.",
        logs: ["Used bounded non-deterministic desktop task action."]
      })
    });

    const run = runManager.start(automation);
    await runManager.whenIdle(run.id);

    const waitingRun = runManager.get(run.id);
    expect(waitingRun.status).toBe("waiting_for_approval");
    expect(waitingRun.approvals).toEqual([
      {
        id: "approval-1",
        stepIndex: 0,
        title: "Schedule calendar event",
        action: "Create calendar event",
        destination: "calendar",
        dataSummary: "Create the event in Google Calendar.",
        status: "pending"
      }
    ]);

    runManager.approve(run.id, "approval-1", automation);
    await runManager.whenIdle(run.id);

    const completedRun = runManager.get(run.id);
    expect(completedRun.status).toBe("completed");
    expect(completedRun.approvals[0].status).toBe("approved");
    expect(completedRun.steps.map((step) => step.status)).toEqual(["completed", "completed"]);
  });

  it("fails a run when approval is denied", async () => {
    const automation = savedAutomationCandidate();
    const runManager = createAutomationRunManager({
      idFactory: sequentialIds("run-1", "approval-1"),
      now: () => new Date("2026-06-24T12:00:00.000Z"),
      actionPlanner: plannerFor({
        automationId: "saved-1",
        steps: [
          {
            title: "Send email",
            nodeType: "control",
            description: "Send a summary email.",
            actions: [
              {
                type: "approval_gate",
                action: "Send email",
                destination: "email",
                dataSummary: "Send a summary email."
              }
            ]
          }
        ]
      }),
      driver: mockDriver(),
      nonDeterministicTaskRunner: mockNonDeterministicTaskRunner()
    });

    const run = runManager.start(automation);
    await runManager.whenIdle(run.id);

    const deniedRun = runManager.deny(run.id, "approval-1");
    expect(deniedRun.status).toBe("failed");
    expect(deniedRun.approvals[0].status).toBe("denied");
    expect(deniedRun.steps[0]).toMatchObject({
      status: "failed",
      message: "Approval denied."
    });
  });

  it("pauses and resumes when a non-deterministic desktop task requests approval", async () => {
    const automation = savedAutomationCandidate();
    const nonDeterministicTaskRunner = mockNonDeterministicTaskRunner(
      {
        status: "waiting_for_approval",
        message: "Approve before submitting.",
        logs: ["Observation 1: form ready"],
        approval: {
          type: "approval_gate",
          action: "Submit form",
          destination: "form",
          dataSummary: "Submit the visible form."
        }
      },
      {
        status: "completed",
        message: "Submitted.",
        logs: ["Verification observation 1: submitted"]
      }
    );
    const runManager = createAutomationRunManager({
      idFactory: sequentialIds("run-1", "approval-1"),
      now: () => new Date("2026-06-24T12:00:00.000Z"),
      actionPlanner: plannerFor(nonDeterministicTaskPlan()),
      driver: mockDriver(),
      nonDeterministicTaskRunner
    });

    const run = runManager.start(automation);
    await runManager.whenIdle(run.id);

    const waitingRun = runManager.get(run.id);
    expect(waitingRun.status).toBe("waiting_for_approval");
    expect(waitingRun.approvals).toEqual([
      {
        id: "approval-1",
        stepIndex: 0,
        title: "Open Notepad",
        action: "Submit form",
        destination: "form",
        dataSummary: "Submit the visible form.",
        status: "pending"
      }
    ]);
    expect(waitingRun.steps[0].logs.map((log) => log.message)).toContain("Observation 1: form ready");

    runManager.approve(run.id, "approval-1", automation);
    await runManager.whenIdle(run.id);

    const completedRun = runManager.get(run.id);
    expect(completedRun.status).toBe("completed");
    expect(completedRun.approvals[0].status).toBe("approved");
    expect(completedRun.steps[0]).toMatchObject({
      status: "completed",
      message: "Completed real desktop runner actions."
    });
    expect(completedRun.steps[0].logs.map((log) => log.message)).toContain("Submitted.");
  });

  it("fails when a non-deterministic desktop task approval is denied", async () => {
    const automation = savedAutomationCandidate();
    const runManager = createAutomationRunManager({
      idFactory: sequentialIds("run-1", "approval-1"),
      now: () => new Date("2026-06-24T12:00:00.000Z"),
      actionPlanner: plannerFor(nonDeterministicTaskPlan()),
      driver: mockDriver(),
      nonDeterministicTaskRunner: mockNonDeterministicTaskRunner({
        status: "waiting_for_approval",
        message: "Approve before submitting.",
        logs: ["Observation 1: form ready"],
        approval: {
          type: "approval_gate",
          action: "Submit form",
          destination: "form",
          dataSummary: "Submit the visible form."
        }
      })
    });

    const run = runManager.start(automation);
    await runManager.whenIdle(run.id);

    const deniedRun = runManager.deny(run.id, "approval-1");
    expect(deniedRun.status).toBe("failed");
    expect(deniedRun.approvals[0].status).toBe("denied");
    expect(deniedRun.steps[0]).toMatchObject({
      status: "failed",
      message: "Approval denied."
    });
  });

  it("rejects running an unknown saved automation", () => {
    const runManager = createAutomationRunManager({
      actionPlanner: plannerFor({ automationId: "saved-1", steps: [] }),
      driver: mockDriver(),
      nonDeterministicTaskRunner: mockNonDeterministicTaskRunner()
    });

    expect(() => runManager.start(undefined)).toThrow(RunAutomationError);
    expect(() => runManager.start(undefined)).toThrow("Choose a saved automation before running it.");
  });
});

function savedAutomationCandidate(overrides: Partial<SavedAutomationCandidate> = {}): SavedAutomationCandidate {
  return {
    id: "saved-1",
    createdAt: "2026-06-24T11:00:00.000Z",
    name: "Send report",
    summary: "Collect the report and email it to the team.",
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

function nonDeterministicTaskPlan(): ExecutableActionPlan {
  return {
    automationId: "saved-1",
    steps: [
      {
        title: "Open Notepad",
        nodeType: "llm",
        description: "Finish the visible task.",
        actions: [{ type: "llm_desktop_task", goal: "Finish the visible task", maxIterations: 2, timeoutMs: 1000 }]
      }
    ]
  };
}

function plannerFor(plan: ExecutableActionPlan): ExecutableActionPlanner {
  return {
    createPlan: vi.fn().mockResolvedValue(plan)
  };
}

function mockDriver(): DesktopDriver & {
  launchApp: ReturnType<typeof vi.fn>;
  typeText: ReturnType<typeof vi.fn>;
} {
  return {
    listApps: vi.fn().mockResolvedValue(["notepad"]),
    listWindows: vi.fn().mockResolvedValue([]),
    observeDesktop: vi.fn().mockResolvedValue({ summary: "notepad: Untitled - Notepad" }),
    captureWindow: vi.fn().mockResolvedValue({ summary: "notepad: Untitled - Notepad" }),
    readAccessibilityTree: vi.fn().mockResolvedValue({ summary: "notepad: Untitled - Notepad" }),
    launchApp: vi.fn().mockResolvedValue("Launched notepad."),
    focusWindow: vi.fn().mockResolvedValue("Focused window."),
    openUrl: vi.fn().mockResolvedValue("Opened URL."),
    click: vi.fn().mockResolvedValue("Clicked."),
    typeText: vi.fn().mockImplementation((text: string) => Promise.resolve(`Typed ${text.length} characters.`)),
    pressKey: vi.fn().mockResolvedValue("Pressed key."),
    wait: vi.fn().mockResolvedValue("Waited."),
    verifyText: vi.fn().mockResolvedValue("Verified text.")
  };
}

function mockNonDeterministicTaskRunner(
  ...results: Awaited<ReturnType<NonDeterministicDesktopTaskRunner["runNonDeterministicDesktopTask"]>>[]
): NonDeterministicDesktopTaskRunner {
  const queuedResults = results.length > 0 ? results : [{ status: "failed" as const, message: "Non-deterministic desktop task failed.", logs: [] }];

  return {
    runNonDeterministicDesktopTask: vi.fn().mockImplementation(() => Promise.resolve(queuedResults.shift() ?? queuedResults[0]))
  };
}

function sequentialIds(...ids: string[]): () => string {
  let index = 0;
  return () => ids[index++] ?? `id-${index}`;
}
