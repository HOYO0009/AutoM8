# Graph Report - AutoM8  (2026-06-24)

## Corpus Check
- 34 files · ~13,773 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 265 nodes · 387 edges · 26 communities (18 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c81988df`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `requestOpenRouterStructuredOutput()` - 12 edges
3. `compilerOptions` - 10 edges
4. `validateAction()` - 8 edges
5. `SavedAutomationCandidate` - 8 edges
6. `scripts` - 7 edges
7. `invalidActionPlanError()` - 7 edges
8. `createDraftAutomation()` - 6 edges
9. `DesktopDriver` - 6 edges
10. `DraftAutomation` - 6 edges

## Surprising Connections (you probably didn't know these)
- `NonDeterministicDesktopTaskResult` --references--> `ExecutableAction`  [EXTRACTED]
  server/automation-runner/nonDeterministicDesktopTaskRunner.ts → shared/draftAutomation.ts
- `createDraftAutomation()` --calls--> `requestOpenRouterStructuredOutput()`  [EXTRACTED]
  server/automation-builder/draftGenerator.ts → server/llm/openRouterStructuredOutput.ts
- `createModelExecutableActionPlan()` --calls--> `requestOpenRouterStructuredOutput()`  [EXTRACTED]
  server/automation-runner/executableActionPlanner.ts → server/llm/openRouterStructuredOutput.ts
- `requestNextAction()` --calls--> `requestOpenRouterStructuredOutput()`  [EXTRACTED]
  server/automation-runner/nonDeterministicDesktopTaskRunner.ts → server/llm/openRouterStructuredOutput.ts
- `AutomationRunManagerConfig` --references--> `ExecutableActionPlanner`  [EXTRACTED]
  server/automation-runner/automationRunStore.ts → server/automation-runner/executableActionPlanner.ts

## Import Cycles
- None detected.

## Communities (26 total, 8 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (30): dependencies, dotenv, express, lucide-react, react, react-dom, devDependencies, concurrently (+22 more)

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (22): ApiErrorResponse, AutomationApproval, AutomationApprovalStatus, AutomationRun, AutomationRunLog, AutomationRunResponse, AutomationRunsResponse, AutomationRunStatus (+14 more)

### Community 2 - "Community 2"
Cohesion: 0.18
Nodes (20): actionRequiresApproval(), actionText(), createExecutableActionPlanner(), createHeuristicExecutableActionPlan(), createModelExecutableActionPlan(), EXECUTABLE_ACTION_PLAN_SCHEMA, ExecutableActionPlannerConfig, inferActions() (+12 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (15): createSavedAutomationCandidateStore(), invalidDraftError(), isRecord(), SaveAutomationCandidateError, SavedAutomationCandidateStoreConfig, validateDraft(), validateStep(), ExecutableActionPlanningError (+7 more)

### Community 4 - "Community 4"
Cohesion: 0.13
Nodes (11): capturePrimaryScreen(), createWindowsDesktopDriver(), DesktopDriverError, DesktopWindow, mapSendKey(), readRootAccessibilityTree(), runPowerShell(), runPowerShellWithJson() (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.17
Nodes (7): AutomationRunManagerConfig, createAutomationRunManager(), RunAutomationError, ExecutableActionPlanner, NonDeterministicDesktopTaskRunner, DesktopDriver, ExecutableActionPlan

### Community 6 - "Community 6"
Cohesion: 0.15
Nodes (12): createNonDeterministicDesktopTaskRunner(), isDecision(), isRecord(), NON_DETERMINISTIC_DESKTOP_TASK_ACTION_SCHEMA, NonDeterministicDesktopTaskResult, NonDeterministicDesktopTaskRunnerConfig, requestNextAction(), requestBody() (+4 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, lib (+9 more)

### Community 8 - "Community 8"
Cohesion: 0.26
Nodes (9): createDraftAutomation(), DRAFT_AUTOMATION_SCHEMA, DraftGenerationError, DraftGeneratorConfig, invalidResponseError(), isRecord(), validateDraftAutomation(), validateStep() (+1 more)

### Community 9 - "Community 9"
Cohesion: 0.26
Nodes (12): extractAssistantContent(), isAbortError(), isRecord(), OpenRouterInvalidStage, OpenRouterMessage, OpenRouterMessageContent, OpenRouterStructuredOutputConfig, OpenRouterStructuredOutputResult (+4 more)

### Community 10 - "Community 10"
Cohesion: 0.15
Nodes (12): compilerOptions, esModuleInterop, module, moduleResolution, outDir, rootDir, skipLibCheck, strict (+4 more)

### Community 11 - "Community 11"
Cohesion: 0.29
Nodes (6): Agent Instructions, Commands, Conventions, Documentation, Safety, Workflow

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (5): DDD, Domain Concepts, Naming Conventions, Open Language Questions, Ubiquitous Language

### Community 13 - "Community 13"
Cohesion: 0.33
Nodes (5): Coverage Map, TDD, Test Commands, Test Pyramid, Testing Notes

### Community 14 - "Community 14"
Cohesion: 0.33
Nodes (5): Completed, In Progress, Module Integrations, Next Vertical Slices, TODO

### Community 15 - "Community 15"
Cohesion: 0.40
Nodes (4): AutoM8, Common Commands, Project Structure, Quick Start

## Knowledge Gaps
- **105 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+100 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `requestOpenRouterStructuredOutput()` connect `Community 9` to `Community 8`, `Community 2`, `Community 6`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `SavedAutomationCandidate` connect `Community 1` to `Community 2`, `Community 3`, `Community 5`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `DraftAutomation` connect `Community 1` to `Community 8`, `Community 2`, `Community 3`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _105 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.10344827586206896 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.12554112554112554 - nodes in this community are weakly interconnected._