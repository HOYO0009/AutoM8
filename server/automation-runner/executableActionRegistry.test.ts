import { describe, expect, it } from "vitest";

import { executableActionTypes } from "../../shared/executableAction.js";
import {
  createExecutableActionJsonSchema,
  ExecutableActionValidationError,
  isNonDeterministicDesktopTaskAction,
  nonDeterministicDesktopTaskActionTypes,
  NON_DETERMINISTIC_DESKTOP_TASK_ACTION_SCHEMA,
  validateExecutableAction
} from "./executableActionRegistry.js";

describe("executable action registry", () => {
  it("builds schema fragments from the canonical action type list", () => {
    const schema = createExecutableActionJsonSchema(executableActionTypes);

    expect(schema.properties.type.enum).toEqual([
      "launch_app",
      "focus_window",
      "open_url",
      "hotkey",
      "type_text",
      "click",
      "wait",
      "verify_text",
      "llm_desktop_task",
      "approval_gate"
    ]);
  });

  it("exposes a bounded non-deterministic desktop action subset", () => {
    const actionSchema = NON_DETERMINISTIC_DESKTOP_TASK_ACTION_SCHEMA.schema.properties.action;

    expect(actionSchema.properties.type.enum).toEqual(nonDeterministicDesktopTaskActionTypes);
    expect(actionSchema.properties.type.enum).not.toContain("launch_app");
    expect(actionSchema.properties.type.enum).not.toContain("llm_desktop_task");
    expect(isNonDeterministicDesktopTaskAction({ type: "click", x: 1, y: 2 })).toBe(true);
    expect(isNonDeterministicDesktopTaskAction({ type: "launch_app", app: "notepad" })).toBe(false);
  });

  it("validates and bounds executable action values", () => {
    expect(
      validateExecutableAction({
        type: "llm_desktop_task",
        goal: "Find the button.",
        maxIterations: 100,
        timeoutMs: 9999999
      })
    ).toEqual({
      type: "llm_desktop_task",
      goal: "Find the button.",
      maxIterations: 10,
      timeoutMs: 300000
    });

    expect(validateExecutableAction({ type: "wait", ms: 60_000 })).toEqual({ type: "wait", ms: 30_000 });
  });

  it("rejects forbidden or incomplete action values with validation stages", () => {
    expect(() => validateExecutableAction({ type: "shell", command: "Remove-Item *" })).toThrow(
      ExecutableActionValidationError
    );
    expect(() => validateExecutableAction({ type: "focus_window" })).toThrow(
      expect.objectContaining({ stage: "action-focus-target" })
    );
  });
});
