import { useAutomationRuns } from "../automationRunner/useAutomationRuns";
import { useDraftAutomationCreation } from "./useDraftAutomationCreation";
import { useSavedAutomationCatalog } from "./useSavedAutomationCatalog";
import { useSavedAutomationEdit } from "./useSavedAutomationEdit";

export { examplePrompt } from "./useDraftAutomationCreation";

export function useAutomationWorkspace() {
  const savedAutomationCatalog = useSavedAutomationCatalog();
  const draftAutomationCreation = useDraftAutomationCreation({
    clearSaveFeedback: savedAutomationCatalog.clearDraftSaveFeedback
  });
  const savedAutomationEdit = useSavedAutomationEdit({
    clearSaveFeedback: savedAutomationCatalog.clearEditSaveFeedback
  });
  const automationRuns = useAutomationRuns();

  async function saveDraft() {
    if (!draftAutomationCreation.draft) {
      return null;
    }

    return savedAutomationCatalog.saveDraft(draftAutomationCreation.draft);
  }

  async function saveEditedAutomation(automationId: string) {
    if (!savedAutomationEdit.editDraft) {
      return null;
    }

    const savedAutomation = await savedAutomationCatalog.saveEditedAutomation(
      automationId,
      savedAutomationEdit.editDraft
    );
    if (savedAutomation) {
      automationRuns.clearRunsForAutomation(automationId);
    }

    return savedAutomation;
  }

  async function deleteSavedAutomation(automationId: string) {
    const didDelete = await savedAutomationCatalog.deleteAutomation(automationId);
    if (didDelete) {
      automationRuns.clearRunsForAutomation(automationId);
    }

    return didDelete;
  }

  function resetEditWorkspace() {
    savedAutomationEdit.resetEditWorkspace();
    savedAutomationCatalog.resetEditSaveState();
  }

  return {
    prompt: draftAutomationCreation.prompt,
    setPrompt: draftAutomationCreation.setPrompt,
    draft: draftAutomationCreation.draft,
    clarificationQuestions: draftAutomationCreation.clarificationQuestions,
    clarificationAnswerText: draftAutomationCreation.clarificationAnswerText,
    error: draftAutomationCreation.error,
    saveError: savedAutomationCatalog.saveError,
    savedNotice: savedAutomationCatalog.savedNotice,
    editPrompt: savedAutomationEdit.editPrompt,
    setEditPrompt: savedAutomationEdit.setEditPrompt,
    editDraft: savedAutomationEdit.editDraft,
    editClarificationQuestions: savedAutomationEdit.editClarificationQuestions,
    editClarificationAnswerText: savedAutomationEdit.editClarificationAnswerText,
    editError: savedAutomationEdit.editError,
    editSaveError: savedAutomationCatalog.editSaveError,
    editSavedNotice: savedAutomationCatalog.editSavedNotice,
    deleteError: savedAutomationCatalog.deleteError,
    savedAutomations: savedAutomationCatalog.savedAutomations,
    latestRunByAutomationId: automationRuns.latestRunByAutomationId,
    runErrors: automationRuns.runErrors,
    isGenerating: draftAutomationCreation.isGenerating,
    isSaving: savedAutomationCatalog.isSaving,
    isGeneratingEdit: savedAutomationEdit.isGeneratingEdit,
    isSavingEdit: savedAutomationCatalog.isSavingEdit,
    deletingAutomationId: savedAutomationCatalog.deletingAutomationId,
    runningAutomationId: automationRuns.runningAutomationId,
    canGenerate: draftAutomationCreation.canGenerate,
    canSubmitClarifications: draftAutomationCreation.canSubmitClarifications,
    promptWordCount: draftAutomationCreation.promptWordCount,
    canGenerateEdit: savedAutomationEdit.canGenerateEdit,
    canSubmitEditClarifications: savedAutomationEdit.canSubmitEditClarifications,
    editPromptWordCount: savedAutomationEdit.editPromptWordCount,
    generateDraft: draftAutomationCreation.generateDraft,
    submitClarificationAnswers: draftAutomationCreation.submitClarificationAnswers,
    generateEditDraft: savedAutomationEdit.generateEditDraft,
    submitEditClarificationAnswers: savedAutomationEdit.submitEditClarificationAnswers,
    updateClarificationAnswer: draftAutomationCreation.updateClarificationAnswer,
    updateEditClarificationAnswer: savedAutomationEdit.updateEditClarificationAnswer,
    saveDraft,
    saveEditedAutomation,
    deleteSavedAutomation,
    resetEditWorkspace,
    runAutomation: automationRuns.runAutomation,
    decideApproval: automationRuns.decideApproval
  };
}
