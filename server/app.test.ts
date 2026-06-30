import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { once } from "node:events";
import { Server } from "node:http";

import { afterEach, describe, expect, it, vi } from "vitest";

import { createAutoM8App, AutoM8AppConfig } from "./app.js";
import { SavedAutomation } from "../shared/automationDraft.js";

const temporaryDirs: string[] = [];
const servers: Server[] = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        })
    )
  );

  for (const directory of temporaryDirs) {
    rmSync(directory, { recursive: true, force: true });
  }
  temporaryDirs.length = 0;
});

describe("saved automations API", () => {
  it("returns saved automations loaded from local storage", async () => {
    const storagePath = createTemporaryStoragePath();
    const savedAutomation = savedAutomationFixture("saved-1", "Morning Revenue");
    writeSavedAutomations(storagePath, [savedAutomation]);
    const baseUrl = await startApp(storagePath);

    const response = await fetch(`${baseUrl}/api/saved-automations`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      savedAutomations: [savedAutomation]
    });
  });

  it("deletes a saved automation and returns the refreshed list", async () => {
    const storagePath = createTemporaryStoragePath();
    const keptAutomation = savedAutomationFixture("saved-2", "Weekly Report");
    writeSavedAutomations(storagePath, [savedAutomationFixture("saved-1", "Morning Revenue"), keptAutomation]);
    const baseUrl = await startApp(storagePath);

    const response = await fetch(`${baseUrl}/api/saved-automations/saved-1`, {
      method: "DELETE"
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      savedAutomations: [keptAutomation]
    });
    expect(JSON.parse(readFileSync(storagePath, "utf8"))).toEqual({
      savedAutomations: [keptAutomation]
    });
  });

  it("rejects deleting a saved automation with an active run", async () => {
    const storagePath = createTemporaryStoragePath();
    const savedAutomation = savedAutomationFixture("saved-1", "Morning Revenue");
    writeSavedAutomations(storagePath, [savedAutomation]);
    const clearRunsForAutomation = vi.fn();
    const baseUrl = await startApp(storagePath, {
      automationRunManager: fakeAutomationRunManager({
        hasActiveRunForAutomation: () => true,
        clearRunsForAutomation
      })
    });

    const response = await fetch(`${baseUrl}/api/saved-automations/saved-1`, {
      method: "DELETE"
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "AUTOMATION_RUN_ACTIVE",
        message: "Finish or cancel the active run before deleting this automation."
      }
    });
    expect(clearRunsForAutomation).not.toHaveBeenCalled();
    expect(JSON.parse(readFileSync(storagePath, "utf8"))).toEqual({
      savedAutomations: [savedAutomation]
    });
  });
});

async function startApp(storagePath: string, config: AutoM8AppConfig = {}): Promise<string> {
  const app = createAutoM8App(
    { NODE_ENV: "test" },
    {
      ...config,
      savedAutomationStoragePath: storagePath
    }
  );
  const server = app.listen(0);
  servers.push(server);
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

function createTemporaryStoragePath(): string {
  const directory = mkdtempSync(path.join(tmpdir(), "autom8-api-"));
  temporaryDirs.push(directory);
  return path.join(directory, "saved-automations.json");
}

function writeSavedAutomations(storagePath: string, savedAutomations: SavedAutomation[]): void {
  writeFileSync(storagePath, `${JSON.stringify({ savedAutomations }, null, 2)}\n`, "utf8");
}

function savedAutomationFixture(id: string, name: string): SavedAutomation {
  return {
    id,
    createdAt: "2026-06-24T12:00:00.000Z",
    name,
    summary: `${name} automation.`,
    steps: [
      {
        title: "Open report",
        nodeType: "deterministic",
        description: "Open the report.",
        details: {
          inputs: ["Report"],
          outputs: ["Open report"],
          fallbacks: ["Ask for report"],
          verification: ["Report is visible"]
        }
      }
    ]
  };
}

function fakeAutomationRunManager(
  overrides: Partial<NonNullable<AutoM8AppConfig["automationRunManager"]>> = {}
): NonNullable<AutoM8AppConfig["automationRunManager"]> {
  return {
    list: () => [],
    hasActiveRunForAutomation: () => false,
    clearRunsForAutomation: () => undefined,
    get: vi.fn(),
    start: vi.fn(),
    approve: vi.fn(),
    deny: vi.fn(),
    cancel: vi.fn(),
    whenIdle: vi.fn(),
    ...overrides
  } as NonNullable<AutoM8AppConfig["automationRunManager"]>;
}
