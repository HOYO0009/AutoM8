import { spawn } from "node:child_process";

export interface DesktopObservation {
  summary: string;
  screenshotDataUrl?: string;
  accessibility?: string;
}

export interface DesktopWindow {
  title: string;
  processName: string;
}

export interface DesktopDriver {
  listApps(): Promise<string[]>;
  listWindows(): Promise<DesktopWindow[]>;
  observeDesktop(): Promise<DesktopObservation>;
  captureWindow(criteria?: { app?: string; title?: string }): Promise<DesktopObservation>;
  readAccessibilityTree(criteria?: { app?: string; title?: string }): Promise<DesktopObservation>;
  launchApp(app: string): Promise<string>;
  focusWindow(criteria: { app?: string; title?: string }): Promise<string>;
  openUrl(url: string): Promise<string>;
  click(x: number, y: number): Promise<string>;
  typeText(text: string): Promise<string>;
  pressKey(keys: string): Promise<string>;
  wait(ms: number): Promise<string>;
  verifyText(text: string): Promise<string>;
}

export class DesktopDriverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DesktopDriverError";
  }
}

export function createWindowsDesktopDriver(): DesktopDriver {
  return {
    async listApps() {
      return ["notepad", "mspaint", "calc", "chrome", "msedge", "explorer"];
    },

    async listWindows() {
      const output = await runPowerShell(`
$windows = Get-Process | Where-Object { $_.MainWindowTitle } | Select-Object ProcessName,MainWindowTitle
$windows | ConvertTo-Json -Compress
`);
      const parsed = parseJson(output);
      const rows = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];

      return rows
        .filter(isWindowRecord)
        .map((row) => ({
          processName: row.ProcessName,
          title: row.MainWindowTitle
        }));
    },

    async observeDesktop() {
      const windows = await this.listWindows();
      const [screenshotDataUrl, accessibility] = await Promise.all([capturePrimaryScreen(), readRootAccessibilityTree()]);
      const summary =
        windows.length > 0
          ? windows.map((window) => `${window.processName}: ${window.title}`).join("\n")
          : "No targetable desktop windows were found.";

      return { summary, screenshotDataUrl, accessibility };
    },

    async captureWindow(criteria) {
      const observation = await this.observeDesktop();
      const target = criteria?.title ?? criteria?.app;
      return {
        summary: target
          ? `Window capture boundary for ${target}.\n${observation.summary}`
          : `Window capture boundary.\n${observation.summary}`,
        screenshotDataUrl: observation.screenshotDataUrl,
        accessibility: observation.accessibility
      };
    },

    async readAccessibilityTree(criteria) {
      const observation = await this.observeDesktop();
      const target = criteria?.title ?? criteria?.app;
      return {
        summary: target
          ? `Accessibility boundary for ${target}.\n${observation.summary}`
          : `Accessibility boundary.\n${observation.summary}`,
        screenshotDataUrl: observation.screenshotDataUrl,
        accessibility: observation.accessibility
      };
    },

    async launchApp(app) {
      assertSafeAppIdentifier(app);
      await runPowerShell(
        `
$payload = [Console]::In.ReadToEnd() | ConvertFrom-Json
Start-Process -FilePath $payload.app
`,
        { app }
      );
      return `Launched ${app}.`;
    },

    async focusWindow(criteria) {
      const title = criteria.title?.trim();
      const app = criteria.app?.trim();
      if (!title && !app) {
        throw new DesktopDriverError("A window title or app name is required before focusing a window.");
      }

      await runPowerShell(
        `
$signature = @"
using System;
using System.Runtime.InteropServices;
public static class Win32Focus {
  [DllImport("user32.dll")]
  public static extern bool SetForegroundWindow(IntPtr hWnd);
}
"@
Add-Type -TypeDefinition $signature -ErrorAction SilentlyContinue | Out-Null
$payload = [Console]::In.ReadToEnd() | ConvertFrom-Json
$process = Get-Process | Where-Object {
  $_.MainWindowHandle -ne 0 -and
  ((-not $payload.title) -or $_.MainWindowTitle -like "*$($payload.title)*") -and
  ((-not $payload.app) -or $_.ProcessName -like "*$($payload.app)*")
} | Select-Object -First 1
if (-not $process) { throw "No matching window was found." }
[Win32Focus]::SetForegroundWindow($process.MainWindowHandle) | Out-Null
`,
        { app, title }
      );

      return `Focused ${title ?? app}.`;
    },

    async openUrl(url) {
      assertSafeUrl(url);
      await runPowerShell(
        `
$payload = [Console]::In.ReadToEnd() | ConvertFrom-Json
Start-Process $payload.url
`,
        { url }
      );
      return `Opened ${url}.`;
    },

    async click(x, y) {
      assertFiniteCoordinate(x, "x");
      assertFiniteCoordinate(y, "y");
      await runPowerShell(
        `
$signature = @"
using System;
using System.Runtime.InteropServices;
public static class Win32Mouse {
  [DllImport("user32.dll")]
  public static extern bool SetCursorPos(int X, int Y);
  [DllImport("user32.dll")]
  public static extern void mouse_event(uint flags, uint dx, uint dy, uint data, UIntPtr extraInfo);
}
"@
Add-Type -TypeDefinition $signature -ErrorAction SilentlyContinue | Out-Null
$payload = [Console]::In.ReadToEnd() | ConvertFrom-Json
[Win32Mouse]::SetCursorPos([int]$payload.x, [int]$payload.y) | Out-Null
[Win32Mouse]::mouse_event(0x0002, 0, 0, 0, [UIntPtr]::Zero)
[Win32Mouse]::mouse_event(0x0004, 0, 0, 0, [UIntPtr]::Zero)
`,
        { x, y }
      );
      return `Clicked at ${x}, ${y}.`;
    },

    async typeText(text) {
      await sendKeys(escapeSendKeysText(text));
      return `Typed ${text.length} characters.`;
    },

    async pressKey(keys) {
      const sendKeys = toSendKeys(keys);
      await sendKeysInput(sendKeys);
      return `Pressed ${keys}.`;
    },

    async wait(ms) {
      const boundedMs = Math.max(0, Math.min(ms, 30_000));
      await new Promise((resolve) => setTimeout(resolve, boundedMs));
      return `Waited ${boundedMs}ms.`;
    },

    async verifyText(text) {
      const observation = await this.observeDesktop();
      if (!observation.summary.toLowerCase().includes(text.toLowerCase())) {
        throw new DesktopDriverError(`Could not verify "${text}" in the current desktop state.`);
      }

      return `Verified "${text}" in desktop state.`;
    }
  };
}

