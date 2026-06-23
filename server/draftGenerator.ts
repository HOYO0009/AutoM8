import { DraftAutomation, nodeTypes } from "../shared/draftAutomation.js";

const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

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

  let response: Response;
  try {
    response = await fetchImpl(`${baseUrl}/chat/completions`, {
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
              "You create concise draft desktop automations for AutoM8. Return only valid JSON with name, summary, and steps. Each step must include title, nodeType, and description. nodeType must be one of deterministic, perception, llm, control, verification."
          },
          {
            role: "user",
            content: `Draft an automation from this workflow description:\n\n${trimmedPrompt}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      })
    });
  } catch {
    throw new DraftGenerationError(
      "LLM_REQUEST_FAILED",
      "AutoM8 could not reach the configured draft generator.",
      502
    );
  }

  const payload = await readJson(response);

  if (!response.ok) {
    throw new DraftGenerationError(
      "LLM_REQUEST_FAILED",
      providerErrorMessage(payload),
      502
    );
  }

  const content = extractAssistantContent(payload);
  const parsedDraft = parseAssistantJson(content);

  return validateDraftAutomation(parsedDraft);
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function providerErrorMessage(payload: unknown): string {
  if (isRecord(payload) && isRecord(payload.error) && typeof payload.error.message === "string") {
    return payload.error.message;
  }

  return "The configured draft generator rejected the request.";
}

function extractAssistantContent(payload: unknown): string {
  if (!isRecord(payload)) {
    throw invalidResponseError();
  }

  const firstChoice = Array.isArray(payload.choices) ? payload.choices[0] : undefined;
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
    throw invalidResponseError();
  }

  const { content } = firstChoice.message;
  if (typeof content !== "string" || !content.trim()) {
    throw invalidResponseError();
  }

  return content;
}

function parseAssistantJson(content: string): unknown {
  try {
    return JSON.parse(stripJsonFence(content));
  } catch {
    throw invalidResponseError();
  }
}

function stripJsonFence(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function validateDraftAutomation(value: unknown): DraftAutomation {
  if (!isRecord(value)) {
    throw invalidResponseError();
  }

  const { name, summary, steps } = value;
  if (typeof name !== "string" || !name.trim()) {
    throw invalidResponseError();
  }

  if (typeof summary !== "string" || !summary.trim()) {
    throw invalidResponseError();
  }

  if (!Array.isArray(steps) || steps.length === 0) {
    throw invalidResponseError();
  }

  return {
    name: name.trim(),
    summary: summary.trim(),
    steps: steps.map(validateStep)
  };
}

function validateStep(value: unknown): DraftAutomation["steps"][number] {
  if (!isRecord(value)) {
    throw invalidResponseError();
  }

  const { title, nodeType, description } = value;
  if (typeof title !== "string" || !title.trim()) {
    throw invalidResponseError();
  }

  if (!nodeTypes.includes(nodeType as DraftAutomation["steps"][number]["nodeType"])) {
    throw invalidResponseError();
  }

  if (typeof description !== "string" || !description.trim()) {
    throw invalidResponseError();
  }

  return {
    title: title.trim(),
    nodeType: nodeType as DraftAutomation["steps"][number]["nodeType"],
    description: description.trim()
  };
}

function invalidResponseError(): DraftGenerationError {
  return new DraftGenerationError(
    "INVALID_LLM_RESPONSE",
    "The configured draft generator returned a response AutoM8 could not read.",
    502
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
