import { DraftNodeType } from "./automationDraft.js";
import { ExecutableAction } from "./executableAction.js";

export interface ExecutableActionPlanStep {
  title: string;
  nodeType: DraftNodeType;
  description: string;
  actions: ExecutableAction[];
}

export interface ExecutableActionPlan {
  automationId: string;
  steps: ExecutableActionPlanStep[];
}

export type AutomationRunStatus =
  | "queued"
  | "running"
  | "waiting_for_approval"
  | "completed"
  | "failed"
  | "cancelled";
export type AutomationStepRunStatus =
  | "pending"
  | "running"
  | "waiting_for_approval"
  | "completed"
  | "failed"
  | "skipped";
export type AutomationApprovalStatus = "pending" | "approved" | "denied";

export interface AutomationRunLog {
  at: string;
  message: string;
}

export interface AutomationApproval {
  id: string;
  stepIndex: number;
  title: string;
  action: string;
  destination?: string;
  dataSummary?: string;
  status: AutomationApprovalStatus;
  resolvedAt?: string;
}

export interface AutomationStepRun {
  title: string;
  nodeType: DraftNodeType;
  status: AutomationStepRunStatus;
  message: string;
  actionType?: ExecutableAction["type"];
  logs: AutomationRunLog[];
}

export interface AutomationRun {
  id: string;
  automationId: string;
  status: AutomationRunStatus;
  startedAt: string;
  completedAt?: string;
  steps: AutomationStepRun[];
  approvals: AutomationApproval[];
  logs: AutomationRunLog[];
}
