import { describe, expect, it } from "vitest";

import { createSavedAutomationStore, SaveAutomationError } from "./savedAutomationStore.js";

describe("createSavedAutomationStore", () => {
  it("saves a generated draft with an ID and creation time", () => {
    const store = createSavedAutomationStore({
      idFactory: () => "saved-1",
      now: () => new Date("2026-06-24T12:00:00.000Z")
    });

    const savedAutomation = store.save({
      name: "Send report",
      summary: "Collect the report and email it to the team.",
      steps: [
        {
          title: "Open report",
          nodeType: "deterministic",
          description: "Open the latest report file."
        }
      ]
    });

    expect(savedAutomation).toEqual({
      id: "saved-1",
      createdAt: "2026-06-24T12:00:00.000Z",
      name: "Send report",
      summary: "Collect the report and email it to the team.",
      steps: [
        {
          title: "Open report",
          nodeType: "deterministic",
          description: "Open the latest report file."
        }
      ]
    });
    expect(store.list()).toEqual([savedAutomation]);
  });

  it("rejects saving when no valid draft is provided", () => {
    const store = createSavedAutomationStore();

    expect(() => store.save(undefined)).toThrow(SaveAutomationError);
    expect(() => store.save({ name: "Empty", summary: "No steps", steps: [] })).toThrow(
      "Generate a draft automation before saving."
    );
  });
});
