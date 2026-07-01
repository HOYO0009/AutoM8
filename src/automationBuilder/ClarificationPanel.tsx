import { FileSearch, LoaderCircle, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";

import { isPickerBackedClarificationAnswerKind } from "../../shared/automationDraft";
import type {
  ClarificationQuestion,
  PickerBackedClarificationAnswerKind
} from "../../shared/automationDraft";

export function ClarificationPanel({
  questions,
  answerText,
  isGenerating,
  canSubmit,
  onAnswerChange,
  onPickAnswer,
  onSubmit,
  description = "AutoM8 needs these facts before it can create a Draft Automation.",
  submitLabel = "Create draft"
}: {
  questions: ClarificationQuestion[];
  answerText: Record<string, string>;
  isGenerating: boolean;
  canSubmit: boolean;
  onAnswerChange: (questionId: string, answer: string) => void;
  onPickAnswer: (answerKind: PickerBackedClarificationAnswerKind) => Promise<string | null>;
  onSubmit: () => void;
  description?: string;
  submitLabel?: string;
}) {
  const [pickingQuestionId, setPickingQuestionId] = useState<string | null>(null);
  const [pickerError, setPickerError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  async function choosePickerAnswer(question: ClarificationQuestion) {
    if (!isPickerBackedClarificationAnswerKind(question.answerKind)) {
      return;
    }

    setPickingQuestionId(question.id);
    setPickerError(null);
    try {
      const selectedPath = await onPickAnswer(question.answerKind);
      if (selectedPath) {
        onAnswerChange(question.id, selectedPath);
      }
    } catch (error) {
      setPickerError(error instanceof Error ? error.message : "AutoM8 could not open the local picker.");
    } finally {
      setPickingQuestionId(null);
    }
  }

  return (
    <article className="clarification-panel" aria-label="Clarification questions">
      <header>
        <p className="eyebrow">Clarification required</p>
        <h2>Answer the missing execution details</h2>
        <p>{description}</p>
      </header>

      <form className="clarification-form" onSubmit={handleSubmit}>
        {questions.map((question) => {
          const fieldId = `clarification-${question.id}`;
          const answerValue = answerText[question.id] ?? "";
          const isPickerBacked = isPickerBackedClarificationAnswerKind(question.answerKind);
          const isPickingThisQuestion = pickingQuestionId === question.id;

          return (
            <div key={question.id} className="clarification-question">
              <label htmlFor={fieldId}>
                <span>{question.question}</span>
                <small>{question.reason}</small>
              </label>
              {isPickerBacked ? (
                <div className="clarification-picker-row">
                  <input
                    id={fieldId}
                    readOnly
                    value={answerValue}
                    placeholder={pickerPlaceholderFor(question.answerKind)}
                  />
                  <button
                    type="button"
                    className="clarification-picker-button"
                    disabled={Boolean(pickingQuestionId) || isGenerating}
                    onClick={() => void choosePickerAnswer(question)}
                  >
                    {isPickingThisQuestion ? (
                      <LoaderCircle aria-hidden="true" className="spin" size={18} />
                    ) : (
                      <FileSearch aria-hidden="true" size={18} />
                    )}
                    {pickerLabelFor(question.answerKind)}
                  </button>
                </div>
              ) : (
                <input
                  id={fieldId}
                  value={answerValue}
                  onChange={(event) => onAnswerChange(question.id, event.target.value)}
                  placeholder="Type the exact detail AutoM8 should use..."
                />
              )}
            </div>
          );
        })}

        {pickerError ? (
          <p className="clarification-picker-error" role="alert">
            {pickerError}
          </p>
        ) : null}

        <button type="submit" disabled={!canSubmit}>
          {isGenerating ? (
            <LoaderCircle aria-hidden="true" className="spin" size={18} />
          ) : (
            <Sparkles aria-hidden="true" size={18} />
          )}
          {submitLabel}
        </button>
      </form>
    </article>
  );
}

function pickerLabelFor(answerKind: PickerBackedClarificationAnswerKind): string {
  return answerKind === "local_spreadsheet" ? "Choose spreadsheet" : "Choose file";
}

function pickerPlaceholderFor(answerKind: PickerBackedClarificationAnswerKind): string {
  return answerKind === "local_spreadsheet"
    ? "Choose the exact spreadsheet AutoM8 should use..."
    : "Choose the exact file AutoM8 should use...";
}
