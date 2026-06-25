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
});
