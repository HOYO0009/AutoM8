import { AlertCircle, CheckCircle2, LoaderCircle, Play, Save, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  ApiErrorResponse,
  AutomationRun,
  AutomationRunResponse,
  DraftAutomation,
  DraftAutomationResponse,
  RunAutomationResponse,
  SavedAutomationCandidate,
  SavedAutomationCandidatesResponse,
  SaveDraftAutomationCandidateResponse
} from "../shared/draftAutomation";

const examplePrompt =
  "Every morning, open the sales spreadsheet, collect yesterday's total revenue, and draft a short email summary for the team.";

export function App() {
  const [prompt, setPrompt] = useState(examplePrompt);
  const [draft, setDraft] = useState<DraftAutomation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [savedAutomationCandidates, setSavedAutomationCandidates] = useState<SavedAutomationCandidate[]>([]);
  const [automationRuns, setAutomationRuns] = useState<AutomationRun[]>([]);
  const [runErrors, setRunErrors] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [runningAutomationId, setRunningAutomationId] = useState<string | null>(null);
  const hasActiveRun = automationRuns.some((run) =>
    ["queued", "running", "waiting_for_approval"].includes(run.status)
  );

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

    async function loadSavedAutomationCandidates() {
      try {
        const response = await fetch("/api/saved-automations");
        const payload = (await response.json()) as SavedAutomationCandidatesResponse | ApiErrorResponse;

        if (isMounted && response.ok && !("error" in payload)) {
          setSavedAutomationCandidates(payload.savedAutomationCandidates);
        }
      } catch {
        // Saved automations are still available after the next successful save.
      }
    }

    void loadSavedAutomationCandidates();
    void loadAutomationRuns();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasActiveRun) {
      return;
    }

    const interval = window.setInterval(() => {
      void loadAutomationRuns();
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [hasActiveRun]);

  async function loadAutomationRuns() {
    try {
      const response = await fetch("/api/automation-runs");
      const payload = (await response.json()) as { runs: AutomationRun[] } | ApiErrorResponse;

      if (response.ok && !("error" in payload)) {
        setAutomationRuns(payload.runs);
      }
    } catch {
      // The next run action will refresh run state.
    }
  }

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

      const payload = (await response.json()) as SaveDraftAutomationCandidateResponse | ApiErrorResponse;

      if (!response.ok || "error" in payload) {
        setSaveError("error" in payload ? payload.error.message : "AutoM8 could not save the draft.");
        return;
      }

      setSavedAutomationCandidates(payload.savedAutomationCandidates);
      setSavedNotice(`Saved "${payload.savedAutomationCandidate.name}".`);
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

      setAutomationRuns((currentRuns) => upsertRun(currentRuns, payload.run));
    } catch {
      setRunErrors((currentErrors) => ({
        ...currentErrors,
        [automationId]: "AutoM8 could not reach the local automation runner."
      }));
    } finally {
      setRunningAutomationId(null);
    }
  }

  async function handleApproval(runId: string, approvalId: string, decision: "approve" | "deny") {
    try {
      const response = await fetch(`/api/automation-runs/${runId}/approvals/${approvalId}/${decision}`, {
        method: "POST"
      });
      const payload = (await response.json()) as AutomationRunResponse | ApiErrorResponse;

      if (response.ok && !("error" in payload)) {
        setAutomationRuns((currentRuns) => upsertRun(currentRuns, payload.run));
      }
    } catch {
      // Polling or a later user action can recover the latest run state.
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
          <SavedAutomationCandidateList
            savedAutomationCandidates={savedAutomationCandidates}
            latestRunByAutomationId={latestRunByAutomationId}
            onRun={handleRunAutomation}
            onApproval={handleApproval}
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

function SavedAutomationCandidateList({
  savedAutomationCandidates,
  latestRunByAutomationId,
  onRun,
  onApproval,
  runErrors,
  runningAutomationId
}: {
  savedAutomationCandidates: SavedAutomationCandidate[];
  latestRunByAutomationId: Record<string, AutomationRun>;
  onRun: (automationId: string) => void;
  onApproval: (runId: string, approvalId: string, decision: "approve" | "deny") => void;
  runErrors: Record<string, string>;
  runningAutomationId: string | null;
}) {
  if (savedAutomationCandidates.length === 0) {
    return null;
  }

  return (
    <section className="saved-automations" aria-label="Saved automations">
      <div>
        <p className="eyebrow">Saved automations</p>
        <h2>Automation candidates</h2>
      </div>
      <ol className="saved-list">
        {savedAutomationCandidates.map((automation) => {
          const latestRun = latestRunByAutomationId[automation.id];
          const runError = runErrors[automation.id];
          const isActive = latestRun ? ["queued", "running", "waiting_for_approval"].includes(latestRun.status) : false;
          const isRunning = runningAutomationId === automation.id || isActive;

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
              {latestRun ? <AutomationRunResult run={latestRun} onApproval={onApproval} /> : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function AutomationRunResult({
  run,
  onApproval
}: {
  run: AutomationRun;
  onApproval: (runId: string, approvalId: string, decision: "approve" | "deny") => void;
}) {
  const pendingApprovals = run.approvals.filter((approval) => approval.status === "pending");

  return (
    <div className="run-result">
      <div className="run-result-header">
        <div>
          <p className="eyebrow">Latest run</p>
          <h3>{formatStatus(run.status)}</h3>
        </div>
        <span>{new Date(run.completedAt ?? run.startedAt).toLocaleTimeString()}</span>
      </div>
      {pendingApprovals.map((approval) => (
        <div key={approval.id} className="approval-box">
          <ShieldCheck aria-hidden="true" size={18} />
          <div>
            <strong>Approve {approval.action}</strong>
            <p>
              {approval.destination ? `${approval.destination}: ` : ""}
              {approval.dataSummary ?? "AutoM8 needs approval before this side-effect action."}
            </p>
            <div className="approval-actions">
              <button type="button" onClick={() => onApproval(run.id, approval.id, "approve")}>
                Approve
              </button>
              <button type="button" className="secondary" onClick={() => onApproval(run.id, approval.id, "deny")}>
                Deny
              </button>
            </div>
          </div>
        </div>
      ))}
      <ol className="run-step-list">
        {run.steps.map((step, index) => (
          <li key={`${run.id}-${step.title}-${index}`}>
            {step.status === "failed" ? (
              <XCircle aria-hidden="true" size={16} />
            ) : step.status === "running" || step.status === "waiting_for_approval" || step.status === "pending" ? (
              <LoaderCircle aria-hidden="true" className="spin" size={16} />
            ) : (
              <CheckCircle2 aria-hidden="true" size={16} />
            )}
            <div>
              <div className="run-step-title">
                <strong>{step.title}</strong>
                <span>{step.actionType ?? step.nodeType}</span>
              </div>
              <p>{step.message}</p>
              {step.logs.length > 0 ? (
                <ul className="run-log-list">
                  {step.logs.slice(-3).map((log) => (
                    <li key={`${log.at}-${log.message}`}>{log.message}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function upsertRun(currentRuns: AutomationRun[], run: AutomationRun): AutomationRun[] {
  const withoutRun = currentRuns.filter((currentRun) => currentRun.id !== run.id);
  return [run, ...withoutRun];
}

function formatStatus(status: AutomationRun["status"]): string {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
