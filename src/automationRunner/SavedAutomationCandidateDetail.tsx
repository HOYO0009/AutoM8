import { AlertCircle, LoaderCircle, Pencil, Play } from "lucide-react";

import { SavedAutomationCandidate } from "../../shared/automationDraft";
import { AutomationRun } from "../../shared/automationRun";
import { NodeGraphViewer } from "../nodeGraphViewer/NodeGraphViewer";
import { AutomationRunResult } from "./AutomationRunResult";

export function SavedAutomationCandidateDetail({
  automation,
  latestRun,
  runError,
  runningAutomationId,
  onRun,
  onEdit,
  onApproval
}: {
  automation: SavedAutomationCandidate;
  latestRun?: AutomationRun;
  runError?: string;
  runningAutomationId: string | null;
  onRun: (automationId: string) => void;
  onEdit?: (automationId: string) => void;
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
            {onEdit ? (
              <button type="button" onClick={() => onEdit(automation.id)} disabled={isRunning || Boolean(runningAutomationId)}>
                <Pencil aria-hidden="true" size={16} />
                Edit
              </button>
            ) : null}
            <button type="button" onClick={() => onRun(automation.id)} disabled={Boolean(runningAutomationId) || hasActiveRun}>
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
