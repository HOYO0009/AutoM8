export const OPENROUTER_DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";

export type OpenRouterMessageContent =
  | string
  | Array<
      | {
          type: "text";
          text: string;
        }
      | {
          type: "image_url";
          image_url: {
            url: string;
          };
        }
    >;

export interface OpenRouterMessage {
  role: "system" | "user";
  content: OpenRouterMessageContent;
}

export type OpenRouterInvalidStage =
  | "provider-payload"
  | "assistant-message"
  | "assistant-content"
  | "assistant-json";

export type OpenRouterStructuredOutputResult =
  | {
      ok: true;
      content: string;
      providerStatus: number;
      parsedJson: unknown;
    }
  | {
      ok: false;
      kind: "provider" | "timeout" | "network" | "invalid_json";
      message: string;
      providerStatus?: number;
      stage?: OpenRouterInvalidStage;
    };

export interface OpenRouterStructuredOutputConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  schema: unknown;
  messages: OpenRouterMessage[];
  temperature: number;
  timeoutMs: number;
  providerErrorFallback: string;
}

export async function requestOpenRouterStructuredOutput(
  config: OpenRouterStructuredOutputConfig
): Promise<OpenRouterStructuredOutputResult> {
  const fetchImpl = config.fetchImpl ?? fetch;
  const baseUrl = (config.baseUrl ?? OPENROUTER_DEFAULT_BASE_URL).replace(/\/+$/, "");
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), config.timeoutMs);

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
        messages: config.messages,
        provider: { require_parameters: true },
        response_format: {
          type: "json_schema",
          json_schema: config.schema
        },
        temperature: config.temperature
      }),
      signal: abortController.signal
    });

    const payload = await readJson(response);

    if (!response.ok) {
      return {
        ok: false,
        kind: "provider",
        message: providerErrorMessage(payload, config.providerErrorFallback),
        providerStatus: response.status
      };
    }

    const content = extractAssistantContent(payload);
    if (!content.ok) {
      return {
        ok: false,
        kind: "invalid_json",
        message: "The configured model returned an invalid assistant message.",
        providerStatus: response.status,
        stage: content.stage
      };
    }

    try {
      return {
        ok: true,
        content: content.content,
        providerStatus: response.status,
        parsedJson: JSON.parse(stripJsonFence(content.content))
      };
    } catch {
      return {
        ok: false,
        kind: "invalid_json",
        message: "The configured model returned invalid JSON.",
        providerStatus: response.status,
        stage: "assistant-json"
      };
    }
  } catch (error) {
    if (abortController.signal.aborted || isAbortError(error)) {
      return {
        ok: false,
        kind: "timeout",
        message: "The configured model took too long to respond."
      };
    }

    return {
      ok: false,
      kind: "network",
      message: "AutoM8 could not reach the configured model."
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

function providerErrorMessage(payload: unknown, fallback: string): string {
  if (isRecord(payload) && isRecord(payload.error) && typeof payload.error.message === "string") {
    return payload.error.message;
  }

  return fallback;
}

function extractAssistantContent(
  payload: unknown
):
  | {
      ok: true;
      content: string;
    }
  | {
      ok: false;
      stage: OpenRouterInvalidStage;
    } {
  if (!isRecord(payload)) {
    return { ok: false, stage: "provider-payload" };
  }

  const firstChoice = Array.isArray(payload.choices) ? payload.choices[0] : undefined;
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
    return { ok: false, stage: "assistant-message" };
  }

  const { content } = firstChoice.message;
  if (typeof content !== "string" || !content.trim()) {
    return { ok: false, stage: "assistant-content" };
  }

  return { ok: true, content };
}

function stripJsonFence(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
