import { describe, expect, it } from "vitest";

import { createAutomationGraph } from "./automationGraph.js";
import { DraftAutomation, DraftStepDetails } from "./automationDraft.js";
import { AutomationRun } from "./automationRun.js";

describe("createAutomationGraph", () => {
  it("projects draft automation steps into inspectable graph nodes", () => {
    const draft: DraftAutomation = {
      name: "Morning Summary",
      summary: "Collect revenue and draft an email.",
      steps: [
        {
          title: "Open sales spreadsheet",
          nodeType: "deterministic",
          description: "Open the workbook that contains yesterday's sales.",
          details: draftStepDetails()
        },
        {
          title: "Read revenue",
          nodeType: "perception",
          description: "Find yesterday's revenue total.",
          details: draftStepDetails()
        }
      ]
    };

    const graph = createAutomationGraph(draft);

    expect(graph).toMatchObject({
      name: "Morning Summary",
      summary: "Collect revenue and draft an email.",
      nodes: [
        {
          id: "1-open-sales-spreadsheet",
          order: 1,
          title: "Open sales spreadsheet",
          nodeType: "deterministic",
          description: "Open the workbook that contains yesterday's sales."
        },
        {
          id: "2-read-revenue",
          order: 2,
          title: "Read revenue",
          nodeType: "perception",
          description: "Find yesterday's revenue total."
        }
      ]
    });
  });

  it("marks graph metadata that is not modeled by current automation data as unavailable", () => {
    const graph = createAutomationGraph({
      name: "Draft",
      summary: "Summary",
      steps: [
        {
          title: "Classify message",
          nodeType: "llm",
          description: "Decide the message category.",
          details: draftStepDetails()
        }
      ]
    });

    expect(graph.nodes[0].metadata).toEqual([
      {
        kind: "inputs",
        label: "Inputs",
        state: "unavailable",
        summary: "Not modeled yet"
      },
      {
        kind: "outputs",
        label: "Outputs",
        state: "unavailable",
        summary: "Not modeled yet"
      },
      {
        kind: "fallbacks",
        label: "Fallbacks",
        state: "unavailable",
        summary: "Not modeled yet"
      },
      {
        kind: "verification",
        label: "Verification",
        state: "unavailable",
        summary: "Not modeled yet"
      }
    ]);
  });

  it("projects modeled Draft Step Details as available graph metadata", () => {
    const graph = createAutomationGraph({
      name: "Daily Sales Summary",
      summary: "Collect revenue and draft an email.",
      steps: [
        {
          title: "Extract revenue",
          nodeType: "perception",
          description: "Find yesterday's revenue total.",
          details: draftStepDetails({
            inputs: ["Sales.xlsx", "Daily Revenue tab"],
            outputs: ["Yesterday's total revenue"],
            fallbacks: ["Ask the user to identify the revenue cell"],
            verification: ["Revenue value is tied to yesterday's date"]
          })
        }
      ]
    });

    expect(graph.nodes[0].metadata).toEqual([
      {
        kind: "inputs",
        label: "Inputs",
        state: "available",
        summary: "Sales.xlsx; Daily Revenue tab"
      },
      {
        kind: "outputs",
        label: "Outputs",
        state: "available",
        summary: "Yesterday's total revenue"
      },
      {
        kind: "fallbacks",
        label: "Fallbacks",
        state: "available",
        summary: "Ask the user to identify the revenue cell"
      },
      {
        kind: "verification",
        label: "Verification",
        state: "available",
        summary: "Revenue value is tied to yesterday's date"
      }
    ]);
  });

  it("adds latest run status context by matching run steps to graph node order", () => {
    const latestRun: AutomationRun = {
      id: "run-1",
      automationId: "automation-1",
      status: "failed",
      startedAt: "2026-06-24T00:00:00.000Z",
      completedAt: "2026-06-24T00:00:01.000Z",
      approvals: [],
      logs: [],
      steps: [
        {
          title: "Open sales spreadsheet",
          nodeType: "deterministic",
          status: "completed",
          message: "Completed.",
          actionType: "launch_app",
          logs: []
        },
        {
          title: "Read revenue",
          nodeType: "perception",
          status: "failed",
          message: "Could not find revenue.",
          logs: []
        }
      ]
    };

    const graph = createAutomationGraph(
      {
        name: "Morning Summary",
        summary: "Collect revenue and draft an email.",
        steps: [
          {
            title: "Open sales spreadsheet",
            nodeType: "deterministic",
            description: "Open the workbook that contains yesterday's sales.",
            details: draftStepDetails()
          },
          {
            title: "Read revenue",
            nodeType: "perception",
            description: "Find yesterday's revenue total.",
            details: draftStepDetails()
          }
        ]
      },
      latestRun
    );

    expect(graph.nodes.map((node) => ({ runStatus: node.runStatus, actionType: node.actionType }))).toEqual([
      {
        runStatus: "completed",
        actionType: "launch_app"
      },
      {
        runStatus: "failed",
        actionType: undefined
      }
    ]);
  });
});

function draftStepDetails(overrides: Partial<DraftStepDetails> = {}): DraftStepDetails {
  return {
    inputs: [],
    outputs: [],
    fallbacks: [],
    verification: [],
    ...overrides
  };
}
