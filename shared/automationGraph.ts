import { DraftAutomation, DraftAutomationStep } from "./automationDraft.js";
import { AutomationRun, AutomationStepRunStatus } from "./automationRun.js";

export type AutomationGraphMetadataState = "available" | "unavailable";
export type AutomationGraphMetadataKind = "inputs" | "outputs" | "fallbacks" | "verification";

export interface AutomationGraphMetadata {
  kind: AutomationGraphMetadataKind;
  label: string;
  state: AutomationGraphMetadataState;
  summary: string;
}

export interface AutomationGraphNode {
  id: string;
  order: number;
  title: string;
  nodeType: DraftAutomationStep["nodeType"];
  description: string;
  runStatus?: AutomationStepRunStatus;
  actionType?: string;
  metadata: AutomationGraphMetadata[];
}

export interface AutomationGraph {
  name: string;
  summary: string;
  nodes: AutomationGraphNode[];
}

const unavailableMetadata: AutomationGraphMetadata[] = [
  {
    kind: "inputs",
    label: "Inputs",
    state: "unavailable",
    summary: "Not modeled yet"
  },
  {
    kind: "outputs",
    label: "Outputs",
    state: "unavailable",
    summary: "Not modeled yet"
  },
  {
    kind: "fallbacks",
    label: "Fallbacks",
    state: "unavailable",
    summary: "Not modeled yet"
  },
  {
    kind: "verification",
    label: "Verification",
    state: "unavailable",
    summary: "Not modeled yet"
  }
];

export function createAutomationGraph(automation: DraftAutomation, latestRun?: AutomationRun): AutomationGraph {
  return {
    name: automation.name,
    summary: automation.summary,
    nodes: automation.steps.map((step, index) => {
      const runStep = latestRun?.steps[index];

      return {
        id: `${index + 1}-${slugify(step.title)}`,
        order: index + 1,
        title: step.title,
        nodeType: step.nodeType,
        description: step.description,
        runStatus: runStep?.status,
        actionType: runStep?.actionType,
        metadata: unavailableMetadata.map((item) => ({ ...item }))
      };
    })
  };
}

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return slug || "node";
}
