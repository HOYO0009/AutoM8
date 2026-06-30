import { useEffect, useState } from "react";

import { DraftAutomation, SavedAutomation } from "../../shared/automationDraft";
import {
  ApiClientError,
  deleteSavedAutomation,
  fetchSavedAutomations,
  replaceSavedAutomation,
  saveDraftAutomation
} from "../api/autom8Api";

export function useSavedAutomationCatalog() {
  const [savedAutomations, setSavedAutomations] = useState<SavedAutomation[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [editSaveError, setEditSaveError] = useState<string | null>(null);
  const [editSavedNotice, setEditSavedNotice] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingAutomationId, setDeletingAutomationId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSavedAutomations() {
      try {
        const automations = await fetchSavedAutomations();
        if (isMounted) {
          setSavedAutomations(automations);
        }
      } catch {
        // Saved automations are still available after the next successful save.
      }
    }

    void loadSavedAutomations();

    return () => {
      isMounted = false;
    };
  }, []);

  function clearDraftSaveFeedback() {
    setSaveError(null);
    setSavedNotice(null);
    setDeleteError(null);
  }

  function clearEditSaveFeedback() {
    setEditSaveError(null);
    setEditSavedNotice(null);
    setDeleteError(null);
  }

  function resetEditSaveState() {
    clearEditSaveFeedback();
    setIsSavingEdit(false);
  }

  async function saveDraft(draft: DraftAutomation): Promise<SavedAutomation | null> {
    if (isSaving) {
      return null;
    }

    setIsSaving(true);
    clearDraftSaveFeedback();

    try {
      const payload = await saveDraftAutomation(draft);
      setSavedAutomations(payload.savedAutomations);
      setSavedNotice(`Saved "${payload.savedAutomation.name}".`);
      return payload.savedAutomation;
    } catch (saveDraftError) {
      setSaveError(
        saveDraftError instanceof ApiClientError
          ? saveDraftError.message
          : "AutoM8 could not reach the local saved automation API."
      );
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function saveEditedAutomation(
    automationId: string,
    editDraft: DraftAutomation
  ): Promise<SavedAutomation | null> {
    if (isSavingEdit) {
      return null;
    }

    setIsSavingEdit(true);
    clearEditSaveFeedback();

    try {
      const payload = await replaceSavedAutomation(automationId, editDraft);
      setSavedAutomations(payload.savedAutomations);
      setEditSavedNotice(`Saved changes to "${payload.savedAutomation.name}".`);
      return payload.savedAutomation;
    } catch (saveDraftError) {
      setEditSaveError(
        saveDraftError instanceof ApiClientError
          ? saveDraftError.message
          : "AutoM8 could not reach the local saved automation API."
      );
      return null;
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function deleteAutomation(automationId: string): Promise<boolean> {
    if (deletingAutomationId) {
      return false;
    }

    setDeletingAutomationId(automationId);
    setDeleteError(null);

    try {
      const payload = await deleteSavedAutomation(automationId);
      setSavedAutomations(payload.savedAutomations);
      return true;
    } catch (deleteSavedAutomationError) {
      setDeleteError(
        deleteSavedAutomationError instanceof ApiClientError
          ? deleteSavedAutomationError.message
          : "AutoM8 could not reach the local saved automation API."
      );
      return false;
    } finally {
      setDeletingAutomationId(null);
    }
  }

  return {
    savedAutomations,
    saveError,
    savedNotice,
    editSaveError,
    editSavedNotice,
    deleteError,
    isSaving,
    isSavingEdit,
    deletingAutomationId,
    clearDraftSaveFeedback,
    clearEditSaveFeedback,
    resetEditSaveState,
    saveDraft,
    saveEditedAutomation,
    deleteAutomation
  };
}
