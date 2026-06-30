import { useMemo, useState } from "react";

import {
  ClarificationAnswer,
  ClarificationQuestion,
  DraftAutomation
} from "../../shared/automationDraft";
import { ApiClientError, createDraftAutomationCreationResult } from "../api/autom8Api";

export const examplePrompt =
  "Every morning, open the sales spreadsheet, collect yesterday's total revenue, and draft a short email summary for the team.";

export function useDraftAutomationCreation({
  clearSaveFeedback
}: {
  clearSaveFeedback: () => void;
}) {
  const [prompt, setPrompt] = useState(examplePrompt);
  const [draft, setDraft] = useState<DraftAutomation | null>(null);
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[]>([]);
  const [clarificationAnswerText, setClarificationAnswerText] = useState<Record<string, string>>({});
  const [error, setError] = useState<ApiClientError | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const trimmedPrompt = prompt.trim();
  const canGenerate = trimmedPrompt.length > 0 && !isGenerating;
  const clarificationAnswers = useMemo<ClarificationAnswer[]>(() => {
    return clarificationQuestions
      .map((question) => ({
        questionId: question.id,
        question: question.question,
        reason: question.reason,
        answer: clarificationAnswerText[question.id]?.trim() ?? ""
      }))
      .filter((answer) => answer.answer.length > 0);
  }, [clarificationAnswerText, clarificationQuestions]);
  const canSubmitClarifications =
    clarificationQuestions.length > 0 &&
    clarificationQuestions.every((question) => Boolean(clarificationAnswerText[question.id]?.trim())) &&
    !isGenerating;
  const promptWordCount = useMemo(() => {
    return trimmedPrompt ? trimmedPrompt.split(/\s+/).length : 0;
  }, [trimmedPrompt]);

  function updatePrompt(nextPrompt: string) {
    setPrompt(nextPrompt);
    setDraft(null);
    setClarificationQuestions([]);
    setClarificationAnswerText({});
    setError(null);
    clearSaveFeedback();
  }

  async function generateDraft() {
    if (!canGenerate) {
      return;
    }

    await createDraftAutomationFromPrompt([]);
  }

  async function submitClarificationAnswers() {
    if (!canSubmitClarifications) {
      return;
    }

    await createDraftAutomationFromPrompt(clarificationAnswers);
  }

  function updateClarificationAnswer(questionId: string, answer: string) {
    setClarificationAnswerText((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: answer
    }));
  }

  async function createDraftAutomationFromPrompt(answers: ClarificationAnswer[]) {
    setIsGenerating(true);
    setError(null);
    clearSaveFeedback();

    try {
      const creationResult = await createDraftAutomationCreationResult(trimmedPrompt, answers);

      if (creationResult.status === "needs_clarification") {
        setDraft(null);
        setClarificationQuestions(creationResult.questions);
        setClarificationAnswerText((currentAnswers) => {
          const nextAnswers: Record<string, string> = {};
          for (const question of creationResult.questions) {
            nextAnswers[question.id] = currentAnswers[question.id] ?? "";
          }
          return nextAnswers;
        });
        return;
      }

      setDraft(creationResult.draft);
      setClarificationQuestions([]);
      setClarificationAnswerText({});
    } catch (generationError) {
      setDraft(null);
      setError(
        generationError instanceof ApiClientError
          ? generationError
          : new ApiClientError("AutoM8 could not reach the local draft API.")
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return {
    prompt,
    setPrompt: updatePrompt,
    draft,
    clarificationQuestions,
    clarificationAnswerText,
    error,
    isGenerating,
    canGenerate,
    canSubmitClarifications,
    promptWordCount,
    generateDraft,
    submitClarificationAnswers,
    updateClarificationAnswer
  };
}
