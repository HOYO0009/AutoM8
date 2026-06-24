import { AutomationRun } from "../../shared/draftAutomation";

export function formatStatus(status: AutomationRun["status"]): string {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
