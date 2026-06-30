import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

import { DraftValidationError, cloneSavedAutomation, validateDraftAutomationShape } from "../../shared/draftValidation.js";
import { SavedAutomation } from "../../shared/automationDraft.js";

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
  storagePath?: string;
}

export function createSavedAutomationStore(config: SavedAutomationStoreConfig = {}) {
  const storagePath = config.storagePath ?? path.resolve(process.cwd(), ".autom8-data/saved-automations.json");
  let savedAutomations = loadSavedAutomations(storagePath);
  const idFactory = config.idFactory ?? randomUUID;
  const now = config.now ?? (() => new Date());

  return {
    list(): SavedAutomation[] {
      return savedAutomations.map(cloneSavedAutomation);
    },

    get(id: string): SavedAutomation | undefined {
      const savedAutomation = savedAutomations.find((automation) => automation.id === id);
      return savedAutomation ? cloneSavedAutomation(savedAutomation) : undefined;
    },

    save(draft: unknown): SavedAutomation {
      const validDraft = validateDraftForSave(draft);
      const savedAutomation: SavedAutomation = {
        ...validDraft,
        id: idFactory(),
        createdAt: now().toISOString()
      };

      const nextSavedAutomations = [savedAutomation, ...savedAutomations];
      persistSavedAutomations(storagePath, nextSavedAutomations);
      savedAutomations = nextSavedAutomations;
      return cloneSavedAutomation(savedAutomation);
    },

    replace(id: string, draft: unknown): SavedAutomation {
      const index = savedAutomations.findIndex((automation) => automation.id === id);
      if (index === -1) {
        throw new SaveAutomationError(
          "SAVED_AUTOMATION_NOT_FOUND",
          "Choose an existing saved automation before saving changes.",
          404
        );
      }

      const validDraft = validateDraftForSave(draft);
      const savedAutomation: SavedAutomation = {
        ...validDraft,
        id: savedAutomations[index].id,
        createdAt: savedAutomations[index].createdAt
      };

      const nextSavedAutomations = savedAutomations.map((automation, automationIndex) =>
        automationIndex === index ? savedAutomation : automation
      );
      persistSavedAutomations(storagePath, nextSavedAutomations);
      savedAutomations = nextSavedAutomations;
      return cloneSavedAutomation(savedAutomation);
    },

    delete(id: string): void {
      const existingAutomation = savedAutomations.find((automation) => automation.id === id);
      if (!existingAutomation) {
        throw new SaveAutomationError(
          "SAVED_AUTOMATION_NOT_FOUND",
          "Choose an existing saved automation before deleting.",
          404
        );
      }

      const nextSavedAutomations = savedAutomations.filter((automation) => automation.id !== id);
      persistSavedAutomations(storagePath, nextSavedAutomations);
      savedAutomations = nextSavedAutomations;
    }
  };
}

function loadSavedAutomations(storagePath: string): SavedAutomation[] {
  if (!existsSync(storagePath)) {
    return [];
  }

  let payload: unknown;
  try {
    payload = JSON.parse(readFileSync(storagePath, "utf8"));
  } catch {
    throw invalidSavedAutomationStoreError();
  }

  if (!isRecord(payload) || !Array.isArray(payload.savedAutomations)) {
    throw invalidSavedAutomationStoreError();
  }

  try {
    return payload.savedAutomations.map(validateSavedAutomationForLoad);
  } catch (error) {
    if (error instanceof DraftValidationError || error instanceof SaveAutomationError) {
      throw invalidSavedAutomationStoreError();
    }

    throw error;
  }
}

function persistSavedAutomations(storagePath: string, savedAutomations: SavedAutomation[]): void {
  mkdirSync(path.dirname(storagePath), { recursive: true });
  const temporaryPath = `${storagePath}.${randomUUID()}.tmp`;
  const payload = {
    savedAutomations: savedAutomations.map(cloneSavedAutomation)
  };

  writeFileSync(temporaryPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  renameSync(temporaryPath, storagePath);
}

function validateSavedAutomationForLoad(value: unknown): SavedAutomation {
  if (!isRecord(value)) {
    throw invalidSavedAutomationStoreError();
  }

  if (typeof value.id !== "string" || !value.id.trim()) {
    throw invalidSavedAutomationStoreError();
  }

  if (typeof value.createdAt !== "string" || !value.createdAt.trim()) {
    throw invalidSavedAutomationStoreError();
  }

  return {
    ...validateDraftAutomationShape(value),
    id: value.id.trim(),
    createdAt: value.createdAt.trim()
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

function invalidDraftError(): SaveAutomationError {
  return new SaveAutomationError(
    "INVALID_DRAFT_AUTOMATION",
    "Generate a draft automation before saving."
  );
}

function invalidSavedAutomationStoreError(): SaveAutomationError {
  return new SaveAutomationError(
    "INVALID_SAVED_AUTOMATIONS_STORE",
    "The local saved automations file is invalid. Fix or remove it before starting AutoM8.",
    500
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
