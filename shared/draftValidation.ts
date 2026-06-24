import { DraftAutomation, DraftNodeType, nodeTypes, SavedAutomationCandidate } from "./automationDraft.js";

export type DraftValidationStage =
  | "draft-shape"
  | "draft-name"
  | "draft-summary"
  | "draft-steps"
  | "step-shape"
  | "step-title"
  | "step-node-type"
  | "step-description";

export class DraftValidationError extends Error {
  constructor(public readonly stage: DraftValidationStage) {
    super(`Invalid draft automation at ${stage}.`);
    this.name = "DraftValidationError";
  }
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
    steps: draft.steps.map((step) => ({ ...step }))
  };
}

export function cloneSavedAutomationCandidate(savedAutomationCandidate: SavedAutomationCandidate): SavedAutomationCandidate {
  return {
    ...savedAutomationCandidate,
    steps: savedAutomationCandidate.steps.map((step) => ({ ...step }))
  };
}

export function isDraftNodeType(value: unknown): value is DraftNodeType {
  return nodeTypes.includes(value as DraftNodeType);
}

function validateDraftAutomationStep(value: unknown): DraftAutomation["steps"][number] {
  if (!isRecord(value)) {
    throw new DraftValidationError("step-shape");
  }

  const { title, nodeType, description } = value;
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
    description: description.trim()
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