async function sendKeys(keys: string): Promise<void> {
  await sendKeysInput(keys);
}

async function sendKeysInput(keys: string): Promise<void> {
  await runPowerShell(
    `
Add-Type -AssemblyName System.Windows.Forms
$payload = [Console]::In.ReadToEnd() | ConvertFrom-Json
[System.Windows.Forms.SendKeys]::SendWait($payload.keys)
`,
    { keys }
  );
}

function runPowerShell(script: string, payload?: unknown): Promise<string> {
  return new Promise((resolve, reject) => {
    const hasPayload = arguments.length > 1;
    const child = spawn(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script],
      { stdio: [hasPayload ? "pipe" : "ignore", "pipe", "pipe"] }
    );
    const stdoutStream = child.stdout;
    const stderrStream = child.stderr;
    const stdinStream = child.stdin;
    let stdout = "";
    let stderr = "";

    if (!stdoutStream || !stderrStream || (hasPayload && !stdinStream)) {
      reject(new DesktopDriverError("Could not open Windows desktop action process streams."));
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
    child.on("error", (error) => reject(new DesktopDriverError(error.message)));
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }

      reject(new DesktopDriverError(stderr.trim() || `Windows desktop action failed with exit code ${code}.`));
    });
    if (hasPayload && stdinStream) {
      stdinStream.end(JSON.stringify(payload));
    }
  });
}

async function capturePrimaryScreen(): Promise<string> {
  const output = await runPowerShell(`
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$stream = New-Object System.IO.MemoryStream
try {
  $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
  $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
  "data:image/png;base64,$([Convert]::ToBase64String($stream.ToArray()))"
} finally {
  $stream.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}
`);

  return output.trim();
}

