import { spawn } from "node:child_process";

import {
  isClarificationAnswerKind,
  isPickerBackedClarificationAnswerKind
} from "../../shared/automationDraft.js";
import type { PickerBackedClarificationAnswerKind } from "../../shared/automationDraft.js";

export interface ClarificationAnswerPicker {
  pick(answerKind: PickerBackedClarificationAnswerKind): Promise<string | null>;
}

export class ClarificationAnswerPickerError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400
  ) {
    super(message);
    this.name = "ClarificationAnswerPickerError";
  }
}

export function validatePickerBackedClarificationAnswerKind(
  value: unknown
): PickerBackedClarificationAnswerKind {
  if (!isClarificationAnswerKind(value)) {
    throw new ClarificationAnswerPickerError(
      "INVALID_CLARIFICATION_ANSWER_KIND",
      "Choose a supported clarification answer kind before opening a picker."
    );
  }

  if (!isPickerBackedClarificationAnswerKind(value)) {
    throw new ClarificationAnswerPickerError(
      "CLARIFICATION_PICKER_UNAVAILABLE",
      "Text clarification answers do not have a local picker."
    );
  }

  return value;
}

export function createWindowsClarificationAnswerPicker(): ClarificationAnswerPicker {
  return {
    async pick(answerKind) {
      const output = await runPowerShellFilePicker(filePickerOptionsFor(answerKind));
      return output.trim() || null;
    }
  };
}

function filePickerOptionsFor(answerKind: PickerBackedClarificationAnswerKind): {
  title: string;
  filter: string;
} {
  if (answerKind === "local_spreadsheet") {
    return {
      title: "Choose spreadsheet",
      filter: "Spreadsheet files (*.xlsx;*.xls;*.csv;*.ods)|*.xlsx;*.xls;*.csv;*.ods|All files (*.*)|*.*"
    };
  }

  return {
    title: "Choose file",
    filter: "All files (*.*)|*.*"
  };
}

function runPowerShellFilePicker(payload: { title: string; filter: string }): Promise<string> {
  const script = `
Add-Type -AssemblyName System.Windows.Forms
$payload = [Console]::In.ReadToEnd() | ConvertFrom-Json
$dialog = New-Object System.Windows.Forms.OpenFileDialog
$dialog.Title = $payload.title
$dialog.Filter = $payload.filter
$dialog.CheckFileExists = $true
$dialog.Multiselect = $false
$result = $dialog.ShowDialog()
if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
  $dialog.FileName
}
`;

  return new Promise((resolve, reject) => {
    const child = spawn(
      "powershell.exe",
      ["-NoProfile", "-STA", "-ExecutionPolicy", "Bypass", "-Command", script],
      { stdio: ["pipe", "pipe", "pipe"] }
    );
    const stdoutStream = child.stdout;
    const stderrStream = child.stderr;
    const stdinStream = child.stdin;
    let stdout = "";
    let stderr = "";

    if (!stdoutStream || !stderrStream || !stdinStream) {
      reject(
        new ClarificationAnswerPickerError(
          "CLARIFICATION_PICKER_FAILED",
          "AutoM8 could not open the local file picker.",
          500
        )
      );
      return;
    }

    stdoutStream.setEncoding("utf8");
    stderrStream.setEncoding("utf8");
    stdoutStream.on("data", (chunk) => {
      stdout += chunk;
    });
    stderrStream.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) =>
      reject(
        new ClarificationAnswerPickerError(
          "CLARIFICATION_PICKER_FAILED",
          error.message,
          500
        )
      )
    );
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }

      reject(
        new ClarificationAnswerPickerError(
          "CLARIFICATION_PICKER_FAILED",
          stderr.trim() || `Local file picker failed with exit code ${code}.`,
          500
        )
      );
    });
    stdinStream.end(JSON.stringify(payload));
  });
}
