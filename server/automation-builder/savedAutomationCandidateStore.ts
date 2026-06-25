import { randomUUID } from "node:crypto";

import { DraftValidationError, cloneSavedAutomationCandidate, validateDraftAutomationShape } from "../../shared/draftValidation.js";
import { SavedAutomationCandidate } from "../../shared/draftAutomation.js";

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
      const validDraft = validateDraftForSave(draft);
      const savedAutomationCandidate: SavedAutomationCandidate = {
        ...validDraft,
        id: idFactory(),
        createdAt: now().toISOString()
      };

      savedAutomationCandidates.unshift(savedAutomationCandidate);
      return cloneSavedAutomationCandidate(savedAutomationCandidate);
    },

    replace(id: string, draft: unknown): SavedAutomationCandidate {
      const index = savedAutomationCandidates.findIndex((automation) => automation.id === id);
      if (index === -1) {
        throw new SaveAutomationCandidateError(
          "SAVED_AUTOMATION_NOT_FOUND",
          "Choose an existing saved automation before saving changes.",
          404
        );
      }

      const validDraft = validateDraftForSave(draft);
      const savedAutomationCandidate: SavedAutomationCandidate = {
        ...validDraft,
        id: savedAutomationCandidates[index].id,
        createdAt: savedAutomationCandidates[index].createdAt
      };

      savedAutomationCandidates[index] = savedAutomationCandidate;
      return cloneSavedAutomationCandidate(savedAutomationCandidate);
    }
  };
}

function validateDraftForSave(value: unknown) {
  try {
    return validateDraftAutomationShape(value);
  } catch (error) {
    if (error instanceof DraftValidationError) {
      throw invalidDraftError();
    }

    throw error;
  }
}

function invalidDraftError(): SaveAutomationCandidateError {
  return new SaveAutomationCandidateError(
    "INVALID_DRAFT_AUTOMATION",
    "Generate a draft automation before saving."
  );
}
