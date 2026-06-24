import { DraftAutomation, nodeTypes } from "../shared/draftAutomation.js";
import { requestOpenRouterStructuredOutput } from "./openRouterStructuredOutput.js";

const LLM_REQUEST_TIMEOUT_MS = 30_000;
const INVALID_LLM_RESPONSE_MESSAGE =
  "The configured draft generator did not return the required draft automation shape. Choose an OpenRouter model that supports structured outputs, then try again.";
const DRAFT_AUTOMATION_SCHEMA = {
  name: "DraftAutomation",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      name: {
        type: "string",
        minLength: 1,
        description: "Short name for the draft automation."
      },
      summary: {
        type: "string",
        minLength: 1,
        description: "One-sentence summary of the desktop workflow."
      },
      steps: {
        type: "array",
        minItems: 1,
        description: "Ordered automation steps AutoM8 can preview.",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: {
              type: "string",
              minLength: 1,
              description: "Concise step title."
            },
            nodeType: {
              type: "string",
              enum: nodeTypes,
              description: "AutoM8 node type for the step."
            },
            description: {
              type: "string",
              minLength: 1,
              description: "Plain-language description of the action."
            }
          },
          required: ["title", "nodeType", "description"]
        }
      }
    },
    required: ["name", "summary", "steps"]
  }
} as const;

export interface DraftGeneratorConfig {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export class DraftGenerationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400
  ) {
    super(message);
    this.name = "DraftGenerationError";
  }
}

export async function createDraftAutomation(
  prompt: string,
  config: DraftGeneratorConfig
): Promise<DraftAutomation> {
  const trimmedPrompt = prompt.trim();

  if (!trimmedPrompt) {
    throw new DraftGenerationError(
      "EMPTY_PROMPT",
      "Describe the desktop workflow you want AutoM8 to draft."
    );
  }

  if (!config.apiKey || !config.model) {
    throw new DraftGenerationError(
      "LLM_CONFIG_MISSING",
      "Set OPENROUTER_API_KEY and OPENROUTER_MODEL before generating draft automations."
    );
  }

  const result = await requestOpenRouterStructuredOutput({
    apiKey: config.apiKey,
    model: config.model,
    baseUrl: config.baseUrl,
    fetchImpl: config.fetchImpl,
    schema: DRAFT_AUTOMATION_SCHEMA,
    messages: [
      {
        role: "system",
        content:
          "You create concise draft desktop automations for AutoM8. Return only JSON that matches the provided schema. Each step must include title, nodeType, and description. nodeType must be one of deterministic, perception, llm, control, verification."
      },
      {
        role: "user",
        content: `Draft an automation from this workflow description:\n\n${trimmedPrompt}`
      }
    ],
    temperature: 0.2,
    timeoutMs: LLM_REQUEST_TIMEOUT_MS,
    providerErrorFallback: "The configured draft generator rejected the request."
  });

  if (!result.ok) {
    if (result.kind === "provider") {
      throw new DraftGenerationError("LLM_REQUEST_FAILED", result.message, 502);
    }

    if (result.kind === "timeout") {
      throw new DraftGenerationError(
        "LLM_REQUEST_TIMEOUT",
        "The configured draft generator took too long to respond. Try again or choose a faster OpenRouter model.",
        504
      );
    }

    if (result.kind === "invalid_json") {
      throw invalidResponseError(
        config.model,
        result.stage ?? "assistant-json",
        result.providerStatus ?? 200
      );
    }

    throw new DraftGenerationError(
      "LLM_REQUEST_FAILED",
      "AutoM8 could not reach the configured draft generator.",
      502
    );
  }

  return validateDraftAutomation(result.parsedJson, config.model, result.providerStatus);
}

function validateDraftAutomation(value: unknown, model: string, providerStatus: number): DraftAutomation {
  if (!isRecord(value)) {
    throw invalidResponseError(model, "draft-shape", providerStatus);
  }

  const { name, summary, steps } = value;
  if (typeof name !== "string" || !name.trim()) {
    throw invalidResponseError(model, "draft-name", providerStatus);
  }

  if (typeof summary !== "string" || !summary.trim()) {
    throw invalidResponseError(model, "draft-summary", providerStatus);
  }

  if (!Array.isArray(steps) || steps.length === 0) {
    throw invalidResponseError(model, "draft-steps", providerStatus);
  }

  return {
    name: name.trim(),
    summary: summary.trim(),
    steps: steps.map((step) => validateStep(step, model, providerStatus))
  };
}

function validateStep(
  value: unknown,
  model: string,
  providerStatus: number
): DraftAutomation["steps"][number] {
  if (!isRecord(value)) {
    throw invalidResponseError(model, "step-shape", providerStatus);
  }

  const { title, nodeType, description } = value;
  if (typeof title !== "string" || !title.trim()) {
    throw invalidResponseError(model, "step-title", providerStatus);
  }

  if (!nodeTypes.includes(nodeType as DraftAutomation["steps"][number]["nodeType"])) {
    throw invalidResponseError(model, "step-node-type", providerStatus);
  }

  if (typeof description !== "string" || !description.trim()) {
    throw invalidResponseError(model, "step-description", providerStatus);
  }

  return {
    title: title.trim(),
    nodeType: nodeType as DraftAutomation["steps"][number]["nodeType"],
    description: description.trim()
  };
}

function invalidResponseError(
  model: string,
  stage: string,
  providerStatus: number
): DraftGenerationError {
  console.warn("AutoM8 draft generator returned an invalid response.", {
    model,
    stage,
    providerStatus
  });

  return new DraftGenerationError(
    "INVALID_LLM_RESPONSE",
    INVALID_LLM_RESPONSE_MESSAGE,
    502
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
