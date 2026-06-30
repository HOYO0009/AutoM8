import { useEffect, useState } from "react";

import { DraftAutomation, SavedAutomationCandidate } from "../../shared/automationDraft";
import {
  ApiClientError,
  fetchSavedAutomationCandidates,
  replaceSavedAutomation,
  saveDraftAutomation
} from "../api/autom8Api";

export function useSavedAutomationCatalog() {
  const [savedAutomationCandidates, setSavedAutomationCandidates] = useState<SavedAutomationCandidate[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [editSaveError, setEditSaveError] = useState<string | null>(null);
  const [editSavedNotice, setEditSavedNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSavedAutomationCandidates() {
      try {
        const candidates = await fetchSavedAutomationCandidates();
        if (isMounted) {
          setSavedAutomationCandidates(candidates);
        }
      } catch {
        // Saved automations are still available after the next successful save.
      }
    }

    void loadSavedAutomationCandidates();

    return () => {
      isMounted = false;
    };
  }, []);

  function clearDraftSaveFeedback() {
    setSaveError(null);
    setSavedNotice(null);
  }

  function clearEditSaveFeedback() {
    setEditSaveError(null);
    setEditSavedNotice(null);
  }

  function resetEditSaveState() {
    clearEditSaveFeedback();
    setIsSavingEdit(false);
  }

  async function saveDraft(draft: DraftAutomation): Promise<SavedAutomationCandidate | null> {
    if (isSaving) {
      return null;
    }

    setIsSaving(true);
    clearDraftSaveFeedback();

    try {
      const payload = await saveDraftAutomation(draft);
      setSavedAutomationCandidates(payload.savedAutomationCandidates);
      setSavedNotice(`Saved "${payload.savedAutomationCandidate.name}".`);
      return payload.savedAutomationCandidate;
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
  ): Promise<SavedAutomationCandidate | null> {
    if (isSavingEdit) {
      return null;
    }

    setIsSavingEdit(true);
    clearEditSaveFeedback();

    try {
      const payload = await replaceSavedAutomation(automationId, editDraft);
      setSavedAutomationCandidates(payload.savedAutomationCandidates);
      setEditSavedNotice(`Saved changes to "${payload.savedAutomationCandidate.name}".`);
      return payload.savedAutomationCandidate;
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

  return {
    savedAutomationCandidates,
    saveError,
    savedNotice,
    editSaveError,
    editSavedNotice,
    isSaving,
    isSavingEdit,
    clearDraftSaveFeedback,
    clearEditSaveFeedback,
    resetEditSaveState,
    saveDraft,
    saveEditedAutomation
  };
}
