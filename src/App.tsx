import { useEffect, useState } from "react";

import { AutomationBuilderPane } from "./automationBuilder/AutomationBuilderPane";
import { ClarificationPanel } from "./automationBuilder/ClarificationPanel";
import { DraftPreview } from "./automationBuilder/DraftPreview";
import { EmptyPreview } from "./automationBuilder/EmptyPreview";
import { useAutomationWorkspace } from "./automationBuilder/useAutomationWorkspace";
import { SavedAutomationCandidateDetail } from "./automationRunner/SavedAutomationCandidateDetail";
import { SavedAutomationCandidateList } from "./automationRunner/SavedAutomationCandidateList";

export function App() {
  const workspace = useAutomationWorkspace();
  const [focusedAutomationId, setFocusedAutomationId] = useState<string | null>(() => getFocusedAutomationIdFromHash());
  const [editingAutomationId, setEditingAutomationId] = useState<string | null>(null);
  const focusedAutomation =
    workspace.savedAutomationCandidates.find((automation) => automation.id === focusedAutomationId) ?? null;
  const isEditingFocusedAutomation = Boolean(focusedAutomation && editingAutomationId === focusedAutomation.id);

  useEffect(() => {
    function syncFocusFromHash() {
      setFocusedAutomationId(getFocusedAutomationIdFromHash());
    }

    window.addEventListener("hashchange", syncFocusFromHash);
    return () => window.removeEventListener("hashchange", syncFocusFromHash);
  }, []);

  async function saveDraftAndFocus() {
    const savedAutomation = await workspace.saveDraft();

    if (savedAutomation) {
      setFocusedAutomationId(savedAutomation.id);
      window.history.replaceState(null, "", `#automation-${encodeURIComponent(savedAutomation.id)}`);
    }
  }

  function selectNewAutomation() {
    setFocusedAutomationId(null);
    setEditingAutomationId(null);
    workspace.resetEditWorkspace();
  }

  function selectSavedAutomation(automationId: string) {
    setFocusedAutomationId(automationId);
    setEditingAutomationId(null);
    workspace.resetEditWorkspace();
  }

  function startEditingAutomation(automationId: string) {
    workspace.resetEditWorkspace();
    setEditingAutomationId(automationId);
  }

  function cancelEditingAutomation() {
    setEditingAutomationId(null);
    workspace.resetEditWorkspace();
  }

  async function saveEditedAutomationAndFocus() {
    if (!focusedAutomation) {
      return;
    }

    const savedAutomation = await workspace.saveEditedAutomation(focusedAutomation.id);
    if (savedAutomation) {
      setFocusedAutomationId(savedAutomation.id);
      setEditingAutomationId(null);
      workspace.resetEditWorkspace();
      window.history.replaceState(null, "", `#automation-${encodeURIComponent(savedAutomation.id)}`);
    }
  }

  return (
    <main className="app-shell">
      <section className="app-workspace" aria-label="Automation builder">
        <SavedAutomationCandidateList
          savedAutomationCandidates={workspace.savedAutomationCandidates}
          latestRunByAutomationId={workspace.latestRunByAutomationId}
          selectedAutomationId={focusedAutomationId}
          onSelectNew={selectNewAutomation}
          onSelectAutomation={selectSavedAutomation}
        />

        <div className="main-pane" aria-live="polite">
          {focusedAutomation && isEditingFocusedAutomation ? (
            <section className="new-automation-layout" aria-label="Edit saved automation">
              <AutomationBuilderPane
                prompt={workspace.editPrompt}
                setPrompt={workspace.setEditPrompt}
                promptWordCount={workspace.editPromptWordCount}
                canGenerate={workspace.canGenerateEdit}
                isGenerating={workspace.isGeneratingEdit}
                error={workspace.editError}
                onGenerate={() => workspace.generateEditDraft(focusedAutomation.id)}
                eyebrow="Automation Builder"
                title={`Edit ${focusedAutomation.name}`}
                statusLabel="Saved context"
                promptLabel="Edit prompt"
                promptPlaceholder="Describe how AutoM8 should change this saved automation..."
                submitLabel="Generate edited draft"
                headerAction={
                  <button className="secondary-button" type="button" onClick={cancelEditingAutomation}>
                    Cancel
                  </button>
                }
              />

              <div className="preview-pane">
                {workspace.editDraft ? (
                  <DraftPreview
                    draft={workspace.editDraft}
                    isSaving={workspace.isSavingEdit}
                    onSave={saveEditedAutomationAndFocus}
                    saveError={workspace.editSaveError}
                    savedNotice={workspace.editSavedNotice}
                    eyebrow="Edited draft"
                    saveLabel="Save changes"
                  />
                ) : workspace.editClarificationQuestions.length > 0 ? (
                  <ClarificationPanel
                    questions={workspace.editClarificationQuestions}
                    answerText={workspace.editClarificationAnswerText}
                    isGenerating={workspace.isGeneratingEdit}
                    canSubmit={workspace.canSubmitEditClarifications}
                    onAnswerChange={workspace.updateEditClarificationAnswer}
                    onSubmit={() => workspace.submitEditClarificationAnswers(focusedAutomation.id)}
                    description="AutoM8 needs these facts before it can create an edited Draft Automation."
                    submitLabel="Create edited draft"
                  />
                ) : (
                  <EmptyPreview
                    isGenerating={workspace.isGeneratingEdit}
                    idleTitle="No edited draft yet"
                    generatingTitle="Generating edited draft"
                    idleDescription="Submit an edit prompt to preview the updated automation graph."
                    generatingDescription="AutoM8 is applying the edit prompt to the saved automation context."
                  />
                )}
              </div>
            </section>
          ) : focusedAutomation ? (
            <SavedAutomationCandidateDetail
              automation={focusedAutomation}
              latestRun={workspace.latestRunByAutomationId[focusedAutomation.id]}
              runError={workspace.runErrors[focusedAutomation.id]}
              runningAutomationId={workspace.runningAutomationId}
              onRun={workspace.runAutomation}
              onEdit={startEditingAutomation}
              onApproval={workspace.decideApproval}
            />
          ) : (
            <section className="new-automation-layout" aria-label="New automation">
              <AutomationBuilderPane
                prompt={workspace.prompt}
                setPrompt={workspace.setPrompt}
                promptWordCount={workspace.promptWordCount}
                canGenerate={workspace.canGenerate}
                isGenerating={workspace.isGenerating}
                error={workspace.error}
                onGenerate={workspace.generateDraft}
              />

              <div className="preview-pane">
                {workspace.draft ? (
                  <DraftPreview
                    draft={workspace.draft}
                    isSaving={workspace.isSaving}
                    onSave={saveDraftAndFocus}
                    saveError={workspace.saveError}
                    savedNotice={workspace.savedNotice}
                  />
                ) : workspace.clarificationQuestions.length > 0 ? (
                  <ClarificationPanel
                    questions={workspace.clarificationQuestions}
                    answerText={workspace.clarificationAnswerText}
                    isGenerating={workspace.isGenerating}
                    canSubmit={workspace.canSubmitClarifications}
                    onAnswerChange={workspace.updateClarificationAnswer}
                    onSubmit={workspace.submitClarificationAnswers}
                  />
                ) : (
                  <EmptyPreview isGenerating={workspace.isGenerating} />
                )}
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

function getFocusedAutomationIdFromHash(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const automationPrefix = "#automation-";

  if (window.location.hash.startsWith(automationPrefix)) {
    return decodeURIComponent(window.location.hash.slice(automationPrefix.length));
  }

  return null;
}
