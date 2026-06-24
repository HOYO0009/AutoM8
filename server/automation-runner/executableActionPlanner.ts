import {
  DraftAutomation,
  DraftNodeType,
  ExecutableAction,
  ExecutableActionPlan,
  ExecutableActionPlanStep,
  SavedAutomationCandidate
} from "../../shared/draftAutomation.js";
import { requestOpenRouterStructuredOutput } from "../llm/openRouterStructuredOutput.js";

const ACTION_PLAN_REQUEST_TIMEOUT_MS = 30_000;
const EXECUTABLE_ACTION_PLAN_SCHEMA = {
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
              enum: ["deterministic", "perception", "llm", "control", "verification"]
            },
            description: { type: "string", minLength: 1 },
            actions: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  type: {
                    type: "string",
                    enum: [
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
                    ]
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
              }
            }
          },
          required: ["title", "nodeType", "description", "actions"]
        }
      }
    },
    required: ["steps"]
  }
} as const;

export interface ExecutableActionPlannerConfig {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export interface ExecutableActionPlanner {
  createPlan(automation: SavedAutomationCandidate): Promise<ExecutableActionPlan>;
}

export class ExecutableActionPlanningError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400
  ) {
    super(message);
    this.name = "ExecutableActionPlanningError";
  }
}

