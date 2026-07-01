import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createDraftAutomationCreationResult } from "./automation-builder/draftAutomationCreation.js";
import {
  SaveAutomationError,
  createSavedAutomationStore
} from "./automation-builder/savedAutomationStore.js";
import { createNonDeterministicDesktopTaskRunner } from "./automation-runner/nonDeterministicDesktopTaskRunner.js";
import { RunAutomationError, createAutomationRunManager } from "./automation-runner/automationRunStore.js";
import { createExecutableActionPlanner } from "./automation-runner/executableActionPlanner.js";
import { createWindowsDesktopDriver } from "./desktop/desktopDriver.js";
import { sendApiError } from "./apiErrorResponse.js";
import { validateClarificationAnswersShape } from "../shared/draftValidation.js";

export interface AutoM8AppConfig {
  savedAutomationStoragePath?: string;
  automationRunManager?: ReturnType<typeof createAutomationRunManager>;
}

export function createAutoM8App(env: NodeJS.ProcessEnv = process.env, config: AutoM8AppConfig = {}) {
  const app = express();
  const savedAutomationStore = createSavedAutomationStore({
    storagePath: config.savedAutomationStoragePath
  });
  const automationRunManager = config.automationRunManager ?? createDefaultAutomationRunManager(env);

  app.use(express.json({ limit: "64kb" }));

  app.post("/api/draft-automation", async (request, response) => {
    const prompt = typeof request.body?.prompt === "string" ? request.body.prompt : "";

    try {
      const clarificationAnswers = validateClarificationAnswersShape(request.body?.clarificationAnswers);
      const creationResult = await createDraftAutomationCreationResult(prompt, clarificationAnswers, {
        "apiKey": env.OPENROUTER_API_KEY,
        model: env.OPENROUTER_MODEL,
        baseUrl: env.OPENROUTER_BASE_URL
      });

      response.json({ creationResult });
    } catch (error) {
      sendApiError(response, error);
    }
  });

  app.get("/api/saved-automations", (_request, response) => {
    response.json({ savedAutomations: savedAutomationStore.list() });
  });

  app.post("/api/saved-automations", (request, response) => {
    try {
      const savedAutomation = savedAutomationStore.save(request.body?.draft);
      response.status(201).json({
        savedAutomation,
        savedAutomations: savedAutomationStore.list()
      });
    } catch (error) {
      sendApiError(response, error);
    }
  });

  app.post("/api/saved-automations/:id/edit-draft", async (request, response) => {
    const prompt = typeof request.body?.prompt === "string" ? request.body.prompt : "";

    try {
      const savedAutomationContext = requireSavedAutomation(
        savedAutomationStore.get(request.params.id)
      );
      const clarificationAnswers = validateClarificationAnswersShape(request.body?.clarificationAnswers);
      const creationResult = await createDraftAutomationCreationResult(
        prompt,
        clarificationAnswers,
        {
          "apiKey": env.OPENROUTER_API_KEY,
          model: env.OPENROUTER_MODEL,
          baseUrl: env.OPENROUTER_BASE_URL
        },
        { savedAutomationContext }
      );

      response.json({ creationResult });
    } catch (error) {
      sendApiError(response, error);
    }
  });

  app.put("/api/saved-automations/:id", (request, response) => {
    try {
      if (automationRunManager.hasActiveRunForAutomation(request.params.id)) {
        throw new RunAutomationError(
          "AUTOMATION_RUN_ACTIVE",
          "Finish or cancel the active run before saving changes to this automation.",
          409
        );
      }

      const savedAutomation = savedAutomationStore.replace(request.params.id, request.body?.draft);
      automationRunManager.clearRunsForAutomation(request.params.id);
      response.json({
        savedAutomation,
        savedAutomations: savedAutomationStore.list()
      });
    } catch (error) {
      sendApiError(response, error);
    }
  });

  app.delete("/api/saved-automations/:id", (request, response) => {
    try {
      if (automationRunManager.hasActiveRunForAutomation(request.params.id)) {
        throw new RunAutomationError(
          "AUTOMATION_RUN_ACTIVE",
          "Finish or cancel the active run before deleting this automation.",
          409
        );
      }

      savedAutomationStore.delete(request.params.id);
      automationRunManager.clearRunsForAutomation(request.params.id);
      response.json({
        savedAutomations: savedAutomationStore.list()
      });
    } catch (error) {
      sendApiError(response, error);
    }
  });

  app.post("/api/saved-automations/:id/run", (request, response) => {
    try {
      const savedAutomation = savedAutomationStore.get(request.params.id);
      const run = automationRunManager.start(savedAutomation);
      response.status(201).json({
        runId: run.id,
        run
      });
    } catch (error) {
      sendApiError(response, error);
    }
  });

  app.get("/api/automation-runs", (_request, response) => {
    response.json({ runs: automationRunManager.list() });
  });

  app.get("/api/automation-runs/:id", (request, response) => {
    try {
      response.json({ run: automationRunManager.get(request.params.id) });
    } catch (error) {
      sendApiError(response, error);
    }
  });

  app.post("/api/automation-runs/:id/approvals/:approvalId/approve", (request, response) => {
    try {
      const run = automationRunManager.get(request.params.id);
      const savedAutomation = savedAutomationStore.get(run.automationId);
      response.json({
        run: automationRunManager.approve(request.params.id, request.params.approvalId, savedAutomation)
      });
    } catch (error) {
      sendApiError(response, error);
    }
  });

  app.post("/api/automation-runs/:id/approvals/:approvalId/deny", (request, response) => {
    try {
      response.json({
        run: automationRunManager.deny(request.params.id, request.params.approvalId)
      });
    } catch (error) {
      sendApiError(response, error);
    }
  });

  app.post("/api/automation-runs/:id/cancel", (request, response) => {
    try {
      response.json({
        run: automationRunManager.cancel(request.params.id)
      });
    } catch (error) {
      sendApiError(response, error);
    }
  });

  if (env.NODE_ENV === "production") {
    const currentFile = fileURLToPath(import.meta.url);
    const currentDir = path.dirname(currentFile);
    const clientDist = path.resolve(currentDir, "../client");

    app.use(express.static(clientDist));
    app.get(/.*/, (_request, response) => {
      response.sendFile(path.join(clientDist, "index.html"));
    });
  }

  return app;
}

function createDefaultAutomationRunManager(env: NodeJS.ProcessEnv): ReturnType<typeof createAutomationRunManager> {
  const desktopDriver = createWindowsDesktopDriver();
  const executableActionPlanner = createExecutableActionPlanner({
    "apiKey": env.OPENROUTER_API_KEY,
    model: env.OPENROUTER_MODEL,
    baseUrl: env.OPENROUTER_BASE_URL
  });
  const nonDeterministicDesktopTaskRunner = createNonDeterministicDesktopTaskRunner(desktopDriver, {
    "apiKey": env.OPENROUTER_API_KEY,
    model: env.OPENROUTER_VISION_MODEL ?? env.OPENROUTER_MODEL,
    baseUrl: env.OPENROUTER_BASE_URL
  });

  return createAutomationRunManager({
    actionPlanner: executableActionPlanner,
    driver: desktopDriver,
    nonDeterministicTaskRunner: nonDeterministicDesktopTaskRunner
  });
}

function requireSavedAutomation<T>(savedAutomation: T | undefined): T {
  if (!savedAutomation) {
    throw new SaveAutomationError(
      "SAVED_AUTOMATION_NOT_FOUND",
      "Choose an existing saved automation before editing.",
      404
    );
  }

  return savedAutomation;
}
