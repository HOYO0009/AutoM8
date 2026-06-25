import {
  ClarificationAnswer,
  DraftAutomationCreationResult,
  SavedAutomationCandidate,
  nodeTypes
} from "../../shared/draftAutomation.js";
import { DraftValidationError, validateDraftAutomationCreationResultShape } from "../../shared/draftValidation.js";
import { requestOpenRouterStructuredOutput } from "../llm/openRouterStructuredOutput.js";

const LLM_REQUEST_TIMEOUT_MS = 30_000;
const INVALID_LLM_RESPONSE_MESSAGE =
  "The configured draft automation creator did not return the required creation result shape. Choose an OpenRouter model that supports structured outputs, then try again.";

const DRAFT_STEP_DETAILS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    inputs: {
      type: "array",
      description: "Concrete inputs this step needs, such as app names, file paths, sheet tabs, accounts, recipients, URLs, schedules, or time zones.",
      items: {
        type: "string",
        minLength: 1
      }
    },
    outputs: {
      type: "array",
      description: "Concrete outputs this step produces for later steps or the user.",
      items: {
        type: "string",
        minLength: 1
      }
    },
    fallbacks: {
      type: "array",
      description: "Fallback behavior if the step cannot complete as planned.",
      items: {
        type: "string",
        minLength: 1
      }
    },
    verification: {
      type: "array",
      description: "Checks that prove the step succeeded.",
      items: {
        type: "string",
        minLength: 1
      }
    }
  },
  required: ["inputs", "outputs", "fallbacks", "verification"]
} as const;

const DRAFT_AUTOMATION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
      description: "Short name for the Draft Automation."
    },
    summary: {
      type: "string",
      minLength: 1,
      description: "One-sentence summary of the desktop workflow."
    },
    steps: {
      type: "array",
      minItems: 1,
      description: "Ordered Draft Automation steps AutoM8 can preview.",
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
          },
          details: DRAFT_STEP_DETAILS_SCHEMA
        },
        required: ["title", "nodeType", "description", "details"]
      }
    }
  },
  required: ["name", "summary", "steps"]
} as const;

const CLARIFICATION_QUESTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: {
      type: "string",
      minLength: 1,
      description: "Stable kebab-case identifier for the missing Execution Blocker."
    },
    question: {
      type: "string",
      minLength: 1,
      description: "Specific question the user can answer in a text field."
    },
    reason: {
      type: "string",
      minLength: 1,
      description: "Short reason this answer is required before Draft Automation Creation."
    }
  },
  required: ["id", "question", "reason"]
} as const;

const DRAFT_AUTOMATION_CREATION_RESULT_SCHEMA = {
  name: "DraftAutomationCreationResult",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      status: {
        type: "string",
        enum: ["needs_clarification", "draft_created"],
        description: "Whether AutoM8 needs Clarification Answers or created a Draft Automation."
      },
      draft: {
        anyOf: [DRAFT_AUTOMATION_SCHEMA, { type: "null" }],
        description: "Draft Automation when status is draft_created; null when status is needs_clarification."
      },
      questions: {
        type: "array",
        description: "Clarification Questions when status is needs_clarification; empty when status is draft_created.",
        items: CLARIFICATION_QUESTION_SCHEMA
      }
    },
    required: ["status", "draft", "questions"]
  }
} as const;

export interface DraftAutomationCreationConfig {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export interface DraftAutomationCreationContext {
  savedAutomationContext?: SavedAutomationCandidate;
}

export class DraftAutomationCreationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400
  ) {
    super(message);
    this.name = "DraftAutomationCreationError";
  }
}

