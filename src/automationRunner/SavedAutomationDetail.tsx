import { AlertCircle, LoaderCircle, Pencil, Play, Trash2 } from "lucide-react";

import { SavedAutomation } from "../../shared/automationDraft";
import { AutomationRun } from "../../shared/automationRun";
import { NodeGraphViewer } from "../nodeGraphViewer/NodeGraphViewer";
import { AutomationRunResult } from "./AutomationRunResult";

export function SavedAutomationDetail({
  automation,
  latestRun,
  runError,
  deleteError,
  runningAutomationId,
  deletingAutomationId,
  onRun,
  onEdit,
  onDelete,
  onApproval
}: {
  automation: SavedAutomation;
  latestRun?: AutomationRun;
  runError?: string;
  deleteError?: string | null;
  runningAutomationId: string | null;
  deletingAutomationId?: string | null;
  onRun: (automationId: string) => void;
  onEdit?: (automationId: string) => void;
  onDelete?: (automationId: string) => void;
  onApproval: (runId: string, approvalId: string, decision: "approve" | "deny") => void;
}) {
  const hasActiveRun = latestRun ? ["queued", "running", "waiting_for_approval"].includes(latestRun.status) : false;
  const isRunning = runningAutomationId === automation.id || hasActiveRun;
  const isDeleting = deletingAutomationId === automation.id;

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
            {onDelete ? (
              <button
                className="danger-button"
                type="button"
                onClick={() => onDelete(automation.id)}
                disabled={isRunning || Boolean(runningAutomationId) || isDeleting}
              >
                {isDeleting ? (
                  <LoaderCircle aria-hidden="true" className="spin" size={16} />
                ) : (
                  <Trash2 aria-hidden="true" size={16} />
                )}
                Delete
              </button>
            ) : null}
          </div>
        </div>
        <p>{automation.summary}</p>
        {runError ? (
          <div className="error-box" role="alert">
            <AlertCircle aria-hidden="true" size={18} />
            <span>{runError}</span>
          </div>
        ) : null}
        {deleteError ? (
          <div className="error-box" role="alert">
            <AlertCircle aria-hidden="true" size={18} />
            <span>{deleteError}</span>
          </div>
        ) : null}
      </header>

      <NodeGraphViewer automation={automation} latestRun={latestRun} />
      {latestRun ? <AutomationRunResult run={latestRun} onApproval={onApproval} /> : null}
    </article>
  );
}
