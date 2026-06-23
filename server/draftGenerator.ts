import { DraftAutomation, nodeTypes } from "../shared/draftAutomation.js";

const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
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

  const fetchImpl = config.fetchImpl ?? fetch;
  const baseUrl = (config.baseUrl ?? DEFAULT_OPENROUTER_BASE_URL).replace(/\/+$/, "");
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), LLM_REQUEST_TIMEOUT_MS);

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
              "You create concise draft desktop automations for AutoM8. Return only JSON that matches the provided schema. Each step must include title, nodeType, and description. nodeType must be one of deterministic, perception, llm, control, verification."
          },
          {
            role: "user",
            content: `Draft an automation from this workflow description:\n\n${trimmedPrompt}`
          }
        ],
        provider: { require_parameters: true },
        response_format: {
          type: "json_schema",
          json_schema: DRAFT_AUTOMATION_SCHEMA
        },
        temperature: 0.2
      }),
      signal: abortController.signal
    });

    const payload = await readJson(response);

    if (!response.ok) {
      throw new DraftGenerationError(
        "LLM_REQUEST_FAILED",
        providerErrorMessage(payload),
        502
      );
    }

    const content = extractAssistantContent(payload, config.model, response.status);
    const parsedDraft = parseAssistantJson(content, config.model, response.status);

    return validateDraftAutomation(parsedDraft, config.model, response.status);
  } catch (error) {
    if (error instanceof DraftGenerationError) {
      throw error;
    }

    if (abortController.signal.aborted || isAbortError(error)) {
      throw new DraftGenerationError(
        "LLM_REQUEST_TIMEOUT",
        "The configured draft generator took too long to respond. Try again or choose a faster OpenRouter model.",
        504
      );
    }

    throw new DraftGenerationError(
      "LLM_REQUEST_FAILED",
      "AutoM8 could not reach the configured draft generator.",
      502
    );
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

  return "The configured draft generator rejected the request.";
}

function extractAssistantContent(payload: unknown, model: string, providerStatus: number): string {
  if (!isRecord(payload)) {
    throw invalidResponseError(model, "provider-payload", providerStatus);
  }

  const firstChoice = Array.isArray(payload.choices) ? payload.choices[0] : undefined;
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
    throw invalidResponseError(model, "assistant-message", providerStatus);
  }

  const { content } = firstChoice.message;
  if (typeof content !== "string" || !content.trim()) {
    throw invalidResponseError(model, "assistant-content", providerStatus);
  }

  return content;
}

function parseAssistantJson(content: string, model: string, providerStatus: number): unknown {
  try {
    return JSON.parse(stripJsonFence(content));
  } catch {
    throw invalidResponseError(model, "assistant-json", providerStatus);
  }
}

function stripJsonFence(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
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

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