export async function createDraftAutomationCreationResult(
  prompt: string,
  clarificationAnswers: ClarificationAnswer[],
  config: DraftAutomationCreationConfig,
  context: DraftAutomationCreationContext = {}
): Promise<DraftAutomationCreationResult> {
  const trimmedPrompt = prompt.trim();

  if (!trimmedPrompt) {
    throw new DraftAutomationCreationError(
      "EMPTY_PROMPT",
      "Describe the desktop workflow you want AutoM8 to draft."
    );
  }

  if (!config.apiKey || !config.model) {
    throw new DraftAutomationCreationError(
      "LLM_CONFIG_MISSING",
      "Set OPENROUTER_API_KEY and OPENROUTER_MODEL before generating draft automations."
    );
  }

  const result = await requestOpenRouterStructuredOutput({
    apiKey: config.apiKey,
    model: config.model,
    baseUrl: config.baseUrl,
    fetchImpl: config.fetchImpl,
    schema: DRAFT_AUTOMATION_CREATION_RESULT_SCHEMA,
    messages: [
      {
        role: "system",
        content: systemPromptFor(context)
      },
      {
        role: "user",
        content: JSON.stringify({
          workflowPrompt: trimmedPrompt,
          clarificationAnswers,
          ...(context.savedAutomationContext
            ? { savedAutomationContext: draftContextForModel(context.savedAutomationContext) }
            : {}),
          v1ExecutionBlockers: [
            "specific app, file, spreadsheet, or website",
            "spreadsheet sheet, tab, range, column, or metric location",
            "sender account or application identity",
            "recipients or team destination",
            "schedule time and time zone",
            "external side-effect target"
          ]
        })
      }
    ],
    temperature: 0.2,
    timeoutMs: LLM_REQUEST_TIMEOUT_MS,
    providerErrorFallback: "The configured draft automation creator rejected the request."
  });

  if (!result.ok) {
    if (result.kind === "provider") {
      throw new DraftAutomationCreationError("LLM_REQUEST_FAILED", result.message, 502);
    }

    if (result.kind === "timeout") {
      throw new DraftAutomationCreationError(
        "LLM_REQUEST_TIMEOUT",
        "The configured draft automation creator took too long to respond. Try again or choose a faster OpenRouter model.",
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

    throw new DraftAutomationCreationError(
      "LLM_REQUEST_FAILED",
      "AutoM8 could not reach the configured draft automation creator.",
      502
    );
  }

  return validateCreationResult(result.parsedJson, config.model, result.providerStatus);
}

function systemPromptFor(context: DraftAutomationCreationContext): string {
  const basePrompt =
    "You create Draft Automation Creation Results for AutoM8. Return only JSON that matches the schema. If execution-critical details are missing, return status needs_clarification with draft null and specific Clarification Questions. Do not guess file names, spreadsheet tabs or ranges, app names, websites, sender accounts, recipients, schedules, time zones, or side-effect targets. These missing facts are Execution Blockers. When all Execution Blockers are answered, return status draft_created with questions [] and a Draft Automation whose steps include Draft Step Details for inputs, outputs, fallbacks, and verification. nodeType must be one of deterministic, perception, llm, control, verification.";

  if (!context.savedAutomationContext) {
    return basePrompt;
  }

  return `${basePrompt} A savedAutomationContext means workflowPrompt is an edit request for that saved automation. Use the saved automation as the baseline, apply the requested change, and return the complete updated Draft Automation, not a patch or partial diff.`;
}

function draftContextForModel(savedAutomation: SavedAutomationCandidate) {
  return {
    name: savedAutomation.name,
    summary: savedAutomation.summary,
    steps: savedAutomation.steps
  };
}

function validateCreationResult(value: unknown, model: string, providerStatus: number): DraftAutomationCreationResult {
  try {
    return validateDraftAutomationCreationResultShape(value);
  } catch (error) {
    if (error instanceof DraftValidationError) {
      throw invalidResponseError(model, error.stage, providerStatus);
    }

    throw error;
  }
}

function invalidResponseError(
  model: string,
  stage: string,
  providerStatus: number
): DraftAutomationCreationError {
  console.warn("AutoM8 draft automation creator returned an invalid response.", {
    model,
    stage,
    providerStatus
  });

  return new DraftAutomationCreationError(
    "INVALID_LLM_RESPONSE",
    INVALID_LLM_RESPONSE_MESSAGE,
    502
  );
}
