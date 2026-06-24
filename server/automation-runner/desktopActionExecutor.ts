import { ExecutableAction } from "../../shared/draftAutomation.js";
import { DesktopDriver } from "../desktop/desktopDriver.js";

export async function executeDesktopAction(driver: DesktopDriver, action: ExecutableAction): Promise<string> {
  switch (action.type) {
    case "launch_app":
      return driver.launchApp(action.app);
    case "focus_window":
      return driver.focusWindow({ app: action.app, title: action.title });
    case "open_url":
      return driver.openUrl(action.url);
    case "hotkey":
      return driver.pressKey(action.keys);
    case "type_text":
      return driver.typeText(action.text);
    case "click":
      return driver.click(action.x, action.y);
    case "wait":
      return driver.wait(action.ms);
    case "verify_text":
      return driver.verifyText(action.text);
    case "llm_desktop_task":
      throw new Error("The non-deterministic desktop task was not handled.");
    case "approval_gate":
      return `Approval gate passed for ${action.action}.`;
  }
}
