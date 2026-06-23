import { randomUUID } from "node:crypto";

import { DraftAutomation, nodeTypes, SavedAutomation } from "../shared/draftAutomation.js";

export class SaveAutomationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400
  ) {
    super(message);
    this.name = "SaveAutomationError";
  }
}

export interface SavedAutomationStoreConfig {
  idFactory?: () => string;
  now?: () => Date;
}

export function createSavedAutomationStore(config: SavedAutomationStoreConfig = {}) {
  const savedAutomations: SavedAutomation[] = [];
  const idFactory = config.idFactory ?? randomUUID;
  const now = config.now ?? (() => new Date());

  return {
    list(): SavedAutomation[] {
      return savedAutomations.map(cloneSavedAutomation);
    },

    save(draft: unknown): SavedAutomation {
      const validDraft = validateDraft(draft);
      const savedAutomation: SavedAutomation = {
        ...validDraft,
        id: idFactory(),
        createdAt: now().toISOString()
      };

      savedAutomations.unshift(savedAutomation);
      return cloneSavedAutomation(savedAutomation);
    }
  };
}

function validateDraft(value: unknown): DraftAutomation {
  if (!isRecord(value)) {
    throw invalidDraftError();
  }

  const { name, summary, steps } = value;
  if (typeof name !== "string" || !name.trim()) {
    throw invalidDraftError();
  }

  if (typeof summary !== "string" || !summary.trim()) {
    throw invalidDraftError();
  }

  if (!Array.isArray(steps) || steps.length === 0) {
    throw invalidDraftError();
  }

  return {
    name: name.trim(),
    summary: summary.trim(),
    steps: steps.map(validateStep)
  };
}

function validateStep(value: unknown): DraftAutomation["steps"][number] {
  if (!isRecord(value)) {
    throw invalidDraftError();
  }

  const { title, nodeType, description } = value;
  if (typeof title !== "string" || !title.trim()) {
    throw invalidDraftError();
  }

  if (!nodeTypes.includes(nodeType as DraftAutomation["steps"][number]["nodeType"])) {
    throw invalidDraftError();
  }

  if (typeof description !== "string" || !description.trim()) {
    throw invalidDraftError();
  }

  return {
    title: title.trim(),
    nodeType: nodeType as DraftAutomation["steps"][number]["nodeType"],
    description: description.trim()
  };
}

function invalidDraftError(): SaveAutomationError {
  return new SaveAutomationError(
    "INVALID_DRAFT_AUTOMATION",
    "Generate a draft automation before saving."
  );
}

function cloneSavedAutomation(savedAutomation: SavedAutomation): SavedAutomation {
  return {
    ...savedAutomation,
    steps: savedAutomation.steps.map((step) => ({ ...step }))
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
