import { describe, expect, it } from "vitest";

import { createAutomationRunStore, RunAutomationError } from "./automationRunStore.js";

describe("createAutomationRunStore", () => {
  it("runs an existing saved automation with step results", () => {
    const runStore = createAutomationRunStore({
      idFactory: () => "run-1",
      now: () => new Date("2026-06-24T12:00:00.000Z")
    });

    const run = runStore.run({
      id: "saved-1",
      createdAt: "2026-06-24T11:00:00.000Z",
      name: "Send report",
      summary: "Collect the report and email it to the team.",
      steps: [
        {
          title: "Open report",
          nodeType: "deterministic",
          description: "Open the latest report file."
        },
        {
          title: "Verify total",
          nodeType: "verification",
          description: "Confirm the revenue total is present."
        }
      ]
    });

    expect(run).toEqual({
      id: "run-1",
      automationId: "saved-1",
      status: "completed",
      startedAt: "2026-06-24T12:00:00.000Z",
      completedAt: "2026-06-24T12:00:00.000Z",
      steps: [
        {
          title: "Open report",
          nodeType: "deterministic",
          status: "completed",
          message: "Safe MVP runner recorded this step without controlling the desktop."
        },
        {
          title: "Verify total",
          nodeType: "verification",
          status: "completed",
          message: "Safe MVP runner recorded this step without controlling the desktop."
        }
      ]
    });
    expect(runStore.list()).toEqual([run]);
  });

  it("rejects running an unknown saved automation", () => {
    const runStore = createAutomationRunStore();

    expect(() => runStore.run(undefined)).toThrow(RunAutomationError);
    expect(() => runStore.run(undefined)).toThrow("Choose a saved automation before running it.");
  });
});
