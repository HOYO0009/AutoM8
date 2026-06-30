import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DraftStepDetails, SavedAutomation } from "../../shared/automationDraft";
import { AutomationRun } from "../../shared/automationRun";
import { SavedAutomationDetail } from "./SavedAutomationDetail";
import { SavedAutomationList } from "./SavedAutomationList";

const savedAutomations: SavedAutomation[] = [
  {
    id: "automation-1",
    createdAt: "2026-06-24T00:00:00.000Z",
    name: "Morning Revenue",
    summary: "Collect yesterday's revenue and draft a team email.",
    steps: [
      {
        title: "Open spreadsheet",
        nodeType: "deterministic",
        description: "Open the workbook.",
        details: draftStepDetails()
      },
      {
        title: "Draft email",
        nodeType: "llm",
        description: "Write the update.",
        details: draftStepDetails()
      }
    ]
  },
  {
    id: "automation-2",
    createdAt: "2026-06-24T01:00:00.000Z",
    name: "Weekly Report",
    summary: "Prepare the weekly report.",
    steps: [
      {
        title: "Open report",
        nodeType: "deterministic",
        description: "Open the report app.",
        details: draftStepDetails()
      }
    ]
  }
];

const latestRun: AutomationRun = {
  id: "run-1",
  automationId: "automation-1",
  status: "completed",
  startedAt: "2026-06-24T02:00:00.000Z",
  completedAt: "2026-06-24T02:01:00.000Z",
  approvals: [],
  logs: [],
  steps: [
    {
      title: "Open spreadsheet",
      nodeType: "deterministic",
      status: "completed",
      message: "Completed.",
      actionType: "launch_app",
      logs: []
    }
  ]
};

describe("SavedAutomationList", () => {
  it("renders saved automations as compact sidebar items without inline graph details", () => {
    const html = renderToStaticMarkup(
      <SavedAutomationList
        savedAutomations={savedAutomations}
        latestRunByAutomationId={{ "automation-1": latestRun }}
        selectedAutomationId="automation-1"
        onSelectNew={() => undefined}
        onSelectAutomation={() => undefined}
      />
    );

    expect(html).toContain("New automation");
    expect(html).toContain("Morning Revenue");
    expect(html).toContain("Weekly Report");
    expect(html).toContain("Completed");
    expect(html).not.toContain("Inspectable automation flow");
    expect(html).not.toContain("Morning Revenue automation graph");
  });

  it("renders the refreshed saved automation list without a deleted automation", () => {
    const html = renderToStaticMarkup(
      <SavedAutomationList
        savedAutomations={[savedAutomations[1]]}
        latestRunByAutomationId={{}}
        selectedAutomationId={null}
        onSelectNew={() => undefined}
        onSelectAutomation={() => undefined}
      />
    );

    expect(html).not.toContain("Morning Revenue");
    expect(html).toContain("Weekly Report");
  });

  it("renders the focused saved automation detail with graph and run controls", () => {
    const html = renderToStaticMarkup(
      <SavedAutomationDetail
        automation={savedAutomations[0]}
        latestRun={latestRun}
        runningAutomationId={null}
        onRun={() => undefined}
        onEdit={() => undefined}
        onDelete={() => undefined}
        onApproval={() => undefined}
      />
    );

    expect(html).toContain("Saved automation");
    expect(html).toContain("Morning Revenue automation graph");
    expect(html).toContain("Inspectable automation flow");
    expect(html).toContain("Edit");
    expect(html).toContain("Run");
    expect(html).toContain("Delete");
    expect(html).toContain("Latest run");
    expect(html).toContain("Completed");
  });
});

function draftStepDetails(): DraftStepDetails {
  return {
    inputs: [],
    outputs: [],
    fallbacks: [],
    verification: []
  };
}
