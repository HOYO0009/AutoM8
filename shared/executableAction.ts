export const executableActionTypes = [
  "launch_app",
  "focus_window",
  "open_url",
  "hotkey",
  "type_text",
  "click",
  "wait",
  "verify_text",
  "llm_desktop_task",
  "approval_gate"
] as const;

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
