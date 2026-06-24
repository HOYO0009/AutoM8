import { useEffect, useState } from "react";

import { AutomationBuilderPane } from "./automationBuilder/AutomationBuilderPane";
import { DraftPreview } from "./automationBuilder/DraftPreview";
import { EmptyPreview } from "./automationBuilder/EmptyPreview";
import { useAutomationWorkspace } from "./automationBuilder/useAutomationWorkspace";
import { SavedAutomationCandidateDetail } from "./automationRunner/SavedAutomationCandidateDetail";
import { SavedAutomationCandidateList } from "./automationRunner/SavedAutomationCandidateList";

export function App() {
  const workspace = useAutomationWorkspace();
  const [focusedAutomationId, setFocusedAutomationId] = useState<string | null>(() => getFocusedAutomationIdFromHash());
  const focusedAutomation =
    workspace.savedAutomationCandidates.find((automation) => automation.id === focusedAutomationId) ?? null;

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

  return (
    <main className="app-shell">
      <section className="app-workspace" aria-label="Automation builder">
        <SavedAutomationCandidateList
          savedAutomationCandidates={workspace.savedAutomationCandidates}
          latestRunByAutomationId={workspace.latestRunByAutomationId}
          selectedAutomationId={focusedAutomationId}
          onSelectNew={() => {
            setFocusedAutomationId(null);
          }}
          onSelectAutomation={setFocusedAutomationId}
        />

        <div className="main-pane" aria-live="polite">
          {focusedAutomation ? (
            <SavedAutomationCandidateDetail
              automation={focusedAutomation}
              latestRun={workspace.latestRunByAutomationId[focusedAutomation.id]}
              runError={workspace.runErrors[focusedAutomation.id]}
              runningAutomationId={workspace.runningAutomationId}
              onRun={workspace.runAutomation}
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
