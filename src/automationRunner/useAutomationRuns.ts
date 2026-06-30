import { useCallback, useEffect, useMemo, useState } from "react";

import { AutomationRun } from "../../shared/automationRun";
import {
  ApiClientError,
  decideAutomationApproval,
  fetchAutomationRuns,
  runSavedAutomation
} from "../api/autom8Api";

export function useAutomationRuns() {
  const [automationRuns, setAutomationRuns] = useState<AutomationRun[]>([]);
  const [runErrors, setRunErrors] = useState<Record<string, string>>({});
  const [runningAutomationId, setRunningAutomationId] = useState<string | null>(null);

  const hasActiveRun = automationRuns.some((run) =>
    ["queued", "running", "waiting_for_approval"].includes(run.status)
  );
  const latestRunByAutomationId = useMemo(() => {
    return indexLatestRunsByAutomationId(automationRuns);
  }, [automationRuns]);

  const loadAutomationRuns = useCallback(async () => {
    try {
      setAutomationRuns(await fetchAutomationRuns());
    } catch {
      // The next run action will refresh run state.
    }
  }, []);

  useEffect(() => {
    void loadAutomationRuns();
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

  function clearRunsForAutomation(automationId: string) {
    setAutomationRuns((currentRuns) => currentRuns.filter((run) => run.automationId !== automationId));
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
      setAutomationRuns((currentRuns) => upsertAutomationRun(currentRuns, run));
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
      setAutomationRuns((currentRuns) => upsertAutomationRun(currentRuns, run));
    } catch {
      // Polling or a later user action can recover the latest run state.
    }
  }

  return {
    latestRunByAutomationId,
    runErrors,
    runningAutomationId,
    clearRunsForAutomation,
    runAutomation,
    decideApproval
  };
}

function indexLatestRunsByAutomationId(automationRuns: AutomationRun[]): Record<string, AutomationRun> {
  const latestRuns: Record<string, AutomationRun> = {};

  for (const run of automationRuns) {
    if (!latestRuns[run.automationId]) {
      latestRuns[run.automationId] = run;
    }
  }

  return latestRuns;
}

function upsertAutomationRun(currentRuns: AutomationRun[], run: AutomationRun): AutomationRun[] {
  const withoutRun = currentRuns.filter((currentRun) => currentRun.id !== run.id);
  return [run, ...withoutRun];
}
