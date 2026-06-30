import { LoaderCircle, Sparkles } from "lucide-react";
import { FormEvent } from "react";

import { ClarificationQuestion } from "../../shared/automationDraft";

export function ClarificationPanel({
  questions,
  answerText,
  isGenerating,
  canSubmit,
  onAnswerChange,
  onSubmit,
  description = "AutoM8 needs these facts before it can create a Draft Automation.",
  submitLabel = "Create draft"
}: {
  questions: ClarificationQuestion[];
  answerText: Record<string, string>;
  isGenerating: boolean;
  canSubmit: boolean;
  onAnswerChange: (questionId: string, answer: string) => void;
  onSubmit: () => void;
  description?: string;
  submitLabel?: string;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <article className="clarification-panel" aria-label="Clarification questions">
      <header>
        <p className="eyebrow">Clarification required</p>
        <h2>Answer the missing execution details</h2>
        <p>{description}</p>
      </header>

      <form className="clarification-form" onSubmit={handleSubmit}>
        {questions.map((question) => (
          <label key={question.id} className="clarification-question" htmlFor={`clarification-${question.id}`}>
            <span>{question.question}</span>
            <small>{question.reason}</small>
            <input
              id={`clarification-${question.id}`}
              value={answerText[question.id] ?? ""}
              onChange={(event) => onAnswerChange(question.id, event.target.value)}
              placeholder="Type the exact detail AutoM8 should use..."
            />
          </label>
        ))}

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
