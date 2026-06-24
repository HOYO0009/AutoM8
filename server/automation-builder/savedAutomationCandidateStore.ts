import { randomUUID } from "node:crypto";

import { DraftAutomation, nodeTypes, SavedAutomationCandidate } from "../../shared/draftAutomation.js";

export class SaveAutomationCandidateError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400
  ) {
    super(message);
    this.name = "SaveAutomationCandidateError";
  }
}

export interface SavedAutomationCandidateStoreConfig {
  idFactory?: () => string;
  now?: () => Date;
}

export function createSavedAutomationCandidateStore(config: SavedAutomationCandidateStoreConfig = {}) {
  const savedAutomationCandidates: SavedAutomationCandidate[] = [];
  const idFactory = config.idFactory ?? randomUUID;
  const now = config.now ?? (() => new Date());

  return {
    list(): SavedAutomationCandidate[] {
      return savedAutomationCandidates.map(cloneSavedAutomationCandidate);
    },

    get(id: string): SavedAutomationCandidate | undefined {
      const savedAutomationCandidate = savedAutomationCandidates.find((automation) => automation.id === id);
      return savedAutomationCandidate ? cloneSavedAutomationCandidate(savedAutomationCandidate) : undefined;
    },

    save(draft: unknown): SavedAutomationCandidate {
      const validDraft = validateDraft(draft);
      const savedAutomationCandidate: SavedAutomationCandidate = {
        ...validDraft,
        id: idFactory(),
        createdAt: now().toISOString()
      };

      savedAutomationCandidates.unshift(savedAutomationCandidate);
      return cloneSavedAutomationCandidate(savedAutomationCandidate);
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

function invalidDraftError(): SaveAutomationCandidateError {
  return new SaveAutomationCandidateError(
    "INVALID_DRAFT_AUTOMATION",
    "Generate a draft automation before saving."
  );
}

function cloneSavedAutomationCandidate(savedAutomationCandidate: SavedAutomationCandidate): SavedAutomationCandidate {
  return {
    ...savedAutomationCandidate,
    steps: savedAutomationCandidate.steps.map((step) => ({ ...step }))
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
