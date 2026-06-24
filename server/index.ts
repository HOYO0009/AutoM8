import "dotenv/config";

import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createDraftAutomation, DraftGenerationError } from "./automation-builder/draftGenerator.js";
import { createSavedAutomationCandidateStore, SaveAutomationCandidateError } from "./automation-builder/savedAutomationCandidateStore.js";
import { createNonDeterministicDesktopTaskRunner } from "./automation-runner/nonDeterministicDesktopTaskRunner.js";
import { createAutomationRunManager, RunAutomationError } from "./automation-runner/automationRunStore.js";
import { createExecutableActionPlanner, ExecutableActionPlanningError } from "./automation-runner/executableActionPlanner.js";
import { createWindowsDesktopDriver } from "./desktop/desktopDriver.js";

const app = express();
const port = Number(process.env.PORT ?? 8787);
const savedAutomationCandidateStore = createSavedAutomationCandidateStore();
const desktopDriver = createWindowsDesktopDriver();
const executableActionPlanner = createExecutableActionPlanner({
  apiKey: process.env.OPENROUTER_API_KEY,
  model: process.env.OPENROUTER_MODEL,
  baseUrl: process.env.OPENROUTER_BASE_URL
});
const nonDeterministicDesktopTaskRunner = createNonDeterministicDesktopTaskRunner(desktopDriver, {
  apiKey: process.env.OPENROUTER_API_KEY,
  model: process.env.OPENROUTER_VISION_MODEL ?? process.env.OPENROUTER_MODEL,
  baseUrl: process.env.OPENROUTER_BASE_URL
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
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL,
      baseUrl: process.env.OPENROUTER_BASE_URL
    });

    response.json({ draft });
  } catch (error) {
    const apiError = toApiError(error);
    response.status(apiError.status).json({
      error: {
        code: apiError.code,
        message: apiError.message
      }
    });
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
    const apiError = toApiError(error);
    response.status(apiError.status).json({
      error: {
        code: apiError.code,
        message: apiError.message
      }
    });
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
    const apiError = toApiError(error);
    response.status(apiError.status).json({
      error: {
        code: apiError.code,
        message: apiError.message
      }
    });
  }
});

app.get("/api/automation-runs", (_request, response) => {
  response.json({ runs: automationRunManager.list() });
});

app.get("/api/automation-runs/:id", (request, response) => {
  try {
    response.json({ run: automationRunManager.get(request.params.id) });
  } catch (error) {
    const apiError = toApiError(error);
    response.status(apiError.status).json({
      error: {
        code: apiError.code,
        message: apiError.message
      }
    });
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
    const apiError = toApiError(error);
    response.status(apiError.status).json({
      error: {
        code: apiError.code,
        message: apiError.message
      }
    });
  }
});

app.post("/api/automation-runs/:id/approvals/:approvalId/deny", (request, response) => {
  try {
    response.json({
      run: automationRunManager.deny(request.params.id, request.params.approvalId)
    });
  } catch (error) {
    const apiError = toApiError(error);
    response.status(apiError.status).json({
      error: {
        code: apiError.code,
        message: apiError.message
      }
    });
  }
});

app.post("/api/automation-runs/:id/cancel", (request, response) => {
  try {
    response.json({
      run: automationRunManager.cancel(request.params.id)
    });
  } catch (error) {
    const apiError = toApiError(error);
    response.status(apiError.status).json({
      error: {
        code: apiError.code,
        message: apiError.message
      }
    });
  }
});

if (process.env.NODE_ENV === "production") {
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFile);
  const clientDist = path.resolve(currentDir, "../client");

  app.use(express.static(clientDist));
  app.get(/.*/, (_request, response) => {
    response.sendFile(path.join(clientDist, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`AutoM8 API listening on http://127.0.0.1:${port}`);
});

function toApiError(error: unknown): { code: string; message: string; status: number } {
  if (error instanceof DraftGenerationError) {
    return {
      code: error.code,
      message: error.message,
      status: error.status
    };
  }

  if (error instanceof SaveAutomationCandidateError) {
    return {
      code: error.code,
      message: error.message,
      status: error.status
    };
  }

  if (error instanceof RunAutomationError) {
    return {
      code: error.code,
      message: error.message,
      status: error.status
    };
  }

  if (error instanceof ExecutableActionPlanningError) {
    return {
      code: error.code,
      message: error.message,
      status: error.status
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message: "AutoM8 could not generate a draft automation.",
    status: 500
  };
}
