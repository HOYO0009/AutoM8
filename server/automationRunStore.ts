import { randomUUID } from "node:crypto";

import {
  AutomationApproval,
  AutomationRun,
  AutomationRunLog,
  AutomationStepRun,
  ExecutableAction,
  ExecutableAutomationPlan,
  SavedAutomation
} from "../shared/draftAutomation.js";
import { AdaptiveDesktopExecutor } from "./adaptiveDesktopExecutor.js";
import { DesktopDriver } from "./desktopDriver.js";
import { actionRequiresApproval, ExecutionPlanner } from "./executionPlanner.js";

export class RunAutomationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400
  ) {
    super(message);
    this.name = "RunAutomationError";
  }
}

export interface AutomationRunManagerConfig {
  idFactory?: () => string;
  now?: () => Date;
  planner: ExecutionPlanner;
  driver: DesktopDriver;
  adaptiveExecutor: AdaptiveDesktopExecutor;
}

export function createAutomationRunManager(config: AutomationRunManagerConfig) {
  const runs: AutomationRun[] = [];
  const continuations = new Map<string, Promise<void>>();
  const plans = new Map<string, ExecutableAutomationPlan>();
  const idFactory = config.idFactory ?? randomUUID;
  const now = config.now ?? (() => new Date());

  function stamp(): string {
    return now().toISOString();
  }

  function addRunLog(run: AutomationRun, message: string): void {
    run.logs.push({ at: stamp(), message });
  }

  function addStepLog(step: AutomationStepRun, message: string): void {
    step.logs.push({ at: stamp(), message });
  }

  function findRun(id: string): AutomationRun {
    const run = runs.find((candidate) => candidate.id === id);
    if (!run) {
      throw new RunAutomationError("RUN_NOT_FOUND", "Choose an existing automation run.", 404);
    }

    return run;
  }

  async function executeRun(run: AutomationRun, automation: SavedAutomation, startStepIndex = 0): Promise<void> {
    try {
      if (run.status === "queued") {
        run.status = "running";
      }

      let plan = plans.get(run.id);
      if (!plan) {
        plan = await config.planner.plan(automation);
        plans.set(run.id, plan);
        addRunLog(run, "Created executable action plan.");
      }

      for (let stepIndex = startStepIndex; stepIndex < plan.steps.length; stepIndex += 1) {
        if (run.status === "cancelled") {
          addRunLog(run, "Run was cancelled.");
          return;
        }

        const plannedStep = plan.steps[stepIndex];
        const step = run.steps[stepIndex];
        step.status = "running";
        step.message = "Running desktop actions.";
        addStepLog(step, `Planned ${plannedStep.actions.length} action(s).`);

        for (const action of plannedStep.actions) {
          step.actionType = action.type;

          if (actionRequiresApproval(action)) {
            const approved = run.approvals.some(
              (approval) => approval.stepIndex === stepIndex && approval.status === "approved"
            );
            if (approved) {
              addStepLog(step, `Approval already granted before ${action.type}.`);
              continue;
            }

            const pending = run.approvals.find(
              (approval) => approval.stepIndex === stepIndex && approval.status === "pending"
            );
            if (pending) {
              run.status = "waiting_for_approval";
              step.status = "waiting_for_approval";
              step.message = "Waiting for approval before a side-effect action.";
              return;
            }

            const approval = createApproval(run, stepIndex, step.title, action);
            run.status = "waiting_for_approval";
            step.status = "waiting_for_approval";
            step.message = "Waiting for approval before a side-effect action.";
            addStepLog(step, `Approval required before ${approval.action}.`);
            return;
          }

          const message = await executeAction(action);
          addStepLog(step, message);
        }

        step.status = "completed";
        step.message = "Completed real desktop runner actions.";
      }

      run.status = "completed";
      run.completedAt = stamp();
      addRunLog(run, "Run completed.");
    } catch (error) {
      const activeStep = run.steps.find((step) => step.status === "running" || step.status === "pending");
      const message = error instanceof Error ? error.message : "AutoM8 could not run the automation.";

      if (activeStep) {
        activeStep.status = "failed";
        activeStep.message = message;
        addStepLog(activeStep, message);
      }

      run.status = "failed";
      run.completedAt = stamp();
      addRunLog(run, message);
    }
  }

  async function executeAction(action: ExecutableAction): Promise<string> {
    switch (action.type) {
      case "launch_app":
        return config.driver.launchApp(action.app);
      case "focus_window":
        return config.driver.focusWindow({ app: action.app, title: action.title });
      case "open_url":
        return config.driver.openUrl(action.url);
      case "hotkey":
        return config.driver.pressKey(action.keys);
      case "type_text":
        return config.driver.typeText(action.text);
      case "click":
        return config.driver.click(action.x, action.y);
      case "wait":
        return config.driver.wait(action.ms);
      case "verify_text":
        return config.driver.verifyText(action.text);
      case "llm_desktop_task": {
        const result = await config.adaptiveExecutor.runTask(action);
        if (result.status === "failed") {
          throw new RunAutomationError("ADAPTIVE_STEP_FAILED", result.message, 422);
        }

        return result.logs.length ? `${result.message} ${result.logs.join(" ")}` : result.message;
      }
      case "approval_gate":
        return `Approval gate passed for ${action.action}.`;
    }
  }

  function createApproval(
    run: AutomationRun,
    stepIndex: number,
    title: string,
    action: ExecutableAction
  ): AutomationApproval {
    const approval: AutomationApproval = {
      id: idFactory(),
      stepIndex,
      title,
      action: action.type === "approval_gate" ? action.action : action.type,
      destination: action.type === "approval_gate" ? action.destination : undefined,
      dataSummary: action.type === "approval_gate" ? action.dataSummary : undefined,
      status: "pending"
    };

    run.approvals.push(approval);
    addRunLog(run, `Waiting for approval before ${approval.action}.`);
    return approval;
  }

  function continueRun(run: AutomationRun, automation: SavedAutomation, startStepIndex: number): void {
    const continuation = executeRun(run, automation, startStepIndex).finally(() => {
      continuations.delete(run.id);
    });
    continuations.set(run.id, continuation);
  }

  return {
    list(): AutomationRun[] {
      return runs.map(cloneRun);
    },

    get(id: string): AutomationRun {
      return cloneRun(findRun(id));
    },

    start(automation: SavedAutomation | undefined): AutomationRun {
      if (!automation) {
        throw new RunAutomationError(
          "AUTOMATION_NOT_FOUND",
          "Choose a saved automation before running it.",
          404
        );
      }

      const run: AutomationRun = {
        id: idFactory(),
        automationId: automation.id,
        status: "queued",
        startedAt: stamp(),
        steps: automation.steps.map((step) => ({
          title: step.title,
          nodeType: step.nodeType,
          status: "pending",
          message: "Waiting to run.",
          logs: []
        })),
        approvals: [],
        logs: []
      };

      runs.unshift(run);
      continueRun(run, automation, 0);
      return cloneRun(run);
    },

    approve(runId: string, approvalId: string, automation: SavedAutomation | undefined): AutomationRun {
      if (!automation) {
        throw new RunAutomationError("AUTOMATION_NOT_FOUND", "The saved automation for this run is missing.", 404);
      }

      const run = findRun(runId);
      const approval = run.approvals.find((candidate) => candidate.id === approvalId);
      if (!approval || approval.status !== "pending") {
        throw new RunAutomationError("APPROVAL_NOT_FOUND", "Choose a pending approval before resuming the run.", 404);
      }

      approval.status = "approved";
      approval.resolvedAt = stamp();
      run.status = "running";
      run.steps[approval.stepIndex].status = "running";
      run.steps[approval.stepIndex].message = "Approval granted.";
      addStepLog(run.steps[approval.stepIndex], "User approved the side-effect gate.");
      continueRun(run, automation, approval.stepIndex);
      return cloneRun(run);
    },

    deny(runId: string, approvalId: string): AutomationRun {
      const run = findRun(runId);
      const approval = run.approvals.find((candidate) => candidate.id === approvalId);
      if (!approval || approval.status !== "pending") {
        throw new RunAutomationError("APPROVAL_NOT_FOUND", "Choose a pending approval before denying the run.", 404);
      }

      approval.status = "denied";
      approval.resolvedAt = stamp();
      run.status = "failed";
      run.completedAt = stamp();
      run.steps[approval.stepIndex].status = "failed";
      run.steps[approval.stepIndex].message = "Approval denied.";
      addStepLog(run.steps[approval.stepIndex], "User denied the side-effect gate.");
      addRunLog(run, "Run stopped because approval was denied.");
      return cloneRun(run);
    },

    cancel(runId: string): AutomationRun {
      const run = findRun(runId);
      if (run.status === "completed" || run.status === "failed" || run.status === "cancelled") {
        return cloneRun(run);
      }

      run.status = "cancelled";
      run.completedAt = stamp();
      for (const step of run.steps) {
        if (step.status === "pending" || step.status === "running" || step.status === "waiting_for_approval") {
          step.status = "skipped";
          step.message = "Run cancelled.";
        }
      }
      addRunLog(run, "Run cancelled.");
      return cloneRun(run);
    },

    async whenIdle(runId: string): Promise<void> {
      await continuations.get(runId);
    }
  };
}

function cloneRun(run: AutomationRun): AutomationRun {
  return {
    ...run,
    steps: run.steps.map((step) => ({
      ...step,
      logs: step.logs.map(cloneLog)
    })),
    approvals: run.approvals.map((approval) => ({ ...approval })),
    logs: run.logs.map(cloneLog)
  };
}

function cloneLog(log: AutomationRunLog): AutomationRunLog {
  return { ...log };
}
