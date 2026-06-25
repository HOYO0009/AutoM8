import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AutomationRun,
  ClarificationAnswer,
  ClarificationQuestion,
  DraftAutomation,
  SavedAutomationCandidate
} from "../../shared/draftAutomation";
import {
  ApiClientError,
  createDraftAutomationCreationResult,
  decideAutomationApproval,
  fetchAutomationRuns,
  fetchSavedAutomationCandidates,
  runSavedAutomation,
  saveDraftAutomation
} from "../api/autom8Api";

export const examplePrompt =
  "Every morning, open the sales spreadsheet, collect yesterday's total revenue, and draft a short email summary for the team.";

export function useAutomationWorkspace() {
  const [prompt, setPrompt] = useState(examplePrompt);
  const [draft, setDraft] = useState<DraftAutomation | null>(null);
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[]>([]);
  const [clarificationAnswerText, setClarificationAnswerText] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [savedAutomationCandidates, setSavedAutomationCandidates] = useState<SavedAutomationCandidate[]>([]);
  const [automationRuns, setAutomationRuns] = useState<AutomationRun[]>([]);
  const [runErrors, setRunErrors] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [runningAutomationId, setRunningAutomationId] = useState<string | null>(null);

  const hasActiveRun = automationRuns.some((run) =>
    ["queued", "running", "waiting_for_approval"].includes(run.status)
  );
  const trimmedPrompt = prompt.trim();
  const canGenerate = trimmedPrompt.length > 0 && !isGenerating;
  const clarificationAnswers = useMemo<ClarificationAnswer[]>(() => {
    return clarificationQuestions
      .map((question) => ({
        questionId: question.id,
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
  const latestRunByAutomationId = useMemo(() => {
    const latestRuns: Record<string, AutomationRun> = {};

    for (const run of automationRuns) {
      if (!latestRuns[run.automationId]) {
        latestRuns[run.automationId] = run;
      }
    }

    return latestRuns;
  }, [automationRuns]);

  const loadAutomationRuns = useCallback(async () => {
    try {
      setAutomationRuns(await fetchAutomationRuns());
    } catch {
      // The next run action will refresh run state.
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadSavedAutomationCandidates() {
      try {
        const candidates = await fetchSavedAutomationCandidates();
        if (isMounted) {
          setSavedAutomationCandidates(candidates);
        }
      } catch {
        // Saved automations are still available after the next successful save.
      }
    }

    void loadSavedAutomationCandidates();
    void loadAutomationRuns();

    return () => {
      isMounted = false;
    };
  }, [loadAutomationRuns]);

  useEffect(() => {
    if (!hasActiveRun) {
      return;
    }

    const interval = window.setInterval(() => {
      void loadAutomationRuns();
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [hasActiveRun, loadAutomationRuns]);

  function updatePrompt(nextPrompt: string) {
    setPrompt(nextPrompt);
    setDraft(null);
    setClarificationQuestions([]);
    setClarificationAnswerText({});
    setError(null);
    setSaveError(null);
    setSavedNotice(null);
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
    setSaveError(null);
    setSavedNotice(null);

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
          ? generationError.message
          : "AutoM8 could not reach the local draft API."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function saveDraft() {
    if (!draft || isSaving) {
      return null;
    }

    setIsSaving(true);
    setSaveError(null);
    setSavedNotice(null);

    try {
      const payload = await saveDraftAutomation(draft);
      setSavedAutomationCandidates(payload.savedAutomationCandidates);
      setSavedNotice(`Saved "${payload.savedAutomationCandidate.name}".`);
      return payload.savedAutomationCandidate;
    } catch (saveDraftError) {
      setSaveError(
        saveDraftError instanceof ApiClientError
          ? saveDraftError.message
          : "AutoM8 could not reach the local saved automation API."
      );
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function runAutomation(automationId: string) {
    if (runningAutomationId) {
      return;
    }

    setRunningAutomationId(automationId);
    setRunErrors((currentErrors) => {
      const { [automationId]: _clearedError, ...remainingErrors } = currentErrors;
      return remainingErrors;
    });

    try {
      const run = await runSavedAutomation(automationId);
      setAutomationRuns((currentRuns) => upsertRun(currentRuns, run));
    } catch (runError) {
      setRunErrors((currentErrors) => ({
        ...currentErrors,
        [automationId]:
          runError instanceof ApiClientError ? runError.message : "AutoM8 could not reach the local automation runner."
      }));
    } finally {
      setRunningAutomationId(null);
    }
  }

  async function decideApproval(runId: string, approvalId: string, decision: "approve" | "deny") {
    try {
      const run = await decideAutomationApproval(runId, approvalId, decision);
      setAutomationRuns((currentRuns) => upsertRun(currentRuns, run));
    } catch {
      // Polling or a later user action can recover the latest run state.
    }
  }

  return {
    prompt,
    setPrompt: updatePrompt,
    draft,
    clarificationQuestions,
    clarificationAnswerText,
    error,
    saveError,
    savedNotice,
    savedAutomationCandidates,
    latestRunByAutomationId,
    runErrors,
    isGenerating,
    isSaving,
    runningAutomationId,
    canGenerate,
    canSubmitClarifications,
    promptWordCount,
    generateDraft,
    submitClarificationAnswers,
    updateClarificationAnswer,
    saveDraft,
    runAutomation,
    decideApproval
  };
}

function upsertRun(currentRuns: AutomationRun[], run: AutomationRun): AutomationRun[] {
  const withoutRun = currentRuns.filter((currentRun) => currentRun.id !== run.id);
  return [run, ...withoutRun];
}
