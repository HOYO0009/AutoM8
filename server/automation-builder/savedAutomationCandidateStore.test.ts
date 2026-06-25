import { describe, expect, it } from "vitest";

import { createSavedAutomationCandidateStore, SaveAutomationCandidateError } from "./savedAutomationCandidateStore.js";

describe("createSavedAutomationCandidateStore", () => {
  it("saves a generated draft with an ID and creation time", () => {
    const store = createSavedAutomationCandidateStore({
      idFactory: () => "saved-1",
      now: () => new Date("2026-06-24T12:00:00.000Z")
    });

    const savedAutomationCandidate = store.save({
      name: "Send report",
      summary: "Collect the report and email it to the team.",
      steps: [
        {
          title: "Open report",
          nodeType: "deterministic",
          description: "Open the latest report file.",
          details: {
            inputs: ["Latest report file"],
            outputs: ["Report is open"],
            fallbacks: ["Ask the user to locate the report"],
            verification: ["Report title is visible"]
          }
        }
      ]
    });

    expect(savedAutomationCandidate).toEqual({
      id: "saved-1",
      createdAt: "2026-06-24T12:00:00.000Z",
      name: "Send report",
      summary: "Collect the report and email it to the team.",
      steps: [
        {
          title: "Open report",
          nodeType: "deterministic",
          description: "Open the latest report file.",
          details: {
            inputs: ["Latest report file"],
            outputs: ["Report is open"],
            fallbacks: ["Ask the user to locate the report"],
            verification: ["Report title is visible"]
          }
        }
      ]
    });
    expect(store.list()).toEqual([savedAutomationCandidate]);
  });

  it("rejects saving when no valid draft is provided", () => {
    const store = createSavedAutomationCandidateStore();

    expect(() => store.save(undefined)).toThrow(SaveAutomationCandidateError);
    expect(() => store.save({ name: "Empty", summary: "No steps", steps: [] })).toThrow(
      "Generate a draft automation before saving."
    );
  });

  it("replaces a saved automation draft while preserving its ID and creation time", () => {
    const store = createSavedAutomationCandidateStore({
      idFactory: () => "saved-1",
      now: () => new Date("2026-06-24T12:00:00.000Z")
    });
    store.save({
      name: "Send report",
      summary: "Collect the report and email it to the team.",
      steps: [
        {
          title: "Open report",
          nodeType: "deterministic",
          description: "Open the latest report file.",
          details: {
            inputs: ["Latest report file"],
            outputs: ["Report is open"],
            fallbacks: ["Ask the user to locate the report"],
            verification: ["Report title is visible"]
          }
        }
      ]
    });

    const updated = store.replace("saved-1", {
      name: "Send report and Slack update",
      summary: "Collect the report, email the team, and draft a Slack update.",
      steps: [
        {
          title: "Draft Slack update",
          nodeType: "llm",
          description: "Write a short Slack update.",
          details: {
            inputs: ["Report summary"],
            outputs: ["Unsent Slack draft"],
            fallbacks: ["Ask the user for the Slack destination"],
            verification: ["Slack draft remains unsent"]
          }
        }
      ]
    });

    expect(updated).toEqual({
      id: "saved-1",
      createdAt: "2026-06-24T12:00:00.000Z",
      name: "Send report and Slack update",
      summary: "Collect the report, email the team, and draft a Slack update.",
      steps: [
        {
          title: "Draft Slack update",
          nodeType: "llm",
          description: "Write a short Slack update.",
          details: {
            inputs: ["Report summary"],
            outputs: ["Unsent Slack draft"],
            fallbacks: ["Ask the user for the Slack destination"],
            verification: ["Slack draft remains unsent"]
          }
        }
      ]
    });
    expect(store.list()).toEqual([updated]);
  });

  it("rejects replacing an unknown saved automation", () => {
    const store = createSavedAutomationCandidateStore();

    expect(() =>
      store.replace("missing", {
        name: "Updated",
        summary: "Updated automation.",
        steps: [
          {
            title: "Updated step",
            nodeType: "deterministic",
            description: "Do the updated work.",
            details: {
              inputs: ["Input"],
              outputs: ["Output"],
              fallbacks: ["Fallback"],
              verification: ["Verified"]
            }
          }
        ]
      })
    ).toThrow("Choose an existing saved automation before saving changes.");
  });
});
