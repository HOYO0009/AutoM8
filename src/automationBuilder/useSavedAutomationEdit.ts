import { useMemo, useState } from "react";

import {
  ClarificationAnswer,
  ClarificationQuestion,
  DraftAutomation
} from "../../shared/automationDraft";
import { ApiClientError, createSavedAutomationEditDraft } from "../api/autom8Api";

export function useSavedAutomationEdit({
  clearSaveFeedback
}: {
  clearSaveFeedback: () => void;
}) {
  const [editPrompt, setEditPrompt] = useState("");
  const [editDraft, setEditDraft] = useState<DraftAutomation | null>(null);
  const [editClarificationQuestions, setEditClarificationQuestions] = useState<ClarificationQuestion[]>([]);
  const [editClarificationAnswerText, setEditClarificationAnswerText] = useState<Record<string, string>>({});
  const [editError, setEditError] = useState<ApiClientError | null>(null);
  const [isGeneratingEdit, setIsGeneratingEdit] = useState(false);

  const trimmedEditPrompt = editPrompt.trim();
  const canGenerateEdit = trimmedEditPrompt.length > 0 && !isGeneratingEdit;
  const editClarificationAnswers = useMemo<ClarificationAnswer[]>(() => {
    return editClarificationQuestions
      .map((question) => ({
        questionId: question.id,
        question: question.question,
        reason: question.reason,
        answer: editClarificationAnswerText[question.id]?.trim() ?? ""
      }))
      .filter((answer) => answer.answer.length > 0);
  }, [editClarificationAnswerText, editClarificationQuestions]);
  const canSubmitEditClarifications =
    editClarificationQuestions.length > 0 &&
    editClarificationQuestions.every((question) => Boolean(editClarificationAnswerText[question.id]?.trim())) &&
    !isGeneratingEdit;
  const editPromptWordCount = useMemo(() => {
    return trimmedEditPrompt ? trimmedEditPrompt.split(/\s+/).length : 0;
  }, [trimmedEditPrompt]);

  function updateEditPrompt(nextPrompt: string) {
    setEditPrompt(nextPrompt);
    setEditDraft(null);
    setEditClarificationQuestions([]);
    setEditClarificationAnswerText({});
    setEditError(null);
    clearSaveFeedback();
  }

  function resetEditWorkspace() {
    setEditPrompt("");
    setEditDraft(null);
    setEditClarificationQuestions([]);
    setEditClarificationAnswerText({});
    setEditError(null);
    setIsGeneratingEdit(false);
  }

  async function generateEditDraft(automationId: string) {
    if (!canGenerateEdit) {
      return;
    }

    await createEditDraftFromPrompt(automationId, []);
  }

  async function submitEditClarificationAnswers(automationId: string) {
    if (!canSubmitEditClarifications) {
      return;
    }

    await createEditDraftFromPrompt(automationId, editClarificationAnswers);
  }

  function updateEditClarificationAnswer(questionId: string, answer: string) {
    setEditClarificationAnswerText((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: answer
    }));
  }

  async function createEditDraftFromPrompt(automationId: string, answers: ClarificationAnswer[]) {
    setIsGeneratingEdit(true);
    setEditError(null);
    clearSaveFeedback();

    try {
      const creationResult = await createSavedAutomationEditDraft(automationId, trimmedEditPrompt, answers);

      if (creationResult.status === "needs_clarification") {
        setEditDraft(null);
        setEditClarificationQuestions(creationResult.questions);
        setEditClarificationAnswerText((currentAnswers) => {
          const nextAnswers: Record<string, string> = {};
          for (const question of creationResult.questions) {
            nextAnswers[question.id] = currentAnswers[question.id] ?? "";
          }
          return nextAnswers;
        });
        return;
      }

      setEditDraft(creationResult.draft);
      setEditClarificationQuestions([]);
      setEditClarificationAnswerText({});
    } catch (generationError) {
      setEditDraft(null);
      setEditError(
        generationError instanceof ApiClientError
          ? generationError
          : new ApiClientError("AutoM8 could not reach the local saved automation edit API.")
      );
    } finally {
      setIsGeneratingEdit(false);
    }
  }

  return {
    editPrompt,
    setEditPrompt: updateEditPrompt,
    editDraft,
    editClarificationQuestions,
    editClarificationAnswerText,
    editError,
    isGeneratingEdit,
    canGenerateEdit,
    canSubmitEditClarifications,
    editPromptWordCount,
    generateEditDraft,
    submitEditClarificationAnswers,
    updateEditClarificationAnswer,
    resetEditWorkspace
  };
}
