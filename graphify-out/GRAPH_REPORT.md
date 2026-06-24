# Graph Report - AutoM8  (2026-06-24)

## Corpus Check
- 43 files · ~34,279 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 201 nodes · 258 edges · 36 communities detected
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

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
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]

## God Nodes (most connected - your core abstractions)
1. `requestOpenRouterStructuredOutput()` - 9 edges
2. `createAutoM8App()` - 6 edges
3. `validateExecutableAction()` - 6 edges
4. `Agent Instructions` - 6 edges
5. `invalidActionPlanError()` - 5 edges
6. `DDD` - 5 edges
7. `TDD` - 5 edges
8. `TODO` - 5 edges
9. `createDraftAutomation()` - 4 edges
10. `validateDraftAutomation()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `createAutoM8App()` --calls--> `createSavedAutomationCandidateStore()`  [INFERRED]
  server\app.ts → server\automation-builder\savedAutomationCandidateStore.ts
- `createAutoM8App()` --calls--> `createWindowsDesktopDriver()`  [INFERRED]
  server\app.ts → server\desktop\desktopDriver.ts
- `createAutoM8App()` --calls--> `createExecutableActionPlanner()`  [INFERRED]
  server\app.ts → server\automation-runner\executableActionPlanner.ts
- `createAutoM8App()` --calls--> `createNonDeterministicDesktopTaskRunner()`  [INFERRED]
  server\app.ts → server\automation-runner\nonDeterministicDesktopTaskRunner.ts
- `createAutoM8App()` --calls--> `createAutomationRunManager()`  [INFERRED]
  server\app.ts → server\automation-runner\automationRunStore.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (4): RunAutomationError, isDecision(), isRecord(), requestNextAction()

### Community 1 - "Community 1"
Cohesion: 0.15
Nodes (6): ExecutableActionValidationError, isRecord(), optionalString(), requireNumber(), requireString(), validateExecutableAction()

### Community 2 - "Community 2"
Cohesion: 0.18
Nodes (13): actionRequiresApproval(), actionText(), createModelExecutableActionPlan(), ExecutableActionPlanningError, inferActions(), inferDestination(), inferTypedText(), inferUrl() (+5 more)

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (11): sendApiError(), toApiError(), createAutoM8App(), createAutomationRunManager(), createWindowsDesktopDriver(), createExecutableActionPlanner(), createNonDeterministicDesktopTaskRunner(), createSavedAutomationCandidateStore() (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.23
Nodes (11): createDraftAutomation(), DraftGenerationError, invalidResponseError(), validateDraftAutomation(), extractAssistantContent(), isAbortError(), isRecord(), providerErrorMessage() (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.17
Nodes (8): capturePrimaryScreen(), DesktopDriverError, mapSendKey(), readRootAccessibilityTree(), runPowerShell(), sendKeys(), sendKeysInput(), toSendKeys()

### Community 6 - "Community 6"
Cohesion: 0.22
Nodes (4): ApiClientError, isApiErrorResponse(), requestJson(), saveDraftAutomation()

### Community 7 - "Community 7"
Cohesion: 0.27
Nodes (5): DraftValidationError, isDraftNodeType(), isRecord(), validateDraftAutomationShape(), validateDraftAutomationStep()

### Community 8 - "Community 8"
Cohesion: 0.29
Nodes (6): Agent Instructions, Commands, Conventions, Documentation, Safety, Workflow

### Community 9 - "Community 9"
Cohesion: 0.47
Nodes (3): requestBody(), requestContent(), requestText()

### Community 10 - "Community 10"
Cohesion: 0.33
Nodes (5): DDD, Domain Concepts, Naming Conventions, Open Language Questions, Ubiquitous Language

### Community 11 - "Community 11"
Cohesion: 0.33
Nodes (5): Coverage Map, TDD, Test Commands, Test Pyramid, Testing Notes

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (5): Completed, In Progress, Module Integrations, Next Vertical Slices, TODO

### Community 13 - "Community 13"
Cohesion: 0.4
Nodes (4): AutoM8, Common Commands, Project Structure, Quick Start

### Community 14 - "Community 14"
Cohesion: 0.67
Nodes (0): 

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (1): Patterns

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (1): Automation Builder

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (1): Prompt-To-Draft Automation

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (1): Save Draft Automation

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (1): Automation Runner

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (1): Approval-Gated Run Actions

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (1): Run Non-Deterministic Desktop Task

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (1): Run Deterministic Saved Automation

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **28 isolated node(s):** `Workflow`, `Documentation`, `Conventions`, `Safety`, `Commands` (+23 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 15`** (2 nodes): `handleSubmit()`, `AutomationBuilderPane.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (2 nodes): `formatStatus.ts`, `formatStatus()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (2 nodes): `SavedAutomationCandidateList.tsx`, `Boolean()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (2 nodes): `PATTERN.md`, `Patterns`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (2 nodes): `README.md`, `Automation Builder`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (2 nodes): `prompt-to-draft-automation.md`, `Prompt-To-Draft Automation`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (2 nodes): `save-draft-automation.md`, `Save Draft Automation`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (2 nodes): `README.md`, `Automation Runner`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (2 nodes): `approval-gated-run-actions.md`, `Approval-Gated Run Actions`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (2 nodes): `run-nondeterministic-desktop-task.md`, `Run Non-Deterministic Desktop Task`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (2 nodes): `run-saved-automation.md`, `Run Deterministic Saved Automation`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `vitest.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `App.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (1 nodes): `main.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (1 nodes): `DraftPreview.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `EmptyPreview.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `ApprovalControls.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (1 nodes): `AutomationRunResult.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `NodeGraphViewer.test.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `NodeGraphViewer.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Are the 3 inferred relationships involving `requestOpenRouterStructuredOutput()` (e.g. with `createDraftAutomation()` and `createModelExecutableActionPlan()`) actually correct?**
  _`requestOpenRouterStructuredOutput()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `createAutoM8App()` (e.g. with `createSavedAutomationCandidateStore()` and `createWindowsDesktopDriver()`) actually correct?**
  _`createAutoM8App()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Workflow`, `Documentation`, `Conventions` to the rest of the system?**
  _28 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._