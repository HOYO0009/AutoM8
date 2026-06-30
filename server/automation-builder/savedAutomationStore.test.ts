import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createSavedAutomationStore, SaveAutomationError } from "./savedAutomationStore.js";

const temporaryDirs: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirs) {
    rmSync(directory, { recursive: true, force: true });
  }
  temporaryDirs.length = 0;
});

describe("createSavedAutomationStore", () => {
  it("saves a generated draft with an ID and creation time", () => {
    const storagePath = createTemporaryStoragePath();
    const store = createSavedAutomationStore({
      idFactory: () => "saved-1",
      now: () => new Date("2026-06-24T12:00:00.000Z"),
      storagePath
    });

    const savedAutomation = store.save({
      name: "Send report",
      summary: "Collect the report and email it to the team.",
      steps: [
        {
          title: "Open report",
          nodeType: "deterministic",
          description: "Open the latest report file.",
          details: {
            inputs: ["Latest report file"],
            outputs: ["Report is open"],
            fallbacks: ["Ask the user to locate the report"],
            verification: ["Report title is visible"]
          }
        }
      ]
    });

    expect(savedAutomation).toEqual({
      id: "saved-1",
      createdAt: "2026-06-24T12:00:00.000Z",
      name: "Send report",
      summary: "Collect the report and email it to the team.",
      steps: [
        {
          title: "Open report",
          nodeType: "deterministic",
          description: "Open the latest report file.",
          details: {
            inputs: ["Latest report file"],
            outputs: ["Report is open"],
            fallbacks: ["Ask the user to locate the report"],
            verification: ["Report title is visible"]
          }
        }
      ]
    });
    expect(store.list()).toEqual([savedAutomation]);

    const reloadedStore = createSavedAutomationStore({ storagePath });
    expect(reloadedStore.list()).toEqual([savedAutomation]);
  });

  it("rejects saving when no valid draft is provided", () => {
    const store = createSavedAutomationStore({ storagePath: createTemporaryStoragePath() });

    expect(() => store.save(undefined)).toThrow(SaveAutomationError);
    expect(() => store.save({ name: "Empty", summary: "No steps", steps: [] })).toThrow(
      "Generate a draft automation before saving."
    );
  });

  it("replaces a saved automation draft while preserving its ID and creation time", () => {
    const storagePath = createTemporaryStoragePath();
    const store = createSavedAutomationStore({
      idFactory: () => "saved-1",
      now: () => new Date("2026-06-24T12:00:00.000Z"),
      storagePath
    });
    store.save({
      name: "Send report",
      summary: "Collect the report and email it to the team.",
      steps: [
        {
          title: "Open report",
          nodeType: "deterministic",
          description: "Open the latest report file.",
          details: {
            inputs: ["Latest report file"],
            outputs: ["Report is open"],
            fallbacks: ["Ask the user to locate the report"],
            verification: ["Report title is visible"]
          }
        }
      ]
    });

    const updated = store.replace("saved-1", {
      name: "Send report and Slack update",
      summary: "Collect the report, email the team, and draft a Slack update.",
      steps: [
        {
          title: "Draft Slack update",
          nodeType: "llm",
          description: "Write a short Slack update.",
          details: {
            inputs: ["Report summary"],
            outputs: ["Unsent Slack draft"],
            fallbacks: ["Ask the user for the Slack destination"],
            verification: ["Slack draft remains unsent"]
          }
        }
      ]
    });

    expect(updated).toEqual({
      id: "saved-1",
      createdAt: "2026-06-24T12:00:00.000Z",
      name: "Send report and Slack update",
      summary: "Collect the report, email the team, and draft a Slack update.",
      steps: [
        {
          title: "Draft Slack update",
          nodeType: "llm",
          description: "Write a short Slack update.",
          details: {
            inputs: ["Report summary"],
            outputs: ["Unsent Slack draft"],
            fallbacks: ["Ask the user for the Slack destination"],
            verification: ["Slack draft remains unsent"]
          }
        }
      ]
    });
    expect(store.list()).toEqual([updated]);

    const reloadedStore = createSavedAutomationStore({ storagePath });
    expect(reloadedStore.list()).toEqual([updated]);
  });

  it("rejects replacing an unknown saved automation", () => {
    const store = createSavedAutomationStore({ storagePath: createTemporaryStoragePath() });

    expect(() =>
      store.replace("missing", {
        name: "Updated",
        summary: "Updated automation.",
        steps: [
          {
            title: "Updated step",
            nodeType: "deterministic",
            description: "Do the updated work.",
            details: {
              inputs: ["Input"],
              outputs: ["Output"],
              fallbacks: ["Fallback"],
              verification: ["Verified"]
            }
          }
        ]
      })
    ).toThrow("Choose an existing saved automation before saving changes.");
  });

  it("deletes a saved automation and persists the removal", () => {
    const storagePath = createTemporaryStoragePath();
    const store = createSavedAutomationStore({
      idFactory: sequentialIds("saved-1", "saved-2"),
      now: () => new Date("2026-06-24T12:00:00.000Z"),
      storagePath
    });
    const first = store.save(draftAutomation("Send report"));
    const second = store.save(draftAutomation("Open dashboard"));

    store.delete(first.id);

    expect(store.list()).toEqual([second]);
    expect(createSavedAutomationStore({ storagePath }).list()).toEqual([second]);
  });

  it("rejects deleting an unknown saved automation", () => {
    const store = createSavedAutomationStore({ storagePath: createTemporaryStoragePath() });

    expect(() => store.delete("missing")).toThrow("Choose an existing saved automation before deleting.");
  });

  it("treats a missing storage file as an empty saved automation list", () => {
    const storagePath = createTemporaryStoragePath();

    expect(existsSync(storagePath)).toBe(false);
    expect(createSavedAutomationStore({ storagePath }).list()).toEqual([]);
  });

  it("rejects invalid persisted JSON or shapes without overwriting the file", () => {
    const invalidJsonPath = createTemporaryStoragePath();
    writeFileSync(invalidJsonPath, "{not json", "utf8");

    expect(() => createSavedAutomationStore({ storagePath: invalidJsonPath })).toThrow(
      "The local saved automations file is invalid. Fix or remove it before starting AutoM8."
    );
    expect(readFileSync(invalidJsonPath, "utf8")).toBe("{not json");

    const invalidShapePath = createTemporaryStoragePath();
    const invalidShape = JSON.stringify({
      savedAutomations: [
        {
          id: "",
          createdAt: "2026-06-24T12:00:00.000Z",
          name: "Bad",
          summary: "Bad shape.",
          steps: []
        }
      ]
    });
    writeFileSync(invalidShapePath, invalidShape, "utf8");

    expect(() => createSavedAutomationStore({ storagePath: invalidShapePath })).toThrow(
      "The local saved automations file is invalid. Fix or remove it before starting AutoM8."
    );
    expect(readFileSync(invalidShapePath, "utf8")).toBe(invalidShape);
  });
});

function draftAutomation(name: string) {
  return {
    name,
    summary: `${name} automation.`,
    steps: [
      {
        title: "Run step",
        nodeType: "deterministic" as const,
        description: "Run the deterministic step.",
        details: {
          inputs: ["Input"],
          outputs: ["Output"],
          fallbacks: ["Fallback"],
          verification: ["Verified"]
        }
      }
    ]
  };
}

function createTemporaryStoragePath(): string {
  const directory = mkdtempSync(path.join(tmpdir(), "autom8-saved-"));
  temporaryDirs.push(directory);
  return path.join(directory, "saved-automations.json");
}

function sequentialIds(...ids: string[]): () => string {
  let index = 0;
  return () => ids[index++] ?? `id-${index}`;
}
