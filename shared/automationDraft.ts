export const nodeTypes = [
  "deterministic",
  "perception",
  "llm",
  "control",
  "verification"
] as const;

export type DraftNodeType = (typeof nodeTypes)[number];

export const clarificationAnswerKinds = [
  "text",
  "local_file",
  "local_spreadsheet"
] as const;

export type ClarificationAnswerKind = (typeof clarificationAnswerKinds)[number];

export const pickerBackedClarificationAnswerKinds = [
  "local_file",
  "local_spreadsheet"
] as const;

export type PickerBackedClarificationAnswerKind = (typeof pickerBackedClarificationAnswerKinds)[number];

export function isClarificationAnswerKind(value: unknown): value is ClarificationAnswerKind {
  return clarificationAnswerKinds.includes(value as ClarificationAnswerKind);
}

export function isPickerBackedClarificationAnswerKind(
  value: unknown
): value is PickerBackedClarificationAnswerKind {
  return pickerBackedClarificationAnswerKinds.includes(value as PickerBackedClarificationAnswerKind);
}

export interface DraftStepDetails {
  inputs: string[];
  outputs: string[];
  fallbacks: string[];
  verification: string[];
}

export interface DraftAutomationStep {
  title: string;
  nodeType: DraftNodeType;
  description: string;
  details: DraftStepDetails;
}

export interface DraftAutomation {
  name: string;
  summary: string;
  steps: DraftAutomationStep[];
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  reason: string;
  answerKind: ClarificationAnswerKind;
}

export interface ClarificationAnswer {
  questionId: string;
  question: string;
  reason: string;
  answer: string;
}

export type DraftAutomationCreationResult =
  | {
      status: "needs_clarification";
      draft: null;
      questions: ClarificationQuestion[];
    }
  | {
      status: "draft_created";
      draft: DraftAutomation;
      questions: [];
    };

export interface SavedAutomation extends DraftAutomation {
  id: string;
  createdAt: string;
}
