import { ShieldCheck } from "lucide-react";

import { AutomationApproval } from "../../shared/draftAutomation";

export function ApprovalControls({
  runId,
  approval,
  onApproval
}: {
  runId: string;
  approval: AutomationApproval;
  onApproval: (runId: string, approvalId: string, decision: "approve" | "deny") => void;
}) {
  return (
    <div className="approval-box">
      <ShieldCheck aria-hidden="true" size={18} />
      <div>
        <strong>Approve {approval.action}</strong>
        <p>
          {approval.destination ? `${approval.destination}: ` : ""}
          {approval.dataSummary ?? "AutoM8 needs approval before this side-effect action."}
        </p>
        <div className="approval-actions">
          <button type="button" onClick={() => onApproval(runId, approval.id, "approve")}>
            Approve
          </button>
          <button type="button" className="secondary" onClick={() => onApproval(runId, approval.id, "deny")}>
            Deny
          </button>
        </div>
      </div>
    </div>
  );
}
