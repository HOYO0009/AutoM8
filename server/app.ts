import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createDraftAutomation } from "./automation-builder/draftGenerator.js";
import { createSavedAutomationCandidateStore } from "./automation-builder/savedAutomationCandidateStore.js";
import { createNonDeterministicDesktopTaskRunner } from "./automation-runner/nonDeterministicDesktopTaskRunner.js";
import { createAutomationRunManager } from "./automation-runner/automationRunStore.js";
import { createExecutableActionPlanner } from "./automation-runner/executableActionPlanner.js";
import { createWindowsDesktopDriver } from "./desktop/desktopDriver.js";
import { sendApiError } from "./apiErrorResponse.js";

export function createAutoM8App(env: NodeJS.ProcessEnv = process.env) {
  const app = express();
  const savedAutomationCandidateStore = createSavedAutomationCandidateStore();
  const desktopDriver = createWindowsDesktopDriver();
  const executableActionPlanner = createExecutableActionPlanner({
    apiKey: env.OPENROUTER_API_KEY,
    model: env.OPENROUTER_MODEL,
    baseUrl: env.OPENROUTER_BASE_URL
  });
  const nonDeterministicDesktopTaskRunner = createNonDeterministicDesktopTaskRunner(desktopDriver, {
    apiKey: env.OPENROUTER_API_KEY,
    model: env.OPENROUTER_VISION_MODEL ?? env.OPENROUTER_MODEL,
    baseUrl: env.OPENROUTER_BASE_URL
  });
  const automationRunManager = createAutomationRunManager({
    actionPlanner: executableActionPlanner,
    driver: desktopDriver,
    nonDeterministicTaskRunner: nonDeterministicDesktopTaskRunner
  });

  app.use(express.json({ limit: "64kb" }));

  app.post("/api/draft-automation", async (request, response) => {
    const prompt = typeof request.body?.prompt === "string" ? request.body.prompt : "";

    try {
      const draft = await createDraftAutomation(prompt, {
        apiKey: env.OPENROUTER_API_KEY,
        model: env.OPENROUTER_MODEL,
        baseUrl: env.OPENROUTER_BASE_URL
      });

      response.json({ draft });
    } catch (error) {
      sendApiError(response, error);
    }
  });

  app.get("/api/saved-automations", (_request, response) => {
    response.json({ savedAutomationCandidates: savedAutomationCandidateStore.list() });
  });

  app.post("/api/saved-automations", (request, response) => {
    try {
      const savedAutomationCandidate = savedAutomationCandidateStore.save(request.body?.draft);
      response.status(201).json({
        savedAutomationCandidate,
        savedAutomationCandidates: savedAutomationCandidateStore.list()
      });
    } catch (error) {
      sendApiError(response, error);
    }
  });

  app.post("/api/saved-automations/:id/run", (request, response) => {
    try {
      const savedAutomationCandidate = savedAutomationCandidateStore.get(request.params.id);
      const run = automationRunManager.start(savedAutomationCandidate);
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
      const savedAutomationCandidate = savedAutomationCandidateStore.get(run.automationId);
      response.json({
        run: automationRunManager.approve(request.params.id, request.params.approvalId, savedAutomationCandidate)
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
