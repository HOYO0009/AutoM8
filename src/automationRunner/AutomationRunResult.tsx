import { CheckCircle2, LoaderCircle, XCircle } from "lucide-react";

import { AutomationRun } from "../../shared/draftAutomation";
import { ApprovalControls } from "./ApprovalControls";
import { formatStatus } from "./formatStatus";

export function AutomationRunResult({
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
        <ApprovalControls key={approval.id} runId={run.id} approval={approval} onApproval={onApproval} />
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
