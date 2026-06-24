export const nodeTypes = [
  "deterministic",
  "perception",
  "llm",
  "control",
  "verification"
] as const;

export type DraftNodeType = (typeof nodeTypes)[number];

export interface DraftAutomationStep {
  title: string;
  nodeType: DraftNodeType;
  description: string;
}

export interface DraftAutomation {
  name: string;
  summary: string;
  steps: DraftAutomationStep[];
}

export interface SavedAutomation extends DraftAutomation {
  id: string;
  createdAt: string;
}

export type ExecutableAction =
  | {
      type: "launch_app";
      app: string;
    }
  | {
      type: "focus_window";
      title?: string;
      app?: string;
    }
  | {
      type: "open_url";
      url: string;
    }
  | {
      type: "hotkey";
      keys: string;
    }
  | {
      type: "type_text";
      text: string;
    }
  | {
      type: "click";
      x: number;
      y: number;
    }
  | {
      type: "wait";
      ms: number;
    }
  | {
      type: "verify_text";
      text: string;
    }
  | {
      type: "llm_desktop_task";
      goal: string;
      maxIterations: number;
      timeoutMs: number;
    }
  | {
      type: "approval_gate";
      action: string;
      destination?: string;
      dataSummary?: string;
    };

export interface ExecutableAutomationStep extends DraftAutomationStep {
  actions: ExecutableAction[];
}

export interface ExecutableAutomationPlan {
  automationId: string;
  steps: ExecutableAutomationStep[];
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

export interface DraftAutomationResponse {
  draft: DraftAutomation;
}

export interface SavedAutomationsResponse {
  savedAutomations: SavedAutomation[];
}

export interface SaveDraftAutomationResponse extends SavedAutomationsResponse {
  savedAutomation: SavedAutomation;
}

export interface RunAutomationResponse {
  runId: string;
  run: AutomationRun;
}

export interface AutomationRunsResponse {
  runs: AutomationRun[];
}

export interface AutomationRunResponse {
  run: AutomationRun;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
