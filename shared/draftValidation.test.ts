import { describe, expect, it } from "vitest";

import {
  cloneDraftAutomation,
  cloneSavedAutomationCandidate,
  DraftValidationError,
  validateDraftAutomationShape
} from "./draftValidation.js";

describe("validateDraftAutomationShape", () => {
  it("trims valid draft automation fields", () => {
    expect(
      validateDraftAutomationShape({
        name: "  Send report  ",
        summary: "  Email the report.  ",
        steps: [
          {
            title: "  Open report  ",
            nodeType: "deterministic",
            description: "  Open the report file.  "
          }
        ]
      })
    ).toEqual({
      name: "Send report",
      summary: "Email the report.",
      steps: [
        {
          title: "Open report",
          nodeType: "deterministic",
          description: "Open the report file."
        }
      ]
    });
  });

  it("reports invalid node types and empty steps with stages", () => {
    expect(() =>
      validateDraftAutomationShape({
        name: "Send report",
        summary: "Email the report.",
        steps: []
      })
    ).toThrow(expect.objectContaining({ stage: "draft-steps" }));

    expect(() =>
      validateDraftAutomationShape({
        name: "Send report",
        summary: "Email the report.",
        steps: [
          {
            title: "Open report",
            nodeType: "shell",
            description: "Open the report file."
          }
        ]
      })
    ).toThrow(expect.objectContaining({ stage: "step-node-type" }));
  });

  it("throws DraftValidationError for invalid shapes", () => {
    expect(() => validateDraftAutomationShape(undefined)).toThrow(DraftValidationError);
  });
});

describe("draft cloning", () => {
  it("clones draft steps without sharing nested references", () => {
    const draft = validateDraftAutomationShape({
      name: "Send report",
      summary: "Email the report.",
      steps: [{ title: "Open report", nodeType: "deterministic", description: "Open the report file." }]
    });
    const clone = cloneDraftAutomation(draft);

    expect(clone).toEqual(draft);
    expect(clone).not.toBe(draft);
    expect(clone.steps[0]).not.toBe(draft.steps[0]);
  });

  it("clones saved candidates without sharing nested references", () => {
    const saved = {
      id: "saved-1",
      createdAt: "2026-06-24T12:00:00.000Z",
      name: "Send report",
      summary: "Email the report.",
      steps: [{ title: "Open report", nodeType: "deterministic" as const, description: "Open the report file." }]
    };
    const clone = cloneSavedAutomationCandidate(saved);

    expect(clone).toEqual(saved);
    expect(clone).not.toBe(saved);
    expect(clone.steps[0]).not.toBe(saved.steps[0]);
  });
});
