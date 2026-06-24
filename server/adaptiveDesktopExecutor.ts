import { ExecutableAction } from "../shared/draftAutomation.js";
import { DesktopDriver } from "./desktopDriver.js";
import { validateAction } from "./executionPlanner.js";

const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
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
  status: "completed" | "failed";
  message: string;
  logs: string[];
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

      for (let iteration = 1; iteration <= task.maxIterations; iteration += 1) {
        if (Date.now() - startedAt > task.timeoutMs) {
          return {
            status: "failed",
            message: "The LLM-assisted desktop task timed out.",
            logs
          };
        }

        const observation = await driver.observeDesktop();
        logs.push(`Observation ${iteration}: ${observation.summary}`);
        const decision = await requestNextAction(task.goal, observation.summary, {
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

        const result = await executeAdaptiveAction(driver, action);
        logs.push(result);
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

async function requestNextAction(
  goal: string,
  observation: string,
  config: Required<Pick<AdaptiveDesktopExecutorConfig, "apiKey" | "model">> & AdaptiveDesktopExecutorConfig
): Promise<{ decision: "act" | "complete" | "fail"; reason: string; action?: unknown }> {
  const fetchImpl = config.fetchImpl ?? fetch;
  const baseUrl = (config.baseUrl ?? DEFAULT_OPENROUTER_BASE_URL).replace(/\/+$/, "");
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), ADAPTIVE_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetchImpl(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "AutoM8"
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: "system",
            content:
              "You are controlling a Windows desktop through a safe AutoM8 action API. Return exactly one decision. Use complete if the goal is done, fail if impossible from the observation, or act with one allowed action. Do not request shell commands."
          },
          {
            role: "user",
            content: JSON.stringify({ goal, observation })
          }
        ],
        provider: { require_parameters: true },
        response_format: {
          type: "json_schema",
          json_schema: ADAPTIVE_ACTION_SCHEMA
        },
        temperature: 0.1
      }),
      signal: abortController.signal
    });

    const payload = await readJson(response);
    if (!response.ok) {
      return {
        decision: "fail",
        reason: providerErrorMessage(payload)
      };
    }

    const content = extractAssistantContent(payload);
    const parsed = JSON.parse(stripJsonFence(content));
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
  } catch (error) {
    if (abortController.signal.aborted || isAbortError(error)) {
      return {
        decision: "fail",
        reason: "The model took too long to choose the next desktop action."
      };
    }

    return {
      decision: "fail",
      reason: "AutoM8 could not reach the configured adaptive desktop model."
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    return undefined;
  }
}

function providerErrorMessage(payload: unknown): string {
  if (isRecord(payload) && isRecord(payload.error) && typeof payload.error.message === "string") {
    return payload.error.message;
  }

  return "The configured adaptive desktop model rejected the request.";
}

function extractAssistantContent(payload: unknown): string {
  const firstChoice = isRecord(payload) && Array.isArray(payload.choices) ? payload.choices[0] : undefined;
  const content = isRecord(firstChoice) && isRecord(firstChoice.message) ? firstChoice.message.content : undefined;
  return typeof content === "string" ? content : "";
}

function stripJsonFence(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function isDecision(value: unknown): value is "act" | "complete" | "fail" {
  return value === "act" || value === "complete" || value === "fail";
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
