import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DraftAutomation, DraftStepDetails } from "../../shared/automationDraft";
import { AutomationRun } from "../../shared/automationRun";
import { NodeGraphViewer } from "./NodeGraphViewer";

describe("NodeGraphViewer", () => {
  it("renders draft automation nodes with unavailable graph metadata", () => {
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
          title: "Draft team email",
          nodeType: "llm",
          description: "Write a short summary for the team.",
          details: draftStepDetails()
        }
      ]
    };

    const html = renderToStaticMarkup(<NodeGraphViewer automation={draft} />);

    expect(html).toContain("Morning Summary automation graph");
    expect(html).toContain("2 nodes");
    expect(html).toContain("Open sales spreadsheet");
    expect(html).toContain("deterministic");
    expect(html).toContain("Draft team email");
    expect(html).toContain("llm");
    expect(html).toContain("Inputs");
    expect(html).toContain("Outputs");
    expect(html).toContain("Fallbacks");
    expect(html).toContain("Verification");
    expect(html).toContain("Not modeled yet");
  });

  it("renders modeled graph metadata when Draft Step Details exist", () => {
    const html = renderToStaticMarkup(
      <NodeGraphViewer
        automation={{
          name: "Morning Summary",
          summary: "Collect revenue and draft an email.",
          steps: [
            {
              title: "Open sales spreadsheet",
              nodeType: "deterministic",
              description: "Open the workbook that contains yesterday's sales.",
              details: draftStepDetails({
                inputs: ["C:/Reports/Sales.xlsx", "Daily Revenue tab"],
                outputs: ["Sales workbook is open"],
                fallbacks: ["Ask the user to choose the sales workbook"],
                verification: ["Workbook title shows Sales.xlsx"]
              })
            }
          ]
        }}
      />
    );

    expect(html).toContain("C:/Reports/Sales.xlsx; Daily Revenue tab");
    expect(html).toContain("Sales workbook is open");
    expect(html).toContain("Workbook title shows Sales.xlsx");
  });

  it("renders latest-run context for saved automation nodes", () => {
    const latestRun: AutomationRun = {
      id: "run-1",
      automationId: "automation-1",
      status: "waiting_for_approval",
      startedAt: "2026-06-24T00:00:00.000Z",
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
          title: "Draft team email",
          nodeType: "llm",
          status: "waiting_for_approval",
          message: "Waiting for approval.",
          logs: []
        }
      ]
    };

    const html = renderToStaticMarkup(
      <NodeGraphViewer
        automation={{
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
              title: "Draft team email",
              nodeType: "llm",
              description: "Write a short summary for the team.",
              details: draftStepDetails()
            }
          ]
        }}
        latestRun={latestRun}
      />
    );

    expect(html).toContain("Completed");
    expect(html).toContain("Waiting For Approval");
    expect(html).toContain("Last action: launch_app");
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
