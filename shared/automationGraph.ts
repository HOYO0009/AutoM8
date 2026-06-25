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

const metadataLabels: Record<AutomationGraphMetadataKind, string> = {
  inputs: "Inputs",
  outputs: "Outputs",
  fallbacks: "Fallbacks",
  verification: "Verification"
};

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
        metadata: createStepMetadata(step)
      };
    })
  };
}

function createStepMetadata(step: DraftAutomationStep): AutomationGraphMetadata[] {
  return (Object.keys(metadataLabels) as AutomationGraphMetadataKind[]).map((kind) => {
    const values = step.details[kind];

    if (values.length === 0) {
      return {
        kind,
        label: metadataLabels[kind],
        state: "unavailable",
        summary: "Not modeled yet"
      };
    }

    return {
      kind,
      label: metadataLabels[kind],
      state: "available",
      summary: values.join("; ")
    };
  });
}

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return slug || "node";
}