async function readRootAccessibilityTree(): Promise<string> {
  return runPowerShell(`
Add-Type -AssemblyName UIAutomationClient
$root = [System.Windows.Automation.AutomationElement]::RootElement
$condition = [System.Windows.Automation.Condition]::TrueCondition
$items = $root.FindAll([System.Windows.Automation.TreeScope]::Children, $condition)
$lines = New-Object System.Collections.Generic.List[string]
$limit = 80
foreach ($item in $items) {
  if ($lines.Count -ge $limit) { break }
  $name = $item.Current.Name
  $type = $item.Current.ControlType.ProgrammaticName -replace '^ControlType\\.', ''
  $enabled = $item.Current.IsEnabled
  if ($name -or $type) {
    $lines.Add("$type: $name enabled=$enabled")
  }
  $children = $item.FindAll([System.Windows.Automation.TreeScope]::Children, $condition)
  foreach ($child in $children) {
    if ($lines.Count -ge $limit) { break }
    $childName = $child.Current.Name
    $childType = $child.Current.ControlType.ProgrammaticName -replace '^ControlType\\.', ''
    $childEnabled = $child.Current.IsEnabled
    if ($childName -or $childType) {
      $lines.Add("  $childType: $childName enabled=$childEnabled")
    }
  }
}
$lines -join [Environment]::NewLine
`);
}

function assertSafeAppIdentifier(app: string): void {
  if (!/^[a-zA-Z0-9 ._-]{1,80}$/.test(app)) {
    throw new DesktopDriverError("App launch identifiers must be simple app names, not paths or commands.");
  }
}

function assertSafeUrl(url: string): void {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("Unsupported protocol");
    }
  } catch {
    throw new DesktopDriverError("Only http and https URLs can be opened by the desktop runner.");
  }
}

function assertFiniteCoordinate(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 100_000) {
    throw new DesktopDriverError(`Click ${label} coordinate is outside the allowed range.`);
  }
}

function escapeSendKeysText(text: string): string {
  return text.replace(/[+^%~(){}\[\]]/g, (character) => `{${character}}`);
}

function toSendKeys(keys: string): string {
  const normalized = keys.trim().toLowerCase();
  const parts = normalized.split("+").map((part) => part.trim()).filter(Boolean);
  const key = parts.at(-1);
  if (!key) {
    throw new DesktopDriverError("Hotkey requires at least one key.");
  }

  const modifiers = parts.slice(0, -1).map((part) => {
    if (part === "ctrl" || part === "control" || part === "control_l") return "^";
    if (part === "alt" || part === "alt_l") return "%";
    if (part === "shift" || part === "shift_l") return "+";
    throw new DesktopDriverError(`Unsupported hotkey modifier "${part}".`);
  });

  const mappedKey = mapSendKey(key);
  return `${modifiers.join("")}${mappedKey}`;
}

function mapSendKey(key: string): string {
  const namedKeys: Record<string, string> = {
    enter: "{ENTER}",
    return: "{ENTER}",
    tab: "{TAB}",
    escape: "{ESC}",
    esc: "{ESC}",
    delete: "{DELETE}",
    backspace: "{BACKSPACE}",
    up: "{UP}",
    down: "{DOWN}",
    left: "{LEFT}",
    right: "{RIGHT}",
    f1: "{F1}",
    f2: "{F2}",
    f3: "{F3}",
    f4: "{F4}",
    f5: "{F5}",
    f6: "{F6}",
    f7: "{F7}",
    f8: "{F8}",
    f9: "{F9}",
    f10: "{F10}",
    f11: "{F11}",
    f12: "{F12}"
  };

  if (namedKeys[key]) {
    return namedKeys[key];
  }

  if (/^[a-z0-9]$/.test(key)) {
    return key;
  }

  throw new DesktopDriverError(`Unsupported hotkey key "${key}".`);
}

function parseJson(value: string): unknown {
  if (!value.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function isWindowRecord(value: unknown): value is { ProcessName: string; MainWindowTitle: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "ProcessName" in value &&
    typeof value.ProcessName === "string" &&
    "MainWindowTitle" in value &&
    typeof value.MainWindowTitle === "string"
  );
}
