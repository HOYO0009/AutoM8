import { randomUUID } from "node:crypto";

import { AutomationRun, SavedAutomation } from "../shared/draftAutomation.js";

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

export interface AutomationRunStoreConfig {
  idFactory?: () => string;
  now?: () => Date;
}

export function createAutomationRunStore(config: AutomationRunStoreConfig = {}) {
  const runs: AutomationRun[] = [];
  const idFactory = config.idFactory ?? randomUUID;
  const now = config.now ?? (() => new Date());

  return {
    list(): AutomationRun[] {
      return runs.map(cloneRun);
    },

    run(automation: SavedAutomation | undefined): AutomationRun {
      if (!automation) {
        throw new RunAutomationError(
          "AUTOMATION_NOT_FOUND",
          "Choose a saved automation before running it.",
          404
        );
      }

      const startedAt = now().toISOString();
      const completedAt = now().toISOString();
      const run: AutomationRun = {
        id: idFactory(),
        automationId: automation.id,
        status: "completed",
        startedAt,
        completedAt,
        steps: automation.steps.map((step) => ({
          title: step.title,
          nodeType: step.nodeType,
          status: "completed",
          message: "Safe MVP runner recorded this step without controlling the desktop."
        }))
      };

      runs.unshift(run);
      return cloneRun(run);
    }
  };
}

function cloneRun(run: AutomationRun): AutomationRun {
  return {
    ...run,
    steps: run.steps.map((step) => ({ ...step }))
  };
}
