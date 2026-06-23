import { AlertCircle, CheckCircle2, LoaderCircle, Play, Save, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  ApiErrorResponse,
  AutomationRun,
  DraftAutomation,
  DraftAutomationResponse,
  RunAutomationResponse,
  SavedAutomation,
  SavedAutomationsResponse,
  SaveDraftAutomationResponse
} from "../shared/draftAutomation";

const examplePrompt =
  "Every morning, open the sales spreadsheet, collect yesterday's total revenue, and draft a short email summary for the team.";

export function App() {
  const [prompt, setPrompt] = useState(examplePrompt);
  const [draft, setDraft] = useState<DraftAutomation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [savedAutomations, setSavedAutomations] = useState<SavedAutomation[]>([]);
  const [automationRuns, setAutomationRuns] = useState<AutomationRun[]>([]);
  const [runErrors, setRunErrors] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [runningAutomationId, setRunningAutomationId] = useState<string | null>(null);

  const trimmedPrompt = prompt.trim();
  const canGenerate = trimmedPrompt.length > 0 && !isGenerating;
  const promptWordCount = useMemo(() => {
    return trimmedPrompt ? trimmedPrompt.split(/\s+/).length : 0;
  }, [trimmedPrompt]);
  const latestRunByAutomationId = useMemo(() => {
    const latestRuns: Record<string, AutomationRun> = {};

    for (const run of automationRuns) {
      if (!latestRuns[run.automationId]) {
        latestRuns[run.automationId] = run;
      }
    }

    return latestRuns;
  }, [automationRuns]);

  useEffect(() => {
    let isMounted = true;

    async function loadSavedAutomations() {
      try {
        const response = await fetch("/api/saved-automations");
        const payload = (await response.json()) as SavedAutomationsResponse | ApiErrorResponse;

        if (isMounted && response.ok && !("error" in payload)) {
          setSavedAutomations(payload.savedAutomations);
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canGenerate) {
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSaveError(null);
    setSavedNotice(null);

    try {
      const response = await fetch("/api/draft-automation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt: trimmedPrompt })
      });

      const payload = (await response.json()) as DraftAutomationResponse | ApiErrorResponse;

      if (!response.ok || "error" in payload) {
        setDraft(null);
        setError("error" in payload ? payload.error.message : "AutoM8 could not create a draft.");
        return;
      }

      setDraft(payload.draft);
    } catch {
      setDraft(null);
      setError("AutoM8 could not reach the local draft API.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSaveDraft() {
    if (!draft || isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSavedNotice(null);

    try {
      const response = await fetch("/api/saved-automations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ draft })
      });

      const payload = (await response.json()) as SaveDraftAutomationResponse | ApiErrorResponse;

      if (!response.ok || "error" in payload) {
        setSaveError("error" in payload ? payload.error.message : "AutoM8 could not save the draft.");
        return;
      }

      setSavedAutomations(payload.savedAutomations);
      setSavedNotice(`Saved "${payload.savedAutomation.name}".`);
    } catch {
      setSaveError("AutoM8 could not reach the local saved automation API.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRunAutomation(automationId: string) {
    if (runningAutomationId) {
      return;
    }

    setRunningAutomationId(automationId);
    setRunErrors((currentErrors) => {
      const { [automationId]: _clearedError, ...remainingErrors } = currentErrors;
      return remainingErrors;
    });

    try {
      const response = await fetch(`/api/saved-automations/${automationId}/run`, {
        method: "POST"
      });
      const payload = (await response.json()) as RunAutomationResponse | ApiErrorResponse;

      if (!response.ok || "error" in payload) {
        setRunErrors((currentErrors) => ({
          ...currentErrors,
          [automationId]: "error" in payload ? payload.error.message : "AutoM8 could not run the automation."
        }));
        return;
      }

      setAutomationRuns(payload.runs);
    } catch {
      setRunErrors((currentErrors) => ({
        ...currentErrors,
        [automationId]: "AutoM8 could not reach the local automation runner."
      }));
    } finally {
      setRunningAutomationId(null);
    }
  }

  return (
    <main className="app-shell">
      <section className="workspace" aria-label="Automation builder">
        <div className="builder-pane">
          <header className="pane-header">
            <div>
              <p className="eyebrow">Automation Builder</p>
              <h1>Draft an automation from a prompt</h1>
            </div>
            <span className="status-pill">In-memory draft</span>
          </header>

          <form className="prompt-form" onSubmit={handleSubmit}>
            <label htmlFor="workflow-prompt">Workflow prompt</label>
            <textarea
              id="workflow-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe the desktop workflow AutoM8 should draft..."
              rows={10}
            />
            <div className="form-footer">
              <span>{promptWordCount} words</span>
              <button type="submit" disabled={!canGenerate}>
                {isGenerating ? (
                  <LoaderCircle aria-hidden="true" className="spin" size={18} />
                ) : (
                  <Sparkles aria-hidden="true" size={18} />
                )}
                Generate draft
              </button>
            </div>
          </form>

          {error ? (
            <div className="error-box" role="alert">
              <AlertCircle aria-hidden="true" size={18} />
              <span>{error}</span>
            </div>
          ) : null}
        </div>

        <div className="preview-pane" aria-live="polite">
          {draft ? (
            <DraftPreview
              draft={draft}
              isSaving={isSaving}
              onSave={handleSaveDraft}
              saveError={saveError}
              savedNotice={savedNotice}
            />
          ) : (
            <EmptyPreview isGenerating={isGenerating} />
          )}
          <SavedAutomationList
            savedAutomations={savedAutomations}
            latestRunByAutomationId={latestRunByAutomationId}
            onRun={handleRunAutomation}
            runErrors={runErrors}
            runningAutomationId={runningAutomationId}
          />
        </div>
      </section>
    </main>
  );
}

function DraftPreview({
  draft,
  isSaving,
  onSave,
  saveError,
  savedNotice
}: {
  draft: DraftAutomation;
  isSaving: boolean;
  onSave: () => void;
  saveError: string | null;
  savedNotice: string | null;
}) {
  return (
    <article className="draft-preview">
      <header className="draft-header">
        <div className="draft-title-row">
          <div>
            <p className="eyebrow">Draft automation</p>
            <h2>{draft.name}</h2>
          </div>
          <button className="save-draft-button" type="button" onClick={onSave} disabled={isSaving}>
            {isSaving ? (
              <LoaderCircle aria-hidden="true" className="spin" size={18} />
            ) : (
              <Save aria-hidden="true" size={18} />
            )}
            Save draft
          </button>
        </div>
        <p>{draft.summary}</p>
        {savedNotice ? (
          <div className="notice-box" role="status">
            <CheckCircle2 aria-hidden="true" size={18} />
            <span>{savedNotice}</span>
          </div>
        ) : null}
        {saveError ? (
          <div className="error-box" role="alert">
            <AlertCircle aria-hidden="true" size={18} />
            <span>{saveError}</span>
          </div>
        ) : null}
      </header>

      <ol className="step-list">
        {draft.steps.map((step, index) => (
          <li key={`${step.title}-${index}`} className="step-item">
            <div className="step-index">{index + 1}</div>
            <div>
              <div className="step-title-row">
                <h3>{step.title}</h3>
                <span>{step.nodeType}</span>
              </div>
              <p>{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}

function SavedAutomationList({
  savedAutomations,
  latestRunByAutomationId,
  onRun,
  runErrors,
  runningAutomationId
}: {
  savedAutomations: SavedAutomation[];
  latestRunByAutomationId: Record<string, AutomationRun>;
  onRun: (automationId: string) => void;
  runErrors: Record<string, string>;
  runningAutomationId: string | null;
}) {
  if (savedAutomations.length === 0) {
    return null;
  }

  return (
    <section className="saved-automations" aria-label="Saved automations">
      <div>
        <p className="eyebrow">Saved automations</p>
        <h2>Automation candidates</h2>
      </div>
      <ol className="saved-list">
        {savedAutomations.map((automation) => {
          const latestRun = latestRunByAutomationId[automation.id];
          const runError = runErrors[automation.id];
          const isRunning = runningAutomationId === automation.id;

          return (
            <li key={automation.id} className="saved-item">
              <div className="saved-item-header">
                <div>
                  <h3>{automation.name}</h3>
                  <p>{automation.summary}</p>
                </div>
                <div className="saved-actions">
                  <span>
                    {automation.steps.length} {automation.steps.length === 1 ? "step" : "steps"}
                  </span>
                  <button type="button" onClick={() => onRun(automation.id)} disabled={Boolean(runningAutomationId)}>
                    {isRunning ? (
                      <LoaderCircle aria-hidden="true" className="spin" size={16} />
                    ) : (
                      <Play aria-hidden="true" size={16} />
                    )}
                    Run
                  </button>
                </div>
              </div>
              {runError ? (
                <div className="error-box" role="alert">
                  <AlertCircle aria-hidden="true" size={18} />
                  <span>{runError}</span>
                </div>
              ) : null}
              {latestRun ? <AutomationRunResult run={latestRun} /> : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function AutomationRunResult({ run }: { run: AutomationRun }) {
  return (
    <div className="run-result">
      <div className="run-result-header">
        <div>
          <p className="eyebrow">Latest run</p>
          <h3>{run.status === "completed" ? "Completed" : "Failed"}</h3>
        </div>
        <span>{new Date(run.completedAt).toLocaleTimeString()}</span>
      </div>
      <ol className="run-step-list">
        {run.steps.map((step, index) => (
          <li key={`${run.id}-${step.title}-${index}`}>
            <CheckCircle2 aria-hidden="true" size={16} />
            <div>
              <div className="run-step-title">
                <strong>{step.title}</strong>
                <span>{step.nodeType}</span>
              </div>
              <p>{step.message}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function EmptyPreview({ isGenerating }: { isGenerating: boolean }) {
  return (
    <div className="empty-preview">
      <div className="empty-icon">
        {isGenerating ? (
          <LoaderCircle aria-hidden="true" className="spin" size={28} />
        ) : (
          <Sparkles aria-hidden="true" size={28} />
        )}
      </div>
      <h2>{isGenerating ? "Generating draft" : "No draft yet"}</h2>
      <p>
        {isGenerating
          ? "AutoM8 is asking the configured OpenRouter model to turn the prompt into ordered automation steps."
          : "Submit a workflow prompt to create a draft automation preview."}
      </p>
    </div>
  );
}
