import { ExecutableAction } from "../../shared/draftAutomation.js";
import { DesktopDriver, DesktopObservation } from "../desktop/desktopDriver.js";
import {
  isNonDeterministicDesktopTaskAction,
  NON_DETERMINISTIC_DESKTOP_TASK_ACTION_SCHEMA,
  validateExecutableAction
} from "./executableActionRegistry.js";
import { requestOpenRouterStructuredOutput } from "../llm/openRouterStructuredOutput.js";

const NON_DETERMINISTIC_TASK_REQUEST_TIMEOUT_MS = 90_000;

export interface NonDeterministicDesktopTaskRunnerConfig {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export interface NonDeterministicDesktopTaskResult {
  status: "completed" | "failed" | "waiting_for_approval";
  message: string;
  logs: string[];
  approval?: Extract<ExecutableAction, { type: "approval_gate" }>;
}

export interface NonDeterministicDesktopTaskRunner {
  runNonDeterministicDesktopTask(task: Extract<ExecutableAction, { type: "llm_desktop_task" }>): Promise<NonDeterministicDesktopTaskResult>;
}

export function createNonDeterministicDesktopTaskRunner(
  driver: DesktopDriver,
  config: NonDeterministicDesktopTaskRunnerConfig = {}
): NonDeterministicDesktopTaskRunner {
  return {
    async runNonDeterministicDesktopTask(task) {
      if (!config.apiKey || !config.model) {
        return {
          status: "failed",
          message:
            "This step needs an OpenRouter model for non-deterministic desktop task control. Set OPENROUTER_API_KEY and OPENROUTER_MODEL, then run it again.",
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
              message: "The non-deterministic desktop task timed out.",
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
              message: decision.reason || "The model judged the non-deterministic desktop task complete.",
              logs
            };
          }

          if (decision.decision === "fail") {
            return {
              status: "failed",
              message: decision.reason || "The model could not complete the non-deterministic desktop task.",
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

          const action = validateExecutableAction(decision.action);
          if (!isNonDeterministicDesktopTaskAction(action)) {
            return {
              status: "failed",
              message: "The non-deterministic desktop task can only use bounded desktop actions after planning.",
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

          const result = await executeNonDeterministicTaskAction(driver, action);
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
              message: verification.reason || "The model verified the non-deterministic desktop task from fresh evidence.",
              logs
            };
          }

          if (verification.decision === "fail") {
            return {
              status: "failed",
              message: verification.reason || "The model could not verify the non-deterministic desktop task from fresh evidence.",
              logs
            };
          }

          logs.push(`Verification requested retry: ${verification.reason}`);
        }
      } catch (error) {
        return {
          status: "failed",
          message: error instanceof Error ? error.message : "The non-deterministic desktop task failed.",
          logs
        };
      }

      return {
        status: "failed",
        message: "The non-deterministic desktop task reached its action limit.",
        logs
      };
    }
  };
}

async function executeNonDeterministicTaskAction(
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
    throw new Error("The non-deterministic desktop task needs screenshot and accessibility evidence before using the model.");
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
  config: Required<Pick<NonDeterministicDesktopTaskRunnerConfig, "apiKey" | "model">> & NonDeterministicDesktopTaskRunnerConfig
): Promise<{ decision: "act" | "complete" | "fail"; reason: string; action?: unknown }> {
  const result = await requestOpenRouterStructuredOutput({
    apiKey: config.apiKey,
    model: config.model,
    baseUrl: config.baseUrl,
    fetchImpl: config.fetchImpl,
    schema: NON_DETERMINISTIC_DESKTOP_TASK_ACTION_SCHEMA,
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
    timeoutMs: NON_DETERMINISTIC_TASK_REQUEST_TIMEOUT_MS,
    providerErrorFallback: "The configured non-deterministic desktop task model rejected the request."
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
          : "AutoM8 could not reach the configured non-deterministic desktop task model."
    };
  }

  const parsed = result.parsedJson;
  if (!isRecord(parsed) || !isDecision(parsed.decision) || typeof parsed.reason !== "string") {
    return {
      decision: "fail",
      reason: "The model returned an invalid non-deterministic desktop task decision."
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
