import {
  ClarificationAnswer,
  ClarificationQuestion,
  DraftAutomation,
  DraftAutomationCreationResult,
  DraftNodeType,
  DraftStepDetails,
  nodeTypes,
  SavedAutomationCandidate
} from "./automationDraft.js";

export type DraftValidationStage =
  | "creation-result-shape"
  | "creation-result-status"
  | "creation-result-draft"
  | "creation-result-questions"
  | "clarification-question-shape"
  | "clarification-question-id"
  | "clarification-question-question"
  | "clarification-question-reason"
  | "clarification-answer-shape"
  | "clarification-answer-question-id"
  | "clarification-answer-question"
  | "clarification-answer-reason"
  | "clarification-answer-answer"
  | "draft-shape"
  | "draft-name"
  | "draft-summary"
  | "draft-steps"
  | "step-shape"
  | "step-title"
  | "step-node-type"
  | "step-description"
  | "step-details-shape"
  | "step-details-inputs"
  | "step-details-outputs"
  | "step-details-fallbacks"
  | "step-details-verification";

export class DraftValidationError extends Error {
  constructor(public readonly stage: DraftValidationStage) {
    super(`Invalid draft automation at ${stage}.`);
    this.name = "DraftValidationError";
  }
}

export function validateDraftAutomationCreationResultShape(value: unknown): DraftAutomationCreationResult {
  if (!isRecord(value)) {
    throw new DraftValidationError("creation-result-shape");
  }

  const { status, draft, questions } = value;
  if (status !== "needs_clarification" && status !== "draft_created") {
    throw new DraftValidationError("creation-result-status");
  }

  if (!Array.isArray(questions)) {
    throw new DraftValidationError("creation-result-questions");
  }

  if (status === "needs_clarification") {
    if (draft !== null || questions.length === 0) {
      throw new DraftValidationError("creation-result-draft");
    }

    return {
      status,
      draft: null,
      questions: questions.map(validateClarificationQuestion)
    };
  }

  if (draft === null) {
    throw new DraftValidationError("creation-result-draft");
  }

  if (questions.length !== 0) {
    throw new DraftValidationError("creation-result-questions");
  }

  return {
    status,
    draft: validateDraftAutomationShape(draft),
    questions: []
  };
}

export function validateDraftAutomationShape(value: unknown): DraftAutomation {
  if (!isRecord(value)) {
    throw new DraftValidationError("draft-shape");
  }

  const { name, summary, steps } = value;
  if (typeof name !== "string" || !name.trim()) {
    throw new DraftValidationError("draft-name");
  }

  if (typeof summary !== "string" || !summary.trim()) {
    throw new DraftValidationError("draft-summary");
  }

  if (!Array.isArray(steps) || steps.length === 0) {
    throw new DraftValidationError("draft-steps");
  }

  return {
    name: name.trim(),
    summary: summary.trim(),
    steps: steps.map(validateDraftAutomationStep)
  };
}

export function cloneDraftAutomation(draft: DraftAutomation): DraftAutomation {
  return {
    ...draft,
    steps: draft.steps.map((step) => ({
      ...step,
      details: cloneDraftStepDetails(step.details)
    }))
  };
}

export function cloneSavedAutomationCandidate(savedAutomationCandidate: SavedAutomationCandidate): SavedAutomationCandidate {
  return {
    ...savedAutomationCandidate,
    steps: savedAutomationCandidate.steps.map((step) => ({
      ...step,
      details: cloneDraftStepDetails(step.details)
    }))
  };
}

export function validateClarificationAnswersShape(value: unknown): ClarificationAnswer[] {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new DraftValidationError("clarification-answer-shape");
  }

  return value.map(validateClarificationAnswer);
}

export function isDraftNodeType(value: unknown): value is DraftNodeType {
  return nodeTypes.includes(value as DraftNodeType);
}

function validateDraftAutomationStep(value: unknown): DraftAutomation["steps"][number] {
  if (!isRecord(value)) {
    throw new DraftValidationError("step-shape");
  }

  const { title, nodeType, description, details } = value;
  if (typeof title !== "string" || !title.trim()) {
    throw new DraftValidationError("step-title");
  }

  if (!isDraftNodeType(nodeType)) {
    throw new DraftValidationError("step-node-type");
  }

  if (typeof description !== "string" || !description.trim()) {
    throw new DraftValidationError("step-description");
  }

  return {
    title: title.trim(),
    nodeType,
    description: description.trim(),
    details: validateDraftStepDetails(details)
  };
}

function validateDraftStepDetails(value: unknown): DraftStepDetails {
  if (!isRecord(value)) {
    throw new DraftValidationError("step-details-shape");
  }

  return {
    inputs: validateTextList(value.inputs, "step-details-inputs"),
    outputs: validateTextList(value.outputs, "step-details-outputs"),
    fallbacks: validateTextList(value.fallbacks, "step-details-fallbacks"),
    verification: validateTextList(value.verification, "step-details-verification")
  };
}

function validateClarificationQuestion(value: unknown): ClarificationQuestion {
  if (!isRecord(value)) {
    throw new DraftValidationError("clarification-question-shape");
  }

  const { id, question, reason } = value;
  if (typeof id !== "string" || !id.trim()) {
    throw new DraftValidationError("clarification-question-id");
  }
  if (typeof question !== "string" || !question.trim()) {
    throw new DraftValidationError("clarification-question-question");
  }
  if (typeof reason !== "string" || !reason.trim()) {
    throw new DraftValidationError("clarification-question-reason");
  }

  return {
    id: id.trim(),
    question: question.trim(),
    reason: reason.trim()
  };
}

function validateClarificationAnswer(value: unknown): ClarificationAnswer {
  if (!isRecord(value)) {
    throw new DraftValidationError("clarification-answer-shape");
  }

  const { questionId, question, reason, answer } = value;
  if (typeof questionId !== "string" || !questionId.trim()) {
    throw new DraftValidationError("clarification-answer-question-id");
  }
  if (typeof question !== "string" || !question.trim()) {
    throw new DraftValidationError("clarification-answer-question");
  }
  if (typeof reason !== "string" || !reason.trim()) {
    throw new DraftValidationError("clarification-answer-reason");
  }
  if (typeof answer !== "string" || !answer.trim()) {
    throw new DraftValidationError("clarification-answer-answer");
  }

  return {
    questionId: questionId.trim(),
    question: question.trim(),
    reason: reason.trim(),
    answer: answer.trim()
  };
}

function validateTextList(value: unknown, stage: DraftValidationStage): string[] {
  if (!Array.isArray(value)) {
    throw new DraftValidationError(stage);
  }

  return value.map((item) => {
    if (typeof item !== "string" || !item.trim()) {
      throw new DraftValidationError(stage);
    }

    return item.trim();
  });
}

function cloneDraftStepDetails(details: DraftStepDetails): DraftStepDetails {
  return {
    inputs: [...details.inputs],
    outputs: [...details.outputs],
    fallbacks: [...details.fallbacks],
    verification: [...details.verification]
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
