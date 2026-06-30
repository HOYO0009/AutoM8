import {
  ClarificationAnswer,
  DraftAutomationCreationResult,
  SavedAutomationCandidate,
  nodeTypes
} from "../../shared/automationDraft.js";
import type { ApiErrorDiagnostics } from "../../shared/apiResponses.js";
import {
  DraftValidationError,
  validateDraftAutomationCreationResultShape
} from "../../shared/draftValidation.js";
import type { DraftValidationStage } from "../../shared/draftValidation.js";
import { requestOpenRouterStructuredOutput } from "../llm/openRouterStructuredOutput.js";
import type { OpenRouterStructuredOutputResult } from "../llm/openRouterStructuredOutput.js";

const LLM_REQUEST_TIMEOUT_MS = 90_000;
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

const DRAFT_AUTOMATION_REPAIR_SCHEMA_SUMMARY = {
  allowedStatuses: ["needs_clarification", "draft_created"],
  allowedNodeTypes: nodeTypes,
  resultRules: [
    "needs_clarification requires draft null and one or more Clarification Questions",
    "draft_created requires a complete Draft Automation and questions []",
    "Clarification Questions require id, question, and reason",
    "Draft steps require title, nodeType, description, and details",
    "Draft Step Details require inputs, outputs, fallbacks, and verification arrays"
  ]
} as const;

export interface DraftAutomationCreationConfig {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

type ConfiguredDraftAutomationCreationConfig = DraftAutomationCreationConfig & {
  apiKey: string;
  model: string;
};

export interface DraftAutomationCreationContext {
  savedAutomationContext?: SavedAutomationCandidate;
}

export class DraftAutomationCreationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
    public readonly diagnostics?: ApiErrorDiagnostics
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
  const llmConfig: ConfiguredDraftAutomationCreationConfig = {
    apiKey: config.apiKey,
    model: config.model,
    baseUrl: config.baseUrl,
    fetchImpl: config.fetchImpl
  };

