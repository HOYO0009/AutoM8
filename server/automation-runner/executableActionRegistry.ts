import { nodeTypes } from "../../shared/automationDraft.js";
import { ExecutableAction, executableActionTypes } from "../../shared/executableAction.js";

export const INVALID_EXECUTABLE_ACTION_PLAN_MESSAGE =
  "The configured executable action planner did not return a runnable AutoM8 action plan.";

export const nonDeterministicDesktopTaskActionTypes = [
  "focus_window",
  "open_url",
  "hotkey",
  "type_text",
  "click",
  "wait",
  "verify_text",
  "approval_gate"
] as const;

export type NonDeterministicDesktopTaskAction = Extract<
  ExecutableAction,
  { type: (typeof nonDeterministicDesktopTaskActionTypes)[number] }
>;

export class ExecutableActionValidationError extends Error {
  constructor(public readonly stage: string) {
    super(INVALID_EXECUTABLE_ACTION_PLAN_MESSAGE);
    this.name = "ExecutableActionValidationError";
  }
}

export const EXECUTABLE_ACTION_PLAN_SCHEMA = {
  name: "ExecutableActionPlan",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      steps: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string", minLength: 1 },
            nodeType: {
              type: "string",
              enum: nodeTypes
            },
            description: { type: "string", minLength: 1 },
            actions: {
              type: "array",
              minItems: 1,
              items: createExecutableActionJsonSchema(executableActionTypes)
            }
          },
          required: ["title", "nodeType", "description", "actions"]
        }
      }
    },
    required: ["steps"]
  }
} as const;

export const NON_DETERMINISTIC_DESKTOP_TASK_ACTION_SCHEMA = {
  name: "NonDeterministicDesktopTaskAction",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      decision: {
        type: "string",
        enum: ["act", "complete", "fail"]
      },
      reason: { type: "string" },
      action: createExecutableActionJsonSchema(nonDeterministicDesktopTaskActionTypes)
    },
    required: ["decision", "reason"]
  }
} as const;

export function createExecutableActionJsonSchema(allowedTypes: readonly ExecutableAction["type"][]) {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      type: {
        type: "string",
        enum: allowedTypes
      },
      app: { type: "string" },
      title: { type: "string" },
      url: { type: "string" },
      keys: { type: "string" },
      text: { type: "string" },
      x: { type: "number" },
      y: { type: "number" },
      ms: { type: "number" },
      goal: { type: "string" },
      maxIterations: { type: "number" },
      timeoutMs: { type: "number" },
      action: { type: "string" },
      destination: { type: "string" },
      dataSummary: { type: "string" }
    },
    required: ["type"]
  } as const;
}

export function validateExecutableAction(value: unknown): ExecutableAction {
  if (!isRecord(value) || typeof value.type !== "string") {
    throw new ExecutableActionValidationError("action-shape");
  }

  switch (value.type) {
    case "launch_app":
      return { type: "launch_app", app: requireString(value.app, "action-app") };
    case "focus_window": {
      const title = optionalString(value.title);
      const app = optionalString(value.app);
      if (!title && !app) {
        throw new ExecutableActionValidationError("action-focus-target");
      }
      return { type: "focus_window", title, app };
    }
    case "open_url":
      return { type: "open_url", url: requireString(value.url, "action-url") };
    case "hotkey":
      return { type: "hotkey", keys: requireString(value.keys, "action-keys") };
    case "type_text":
      return { type: "type_text", text: requireString(value.text, "action-text") };
    case "click":
      return {
        type: "click",
        x: requireNumber(value.x, "action-x"),
        y: requireNumber(value.y, "action-y")
      };
    case "wait":
      return { type: "wait", ms: Math.max(0, Math.min(requireNumber(value.ms, "action-ms"), 30_000)) };
    case "verify_text":
      return { type: "verify_text", text: requireString(value.text, "action-verify-text") };
    case "llm_desktop_task":
      return {
        type: "llm_desktop_task",
        goal: requireString(value.goal, "action-goal"),
        maxIterations: Math.max(1, Math.min(requireNumber(value.maxIterations, "action-max-iterations"), 10)),
        timeoutMs: Math.max(1000, Math.min(requireNumber(value.timeoutMs, "action-timeout"), 300_000))
      };
    case "approval_gate":
      return {
        type: "approval_gate",
        action: requireString(value.action, "action-approval-action"),
        destination: optionalString(value.destination),
        dataSummary: optionalString(value.dataSummary)
      };
    default:
      throw new ExecutableActionValidationError("action-type");
  }
}

export function isNonDeterministicDesktopTaskAction(action: ExecutableAction): action is NonDeterministicDesktopTaskAction {
  return nonDeterministicDesktopTaskActionTypes.includes(action.type as NonDeterministicDesktopTaskAction["type"]);
}

function requireString(value: unknown, stage: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new ExecutableActionValidationError(stage);
  }

  return value.trim();
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function requireNumber(value: unknown, stage: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ExecutableActionValidationError(stage);
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
