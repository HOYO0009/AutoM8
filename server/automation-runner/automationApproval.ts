import { AutomationApproval, ExecutableAction } from "../../shared/draftAutomation.js";

export function createAutomationApproval({
  id,
  stepIndex,
  title,
  action
}: {
  id: string;
  stepIndex: number;
  title: string;
  action: ExecutableAction;
}): AutomationApproval {
  return {
    id,
    stepIndex,
    title,
    action: action.type === "approval_gate" ? action.action : action.type,
    destination: action.type === "approval_gate" ? action.destination : undefined,
    dataSummary: action.type === "approval_gate" ? action.dataSummary : undefined,
    status: "pending"
  };
}