  const messages = [
    {
      role: "system" as const,
      content: systemPromptFor(context)
    },
    {
      role: "user" as const,
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
  ];

  const result = await requestOpenRouterStructuredOutput({
    apiKey: llmConfig.apiKey,
    model: llmConfig.model,
    baseUrl: llmConfig.baseUrl,
    fetchImpl: llmConfig.fetchImpl,
    schema: DRAFT_AUTOMATION_CREATION_RESULT_SCHEMA,
    messages,
    temperature: 0.2,
    timeoutMs: LLM_REQUEST_TIMEOUT_MS,
    providerErrorFallback: "The configured draft automation creator rejected the request."
  });

  if (!result.ok) {
    throw structuredOutputFailureError(result, llmConfig.model);
  }

  return validateOrRepairCreationResult(result.parsedJson, llmConfig);
}

function systemPromptFor(context: DraftAutomationCreationContext): string {
  const basePrompt =
    "You create Draft Automation Creation Results for AutoM8. Return only JSON that matches the schema. If execution-critical details are missing, return status needs_clarification with draft null and specific Clarification Questions. Do not guess file names, spreadsheet tabs or ranges, app names, websites, sender accounts, recipients, schedules, time zones, or side-effect targets. These missing facts are Execution Blockers. Clarification Answers include questionId, question, reason, and answer. Treat each Clarification Answer as context for an answered Execution Blocker. When an answer resolves a blocker, incorporate that fact into the relevant Draft Step Details. If an answer is insufficient, ask a new specific Clarification Question that names the remaining missing fact instead of repeating a generic blocker. When all Execution Blockers are answered, return status draft_created with questions [] and a Draft Automation whose steps include Draft Step Details for inputs, outputs, fallbacks, and verification. nodeType must be one of deterministic, perception, llm, control, verification.";

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

async function validateOrRepairCreationResult(
  value: unknown,
  config: ConfiguredDraftAutomationCreationConfig
): Promise<DraftAutomationCreationResult> {
  const validation = validateCreationResult(value);
  if (validation.ok) {
    return validation.result;
  }

  const repairResult = await requestOpenRouterStructuredOutput({
    apiKey: config.apiKey,
    model: config.model,
    baseUrl: config.baseUrl,
    fetchImpl: config.fetchImpl,
    schema: DRAFT_AUTOMATION_CREATION_RESULT_SCHEMA,
    messages: [
      {
        role: "system",
        content:
          "You repair AutoM8 Draft Automation Creation Result JSON. Return corrected JSON only. The corrected JSON must match the schema and preserve the user's automation intent where possible."
      },
      {
        role: "user",
        content: JSON.stringify({
          invalidStage: validation.stage,
          allowedSchemaSummary: DRAFT_AUTOMATION_REPAIR_SCHEMA_SUMMARY,
          priorParsedJson: value
        })
      }
    ],
    temperature: 0,
    timeoutMs: LLM_REQUEST_TIMEOUT_MS,
    providerErrorFallback: "The configured draft automation creator rejected the repair request."
  });

  if (!repairResult.ok) {
    throw structuredOutputFailureError(repairResult, config.model);
  }

  const repairValidation = validateCreationResult(repairResult.parsedJson);
  if (repairValidation.ok) {
    return repairValidation.result;
  }

  throw invalidResponseError(config.model, repairValidation.stage, repairResult.providerStatus);
}

function validateCreationResult(
  value: unknown
):
  | {
      ok: true;
      result: DraftAutomationCreationResult;
    }
  | {
      ok: false;
      stage: DraftValidationStage;
    } {
  try {
    return { ok: true, result: validateDraftAutomationCreationResultShape(value) };
  } catch (error) {
    if (error instanceof DraftValidationError) {
      return { ok: false, stage: error.stage };
    }

    throw error;
  }
}

function structuredOutputFailureError(
  result: Exclude<OpenRouterStructuredOutputResult, { ok: true }>,
  model: string
): DraftAutomationCreationError {
  if (result.kind === "provider") {
    return new DraftAutomationCreationError(
      "LLM_REQUEST_FAILED",
      result.message,
      502,
      providerDiagnostics(model, result.providerStatus)
    );
  }

  if (result.kind === "timeout") {
    return new DraftAutomationCreationError(
      "LLM_REQUEST_TIMEOUT",
      "The configured draft automation creator took too long to respond. Try again or choose a faster OpenRouter model.",
      504
    );
  }

  if (result.kind === "invalid_json") {
    return invalidResponseError(model, result.stage ?? "assistant-json", result.providerStatus ?? 200);
  }

  return new DraftAutomationCreationError(
    "LLM_REQUEST_FAILED",
    "AutoM8 could not reach the configured draft automation creator.",
    502
  );
}

function invalidResponseError(
  model: string,
  stage: string,
  providerStatus: number
): DraftAutomationCreationError {
  const diagnostics = invalidResponseDiagnostics(model, stage, providerStatus);
  console.warn("AutoM8 draft automation creator returned an invalid response.", {
    model,
    stage,
    providerStatus
  });

  return new DraftAutomationCreationError(
    "INVALID_LLM_RESPONSE",
    INVALID_LLM_RESPONSE_MESSAGE,
    502,
    diagnostics
  );
}

function providerDiagnostics(model: string, providerStatus?: number): ApiErrorDiagnostics {
  return {
    failureType: "provider_rejection",
    model,
    providerStatus,
    guidance:
      "OpenRouter rejected the structured-output request. Check whether the selected route supports json_schema response_format, or retry with a fixed structured-output model."
  };
}

function invalidResponseDiagnostics(
  model: string,
  stage: string,
  providerStatus: number
): ApiErrorDiagnostics {
  return {
    failureType: diagnosticFailureTypeForStage(stage),
    model,
    stage,
    providerStatus,
    guidance: diagnosticGuidanceForStage(stage)
  };
}

function diagnosticFailureTypeForStage(stage: string): ApiErrorDiagnostics["failureType"] {
  if (stage === "assistant-json") {
    return "invalid_json";
  }

  if (
    stage.startsWith("creation-result") ||
    stage.startsWith("draft-") ||
    stage.startsWith("step-") ||
    stage.startsWith("clarification-question")
  ) {
    return "invalid_creation_result_shape";
  }

  return "invalid_assistant_message";
}

function diagnosticGuidanceForStage(stage: string): string {
  if (stage === "assistant-json") {
    return "The model returned assistant content that was not parseable JSON. Retry the request; if it repeats, use a fixed structured-output model instead of the free router.";
  }

  if (
    stage.startsWith("creation-result") ||
    stage.startsWith("draft-") ||
    stage.startsWith("step-") ||
    stage.startsWith("clarification-question")
  ) {
    return "The model returned JSON, but it did not match AutoM8's Draft Automation Creation Result contract. Retry the request; if it repeats, use a fixed structured-output model instead of the free router.";
  }

  return "OpenRouter returned a response without usable assistant JSON content. Retry the request; if it repeats, use a fixed structured-output model instead of the free router.";
}
