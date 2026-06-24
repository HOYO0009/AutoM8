import { ExecutableAction } from "../../shared/draftAutomation.js";
import { DesktopDriver, DesktopObservation } from "../desktop/desktopDriver.js";
import { validateAction } from "./executionPlanner.js";
import { requestOpenRouterStructuredOutput } from "../llm/openRouterStructuredOutput.js";

const ADAPTIVE_REQUEST_TIMEOUT_MS = 30_000;
const ADAPTIVE_ACTION_SCHEMA = {
  name: "AdaptiveDesktopAction",
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
      action: {
        type: "object",
        additionalProperties: false,
        properties: {
          type: {
            type: "string",
            enum: ["focus_window", "open_url", "hotkey", "type_text", "click", "wait", "verify_text", "approval_gate"]
          },
          app: { type: "string" },
          title: { type: "string" },
          url: { type: "string" },
          keys: { type: "string" },
          text: { type: "string" },
          x: { type: "number" },
          y: { type: "number" },
          ms: { type: "number" },
          action: { type: "string" },
          destination: { type: "string" },
          dataSummary: { type: "string" }
        },
        required: ["type"]
      }
    },
    required: ["decision", "reason"]
  }
} as const;

export interface AdaptiveDesktopExecutorConfig {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export interface AdaptiveExecutionResult {
  status: "completed" | "failed" | "waiting_for_approval";
  message: string;
  logs: string[];
  approval?: Extract<ExecutableAction, { type: "approval_gate" }>;
}

export interface AdaptiveDesktopExecutor {
  runTask(task: Extract<ExecutableAction, { type: "llm_desktop_task" }>): Promise<AdaptiveExecutionResult>;
}

export function createAdaptiveDesktopExecutor(
  driver: DesktopDriver,
  config: AdaptiveDesktopExecutorConfig = {}
): AdaptiveDesktopExecutor {
  return {
    async runTask(task) {
      if (!config.apiKey || !config.model) {
        return {
          status: "failed",
          message:
            "This step needs an OpenRouter model for LLM-assisted desktop control. Set OPENROUTER_API_KEY and OPENROUTER_MODEL, then run it again.",
          logs: []
        };
      }

      const logs: string[] = [];
      const startedAt = Date.now();

      try {
        for (let iteration = 1; iteration <= task.maxIterations; iteration += 1) {
          if (Date.now() - startedAt > task.timeoutMs) {
            return {
              status: "failed",
              message: "The LLM-assisted desktop task timed out.",
              logs
            };
          }

          const observation = await observeWithRequiredEvidence(driver);
          logs.push(`Observation ${iteration}: ${observation.summary}`);
          logs.push(`Accessibility ${iteration}: ${observation.accessibility}`);
          const decision = await requestNextAction(task.goal, observation, "action", {
            ...config,
            apiKey: config.apiKey,
            model: config.model
          });

          if (decision.decision === "complete") {
            return {
              status: "completed",
              message: decision.reason || "The model judged the desktop task complete.",
              logs
            };
          }

          if (decision.decision === "fail") {
            return {
              status: "failed",
              message: decision.reason || "The model could not complete the desktop task.",
              logs
            };
          }

          if (!decision.action) {
            return {
              status: "failed",
              message: "The model requested an action without a valid action payload.",
              logs
            };
          }

          const action = validateAction(decision.action);
          if (action.type === "launch_app" || action.type === "llm_desktop_task") {
            return {
              status: "failed",
              message: "The adaptive loop can only use bounded desktop actions after planning.",
              logs
            };
          }

          if (action.type === "approval_gate") {
            return {
              status: "waiting_for_approval",
              message: decision.reason || `Approval required before ${action.action}.`,
              logs,
              approval: action
            };
          }

          const result = await executeAdaptiveAction(driver, action);
          logs.push(result);
          const verificationObservation = await observeWithRequiredEvidence(driver);
          logs.push(`Verification observation ${iteration}: ${verificationObservation.summary}`);
          logs.push(`Verification accessibility ${iteration}: ${verificationObservation.accessibility}`);
          const verification = await requestNextAction(task.goal, verificationObservation, "verification", {
            ...config,
            apiKey: config.apiKey,
            model: config.model
          });

          if (verification.decision === "complete") {
            return {
              status: "completed",
              message: verification.reason || "The model verified the desktop task from fresh evidence.",
              logs
            };
          }

          if (verification.decision === "fail") {
            return {
              status: "failed",
              message: verification.reason || "The model could not verify the desktop task from fresh evidence.",
              logs
            };
          }

          logs.push(`Verification requested retry: ${verification.reason}`);
        }
      } catch (error) {
        return {
          status: "failed",
          message: error instanceof Error ? error.message : "The adaptive desktop task failed.",
          logs
        };
      }

      return {
        status: "failed",
        message: "The LLM-assisted desktop task reached its action limit.",
        logs
      };
    }
  };
}

async function executeAdaptiveAction(
  driver: DesktopDriver,
  action: Exclude<ExecutableAction, { type: "launch_app" | "llm_desktop_task" }>
): Promise<string> {
  switch (action.type) {
    case "focus_window":
      return driver.focusWindow({ app: action.app, title: action.title });
    case "open_url":
      return driver.openUrl(action.url);
    case "hotkey":
      return driver.pressKey(action.keys);
    case "type_text":
      return driver.typeText(action.text);
    case "click":
      return driver.click(action.x, action.y);
    case "wait":
      return driver.wait(action.ms);
    case "verify_text":
      return driver.verifyText(action.text);
    case "approval_gate":
      return `Approval required before ${action.action}.`;
  }
}

async function observeWithRequiredEvidence(driver: DesktopDriver): Promise<Required<DesktopObservation>> {
  const observation = await driver.observeDesktop();
  if (!observation.screenshotDataUrl?.startsWith("data:image/png;base64,") || !observation.accessibility?.trim()) {
    throw new Error("The adaptive desktop task needs screenshot and accessibility evidence before using the model.");
  }

  return {
    summary: observation.summary,
    screenshotDataUrl: observation.screenshotDataUrl,
    accessibility: observation.accessibility.trim()
  };
}

async function requestNextAction(
  goal: string,
  observation: Required<DesktopObservation>,
  phase: "action" | "verification",
  config: Required<Pick<AdaptiveDesktopExecutorConfig, "apiKey" | "model">> & AdaptiveDesktopExecutorConfig
): Promise<{ decision: "act" | "complete" | "fail"; reason: string; action?: unknown }> {
  const result = await requestOpenRouterStructuredOutput({
    apiKey: config.apiKey,
    model: config.model,
    baseUrl: config.baseUrl,
    fetchImpl: config.fetchImpl,
    schema: ADAPTIVE_ACTION_SCHEMA,
    messages: [
      {
        role: "system",
        content:
          "You are controlling a Windows desktop through a safe AutoM8 action API. Return exactly one decision. Use complete only when the fresh screenshot and accessibility evidence prove the goal is done, fail if impossible from the evidence, or act with one allowed action. Do not request shell commands."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: JSON.stringify({
              goal,
              phase,
              instruction:
                phase === "action"
                  ? "Choose exactly one bounded desktop action from this evidence."
                  : "Verify whether the goal is complete from this fresh evidence. Return act only if another retry is needed.",
              observation: {
                summary: observation.summary,
                accessibility: observation.accessibility
              }
            })
          },
          {
            type: "image_url",
            image_url: {
              url: observation.screenshotDataUrl
            }
          }
        ]
      }
    ],
    temperature: 0.1,
    timeoutMs: ADAPTIVE_REQUEST_TIMEOUT_MS,
    providerErrorFallback: "The configured adaptive desktop model rejected the request."
  });

  if (!result.ok) {
    if (result.kind === "provider") {
      return {
        decision: "fail",
        reason: result.message
      };
    }

    return {
      decision: "fail",
      reason:
        result.kind === "timeout"
          ? "The model took too long to choose the next desktop action."
          : "AutoM8 could not reach the configured adaptive desktop model."
    };
  }

  const parsed = result.parsedJson;
  if (!isRecord(parsed) || !isDecision(parsed.decision) || typeof parsed.reason !== "string") {
    return {
      decision: "fail",
      reason: "The model returned an invalid adaptive desktop decision."
    };
  }

  return {
    decision: parsed.decision,
    reason: parsed.reason,
    action: parsed.action
  };
}

function isDecision(value: unknown): value is "act" | "complete" | "fail" {
  return value === "act" || value === "complete" || value === "fail";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
