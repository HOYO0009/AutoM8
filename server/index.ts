import "dotenv/config";

import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createDraftAutomation, DraftGenerationError } from "./draftGenerator.js";

const app = express();
const port = Number(process.env.PORT ?? 8787);

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

  return {
    code: "UNKNOWN_ERROR",
    message: "AutoM8 could not generate a draft automation.",
    status: 500
  };
}
