import { describe, expect, it } from "vitest";

import { DraftStepDetails } from "./automationDraft.js";
import {
  cloneDraftAutomation,
  cloneSavedAutomationCandidate,
  DraftValidationError,
  validateClarificationAnswersShape,
  validateDraftAutomationCreationResultShape,
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
            description: "  Open the report file.  ",
            details: {
              inputs: ["  C:/Reports/sales.xlsx  "],
              outputs: ["  Open workbook  "],
              fallbacks: [],
              verification: ["  Workbook title is visible  "]
            }
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
          description: "Open the report file.",
          details: {
            inputs: ["C:/Reports/sales.xlsx"],
            outputs: ["Open workbook"],
            fallbacks: [],
            verification: ["Workbook title is visible"]
          }
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
            description: "Open the report file.",
            details: draftStepDetails()
          }
        ]
      })
    ).toThrow(expect.objectContaining({ stage: "step-node-type" }));
  });

  it("throws DraftValidationError for invalid shapes", () => {
    expect(() => validateDraftAutomationShape(undefined)).toThrow(DraftValidationError);
  });

  it("requires Draft Step Details on every step", () => {
    expect(() =>
      validateDraftAutomationShape({
        name: "Send report",
        summary: "Email the report.",
        steps: [
          {
            title: "Open report",
            nodeType: "deterministic",
            description: "Open the report file."
          }
        ]
      })
    ).toThrow(expect.objectContaining({ stage: "step-details-shape" }));
  });
});

describe("validateDraftAutomationCreationResultShape", () => {
  it("accepts clarification questions without a draft", () => {
    expect(
      validateDraftAutomationCreationResultShape({
        status: "needs_clarification",
        draft: null,
        questions: [
          {
            id: "sales-spreadsheet",
            question: "Which sales spreadsheet should AutoM8 open?",
            reason: "AutoM8 needs the exact source before it can create a runnable draft."
          }
        ]
      })
    ).toEqual({
      status: "needs_clarification",
      draft: null,
      questions: [
        {
          id: "sales-spreadsheet",
          question: "Which sales spreadsheet should AutoM8 open?",
          reason: "AutoM8 needs the exact source before it can create a runnable draft."
        }
      ]
    });
  });

  it("accepts a created draft with no unanswered questions", () => {
    const result = validateDraftAutomationCreationResultShape({
      status: "draft_created",
      draft: {
        name: "Daily Sales Summary",
        summary: "Draft the daily revenue summary email.",
        steps: [
          {
            title: "Open sales spreadsheet",
            nodeType: "deterministic",
            description: "Open the sales spreadsheet.",
            details: draftStepDetails({ inputs: ["Sales spreadsheet"] })
          }
        ]
      },
      questions: []
    });

    expect(result.status).toBe("draft_created");
    expect(result.draft?.steps[0].details.inputs).toEqual(["Sales spreadsheet"]);
  });

  it("rejects contradictory creation result states", () => {
    expect(() =>
      validateDraftAutomationCreationResultShape({
        status: "needs_clarification",
        draft: {
          name: "Bad",
          summary: "Bad.",
          steps: []
        },
        questions: []
      })
    ).toThrow(expect.objectContaining({ stage: "creation-result-draft" }));

    expect(() =>
      validateDraftAutomationCreationResultShape({
        status: "draft_created",
        draft: {
          name: "Bad",
          summary: "Bad.",
          steps: []
        },
        questions: [
          {
            id: "still-missing",
            question: "What is missing?",
            reason: "A created draft cannot have unanswered blockers."
          }
        ]
      })
    ).toThrow(expect.objectContaining({ stage: "creation-result-questions" }));
  });
});

describe("validateClarificationAnswersShape", () => {
  it("trims Clarification Answers", () => {
    expect(
      validateClarificationAnswersShape([
        {
          questionId: "  sales-spreadsheet  ",
          question: "  Which sales spreadsheet should AutoM8 open?  ",
          reason: "  AutoM8 needs the exact source before it can create a runnable draft.  ",
          answer: "  C:/Reports/sales.xlsx  "
        }
      ])
    ).toEqual([
      {
        questionId: "sales-spreadsheet",
        question: "Which sales spreadsheet should AutoM8 open?",
        reason: "AutoM8 needs the exact source before it can create a runnable draft.",
        answer: "C:/Reports/sales.xlsx"
      }
    ]);
  });

  it("rejects empty Clarification Answers", () => {
    expect(() =>
      validateClarificationAnswersShape([
        {
          questionId: "sales-spreadsheet",
          question: "Which sales spreadsheet should AutoM8 open?",
          reason: "AutoM8 needs the exact source before it can create a runnable draft.",
          answer: " "
        }
      ])
    ).toThrow(expect.objectContaining({ stage: "clarification-answer-answer" }));
  });

  it("rejects malformed Clarification Answer continuations", () => {
    expect(() =>
      validateClarificationAnswersShape([
        {
          questionId: "sales-spreadsheet",
          reason: "AutoM8 needs the exact source before it can create a runnable draft.",
          answer: "C:/Reports/sales.xlsx"
        }
      ])
    ).toThrow(expect.objectContaining({ stage: "clarification-answer-question" }));

    expect(() =>
      validateClarificationAnswersShape([
        {
          questionId: "sales-spreadsheet",
          question: "Which sales spreadsheet should AutoM8 open?",
          answer: "C:/Reports/sales.xlsx"
        }
      ])
    ).toThrow(expect.objectContaining({ stage: "clarification-answer-reason" }));

    expect(() =>
      validateClarificationAnswersShape([
        {
          questionId: "sales-spreadsheet",
          answer: "C:/Reports/sales.xlsx"
        }
      ])
    ).toThrow(expect.objectContaining({ stage: "clarification-answer-question" }));
  });
});

describe("draft cloning", () => {
  it("clones draft steps without sharing nested references", () => {
    const draft = validateDraftAutomationShape({
      name: "Send report",
      summary: "Email the report.",
      steps: [
        {
          title: "Open report",
          nodeType: "deterministic",
          description: "Open the report file.",
          details: draftStepDetails({ inputs: ["Report"] })
        }
      ]
    });
    const clone = cloneDraftAutomation(draft);

    expect(clone).toEqual(draft);
    expect(clone).not.toBe(draft);
    expect(clone.steps[0]).not.toBe(draft.steps[0]);
    expect(clone.steps[0].details.inputs).not.toBe(draft.steps[0].details.inputs);
  });

  it("clones saved candidates without sharing nested references", () => {
    const saved = {
      id: "saved-1",
      createdAt: "2026-06-24T12:00:00.000Z",
      name: "Send report",
      summary: "Email the report.",
      steps: [
        {
          title: "Open report",
          nodeType: "deterministic" as const,
          description: "Open the report file.",
          details: draftStepDetails({ inputs: ["Report"] })
        }
      ]
    };
    const clone = cloneSavedAutomationCandidate(saved);

    expect(clone).toEqual(saved);
    expect(clone).not.toBe(saved);
    expect(clone.steps[0]).not.toBe(saved.steps[0]);
    expect(clone.steps[0].details.inputs).not.toBe(saved.steps[0].details.inputs);
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
