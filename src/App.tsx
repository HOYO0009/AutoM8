import { AutomationBuilderPane } from "./automationBuilder/AutomationBuilderPane";
import { DraftPreview } from "./automationBuilder/DraftPreview";
import { EmptyPreview } from "./automationBuilder/EmptyPreview";
import { useAutomationWorkspace } from "./automationBuilder/useAutomationWorkspace";
import { SavedAutomationCandidateList } from "./automationRunner/SavedAutomationCandidateList";

export function App() {
  const workspace = useAutomationWorkspace();

  return (
    <main className="app-shell">
      <section className="workspace" aria-label="Automation builder">
        <AutomationBuilderPane
          prompt={workspace.prompt}
          setPrompt={workspace.setPrompt}
          promptWordCount={workspace.promptWordCount}
          canGenerate={workspace.canGenerate}
          isGenerating={workspace.isGenerating}
          error={workspace.error}
          onGenerate={workspace.generateDraft}
        />

        <div className="preview-pane" aria-live="polite">
          {workspace.draft ? (
            <DraftPreview
              draft={workspace.draft}
              isSaving={workspace.isSaving}
              onSave={workspace.saveDraft}
              saveError={workspace.saveError}
              savedNotice={workspace.savedNotice}
            />
          ) : (
            <EmptyPreview isGenerating={workspace.isGenerating} />
          )}
          <SavedAutomationCandidateList
            savedAutomationCandidates={workspace.savedAutomationCandidates}
            latestRunByAutomationId={workspace.latestRunByAutomationId}
            onRun={workspace.runAutomation}
            onApproval={workspace.decideApproval}
            runErrors={workspace.runErrors}
            runningAutomationId={workspace.runningAutomationId}
          />
        </div>
      </section>
    </main>
  );
}
