import { AlertCircle, LoaderCircle, Play } from "lucide-react";

import { AutomationRun, SavedAutomationCandidate } from "../../shared/draftAutomation";
import { AutomationRunResult } from "./AutomationRunResult";

export function SavedAutomationCandidateList({
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
