import { AlertCircle, LoaderCircle, Play } from "lucide-react";

import { AutomationRun, SavedAutomationCandidate } from "../../shared/draftAutomation";
import { NodeGraphViewer } from "../nodeGraphViewer/NodeGraphViewer";
import { AutomationRunResult } from "./AutomationRunResult";

export function SavedAutomationCandidateDetail({
  automation,
  latestRun,
  runError,
  runningAutomationId,
  onRun,
  onApproval
}: {
  automation: SavedAutomationCandidate;
  latestRun?: AutomationRun;
  runError?: string;
  runningAutomationId: string | null;
  onRun: (automationId: string) => void;
  onApproval: (runId: string, approvalId: string, decision: "approve" | "deny") => void;
}) {
  const hasActiveRun = latestRun ? ["queued", "running", "waiting_for_approval"].includes(latestRun.status) : false;
  const isRunning = runningAutomationId === automation.id || hasActiveRun;

  return (
    <article className="saved-automation-detail">
      <header className="saved-detail-header">
        <div className="saved-detail-title-row">
          <div>
            <p className="eyebrow">Saved automation</p>
            <h2>{automation.name}</h2>
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
        <p>{automation.summary}</p>
        {runError ? (
          <div className="error-box" role="alert">
            <AlertCircle aria-hidden="true" size={18} />
            <span>{runError}</span>
          </div>
        ) : null}
      </header>

      <NodeGraphViewer automation={automation} latestRun={latestRun} />
      {latestRun ? <AutomationRunResult run={latestRun} onApproval={onApproval} /> : null}
    </article>
  );
}