export function createExecutableActionPlanner(config: ExecutableActionPlannerConfig = {}): ExecutableActionPlanner {
  return {
    async createPlan(automation) {
      const localPlan = createHeuristicExecutableActionPlan(automation);
      const needsModelPlanning = localPlan.steps.some((step) =>
        step.actions.some((action) => action.type === "llm_desktop_task")
      );

      if (!needsModelPlanning) {
        return localPlan;
      }

      if (config.apiKey && config.model) {
        try {
          return await createModelExecutableActionPlan(automation, {
            ...config,
            apiKey: config.apiKey,
            model: config.model
          });
        } catch (error) {
          console.warn("AutoM8 executable action planner fell back to the local heuristic planner.", {
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      return localPlan;
    }
  };
}

export function createHeuristicExecutableActionPlan(automation: SavedAutomationCandidate): ExecutableActionPlan {
  return {
    automationId: automation.id,
    steps: automation.steps.map((step) => ({
      ...step,
      actions: inferActions(step, automation)
    }))
  };
}

export function actionRequiresApproval(action: ExecutableAction): boolean {
  if (action.type === "approval_gate") {
    return true;
  }

  const text = actionText(action);
  return riskyPattern.test(text);
}

function inferActions(
  step: DraftAutomation["steps"][number],
  automation: SavedAutomationCandidate
): ExecutableAction[] {
  const text = `${step.title} ${step.description}`.toLowerCase();
  const actions: ExecutableAction[] = [];

  if (riskyPattern.test(text)) {
    actions.push({
      type: "approval_gate",
      action: step.title,
      destination: inferDestination(text),
      dataSummary: step.description
    });
  }

  if (/\bnotepad\b/.test(text)) {
    actions.push({ type: "launch_app", app: "notepad" });

    const typedText = inferTypedText(step.description);
    if (typedText) {
      actions.push({ type: "wait", ms: 500 });
      actions.push({ type: "type_text", text: typedText });
    }

    return actions;
  }

  const url = inferUrl(step.description);
  if (url) {
    actions.push({ type: "open_url", url });
    return actions;
  }

  if (step.nodeType === "deterministic" && /\b(wait|pause)\b/.test(text)) {
    actions.push({ type: "wait", ms: 1000 });
    return actions;
  }

  actions.push({
    type: "llm_desktop_task",
    goal: `${automation.name}: ${step.title}. ${step.description}`,
    maxIterations: 5,
    timeoutMs: 60_000
  });

  return actions;
}

async function createModelExecutableActionPlan(
  automation: SavedAutomationCandidate,
  config: Required<Pick<ExecutableActionPlannerConfig, "apiKey" | "model">> & ExecutableActionPlannerConfig
): Promise<ExecutableActionPlan> {
  const result = await requestOpenRouterStructuredOutput({
    apiKey: config.apiKey,
    model: config.model,
    baseUrl: config.baseUrl,
    fetchImpl: config.fetchImpl,
    schema: EXECUTABLE_ACTION_PLAN_SCHEMA,
    messages: [
      {
        role: "system",
        content:
          "Convert saved AutoM8 desktop automation steps into a safe executable action plan. Use deterministic DSL actions when concrete. Use llm_desktop_task for ambiguous perception or UI navigation. Insert approval_gate before any external side effect such as sending email, creating calendar events, submitting forms, deleting data, uploading files, purchases, or permission changes. Never emit shell commands."
      },
      {
        role: "user",
        content: JSON.stringify({
          id: automation.id,
          name: automation.name,
          summary: automation.summary,
          steps: automation.steps
        })
      }
    ],
    temperature: 0.1,
    timeoutMs: ACTION_PLAN_REQUEST_TIMEOUT_MS,
    providerErrorFallback: "The configured executable action planner rejected the request."
  });

  if (!result.ok) {
    if (result.kind === "provider") {
      throw new ExecutableActionPlanningError("ACTION_PLANNER_REQUEST_FAILED", result.message, 502);
    }

    if (result.kind === "timeout") {
      throw new ExecutableActionPlanningError(
        "ACTION_PLANNER_REQUEST_TIMEOUT",
        "The configured executable action planner took too long to respond.",
        504
      );
    }

    if (result.kind === "invalid_json") {
      throw invalidActionPlanError(config.model, result.stage ?? "assistant-json", result.providerStatus ?? 200);
    }

    throw new ExecutableActionPlanningError(
      "ACTION_PLANNER_REQUEST_FAILED",
      "AutoM8 could not reach the configured executable action planner.",
      502
    );
  }

  return validateExecutableActionPlan(automation, result.parsedJson, config.model, result.providerStatus);
}

export function validateExecutableActionPlan(
  automation: SavedAutomationCandidate,
  value: unknown,
  model = "local",
  providerStatus = 200
): ExecutableActionPlan {
  if (!isRecord(value) || !Array.isArray(value.steps) || value.steps.length === 0) {
    throw invalidActionPlanError(model, "plan-shape", providerStatus);
  }

  return {
    automationId: automation.id,
    steps: value.steps.map((step) => validateExecutableActionPlanStep(step, model, providerStatus))
  };
}

function validateExecutableActionPlanStep(
  value: unknown,
  model: string,
  providerStatus: number
): ExecutableActionPlanStep {
  if (!isRecord(value)) {
    throw invalidActionPlanError(model, "step-shape", providerStatus);
  }

  const { title, nodeType, description, actions } = value;
  if (typeof title !== "string" || !title.trim()) {
    throw invalidActionPlanError(model, "step-title", providerStatus);
  }
  if (!isNodeType(nodeType)) {
    throw invalidActionPlanError(model, "step-node-type", providerStatus);
  }
  if (typeof description !== "string" || !description.trim()) {
    throw invalidActionPlanError(model, "step-description", providerStatus);
  }
  if (!Array.isArray(actions) || actions.length === 0) {
    throw invalidActionPlanError(model, "step-actions", providerStatus);
  }

  return {
    title: title.trim(),
    nodeType,
    description: description.trim(),
    actions: actions.map((action) => validateAction(action, model, providerStatus))
  };
}

export function validateAction(
  value: unknown,
  model = "local",
  providerStatus = 200
): ExecutableAction {
  if (!isRecord(value) || typeof value.type !== "string") {
    throw invalidActionPlanError(model, "action-shape", providerStatus);
  }

  switch (value.type) {
    case "launch_app":
      return { type: "launch_app", app: requireString(value.app, "action-app", model, providerStatus) };
    case "focus_window": {
      const title = optionalString(value.title);
      const app = optionalString(value.app);
      if (!title && !app) {
        throw invalidActionPlanError(model, "action-focus-target", providerStatus);
      }
      return { type: "focus_window", title, app };
    }
    case "open_url":
      return { type: "open_url", url: requireString(value.url, "action-url", model, providerStatus) };
    case "hotkey":
      return { type: "hotkey", keys: requireString(value.keys, "action-keys", model, providerStatus) };
    case "type_text":
      return { type: "type_text", text: requireString(value.text, "action-text", model, providerStatus) };
    case "click":
      return {
        type: "click",
        x: requireNumber(value.x, "action-x", model, providerStatus),
        y: requireNumber(value.y, "action-y", model, providerStatus)
      };
    case "wait":
      return { type: "wait", ms: Math.max(0, Math.min(requireNumber(value.ms, "action-ms", model, providerStatus), 30_000)) };
    case "verify_text":
      return { type: "verify_text", text: requireString(value.text, "action-verify-text", model, providerStatus) };
    case "llm_desktop_task":
      return {
        type: "llm_desktop_task",
        goal: requireString(value.goal, "action-goal", model, providerStatus),
        maxIterations: Math.max(
          1,
          Math.min(requireNumber(value.maxIterations, "action-max-iterations", model, providerStatus), 10)
        ),
        timeoutMs: Math.max(
          1000,
          Math.min(requireNumber(value.timeoutMs, "action-timeout", model, providerStatus), 300_000)
        )
      };
    case "approval_gate":
      return {
        type: "approval_gate",
        action: requireString(value.action, "action-approval-action", model, providerStatus),
        destination: optionalString(value.destination),
        dataSummary: optionalString(value.dataSummary)
      };
    default:
      throw invalidActionPlanError(model, "action-type", providerStatus);
  }
}

function inferTypedText(description: string): string | null {
  const quoted = description.match(/["']([^"']+)["']/);
  if (quoted?.[1]) {
    return quoted[1];
  }

  const typeMatch = description.match(/\btype\s+(.+)$/i);
  return typeMatch?.[1]?.trim() ?? null;
}

function inferUrl(description: string): string | null {
  return description.match(/https?:\/\/\S+/i)?.[0] ?? null;
}

function inferDestination(text: string): string | undefined {
  if (/\b(email|mail|gmail|outlook)\b/.test(text)) return "email";
  if (/\b(calendar|meeting|appointment|event)\b/.test(text)) return "calendar";
  if (/\b(upload|file)\b/.test(text)) return "file upload";
  if (/\b(delete|remove|cancel)\b/.test(text)) return "data deletion";
  if (/\bsubmit|form\b/.test(text)) return "form submission";
  return undefined;
}

function actionText(action: ExecutableAction): string {
  return Object.values(action)
    .filter((value) => typeof value === "string")
    .join(" ")
    .toLowerCase();
}

const riskyPattern =
  /\b(send|email|mail|schedule|calendar|appointment|meeting|event|submit|delete|remove|cancel|upload|purchase|buy|pay|permission|share|post)\b/i;

function invalidActionPlanError(
  model: string,
  stage: string,
  providerStatus: number
): ExecutableActionPlanningError {
  console.warn("AutoM8 executable action planner returned an invalid response.", {
    model,
    stage,
    providerStatus
  });

  return new ExecutableActionPlanningError(
    "INVALID_EXECUTABLE_ACTION_PLAN",
    "The configured executable action planner did not return a runnable AutoM8 action plan.",
    502
  );
}

function requireString(
  value: unknown,
  stage: string,
  model: string,
  providerStatus: number
): string {
  if (typeof value !== "string" || !value.trim()) {
    throw invalidActionPlanError(model, stage, providerStatus);
  }

  return value.trim();
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function requireNumber(
  value: unknown,
  stage: string,
  model: string,
  providerStatus: number
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw invalidActionPlanError(model, stage, providerStatus);
  }

  return value;
}

function isNodeType(value: unknown): value is DraftNodeType {
  return (
    value === "deterministic" ||
    value === "perception" ||
    value === "llm" ||
    value === "control" ||
    value === "verification"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
