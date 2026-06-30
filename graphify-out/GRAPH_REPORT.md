# Graph Report - AutoM8  (2026-06-30)

## Corpus Check
- 68 files · ~22,026 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 375 nodes · 729 edges · 15 communities (14 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Draft Automation Builder|Draft Automation Builder]]
- [[_COMMUNITY_Documentation And Domain|Documentation And Domain]]
- [[_COMMUNITY_React Workspace UI|React Workspace UI]]
- [[_COMMUNITY_Executable Action Planning|Executable Action Planning]]
- [[_COMMUNITY_Project Configuration|Project Configuration]]
- [[_COMMUNITY_Frontend API Client|Frontend API Client]]
- [[_COMMUNITY_Automation Run State|Automation Run State]]
- [[_COMMUNITY_Desktop Driver Testing|Desktop Driver Testing]]
- [[_COMMUNITY_Non-Deterministic Runner|Non-Deterministic Runner]]
- [[_COMMUNITY_Client TypeScript Config|Client TypeScript Config]]
- [[_COMMUNITY_Server TypeScript Config|Server TypeScript Config]]
- [[_COMMUNITY_Automation Graph Projection|Automation Graph Projection]]
- [[_COMMUNITY_HTML App Shell|HTML App Shell]]

## God Nodes (most connected - your core abstractions)
1. `SavedAutomationCandidate` - 20 edges
2. `AutomationRun` - 17 edges
3. `compilerOptions` - 16 edges
4. `requestOpenRouterStructuredOutput()` - 12 edges
5. `DraftAutomation` - 11 edges
6. `ExecutableAction` - 10 edges
7. `compilerOptions` - 10 edges
8. `validateExecutableAction()` - 9 edges
9. `createDraftAutomationCreationResult()` - 8 edges
10. `AutoM8` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Approval Gate` --semantically_similar_to--> `Approval-Gated Run Actions`  [INFERRED] [semantically similar]
  DDD.md → documentation/vertical-slices/automation-runner/approval-gated-run-actions.md
- `Shared OpenRouter Structured-Output Boundary` --semantically_similar_to--> `OpenRouter Structured Outputs`  [INFERRED] [semantically similar]
  PATTERN.md → README.md
- `Saved Automation Prompt Edit` --semantically_similar_to--> `Edit Saved Automation With Prompt`  [INFERRED] [semantically similar]
  DDD.md → documentation/vertical-slices/automation-builder/edit-saved-automation-with-prompt.md
- `Hybrid Runner` --semantically_similar_to--> `Automation Runner`  [INFERRED] [semantically similar]
  DDD.md → documentation/vertical-slices/automation-runner/README.md
- `Non-Deterministic Desktop Task` --semantically_similar_to--> `Run Non-Deterministic Desktop Task`  [INFERRED] [semantically similar]
  DDD.md → documentation/vertical-slices/automation-runner/run-nondeterministic-desktop-task.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Documentation Foundation** — agents_agent_instructions, readme_autom8, todo_todo, ddd_ddd, pattern_patterns, tdd_tdd [EXTRACTED 1.00]
- **Prompt To Saved Automation Lifecycle** — automation_builder_readme_automation_builder, automation_builder_prompt_to_draft_automation_clarification_gated_draft_automation_creation, automation_builder_save_draft_automation_save_draft_automation, automation_builder_edit_saved_automation_with_prompt_edit_saved_automation_with_prompt, ddd_draft_automation, ddd_saved_automation_candidate [EXTRACTED 1.00]
- **Hybrid Automation Run Lifecycle** — automation_runner_readme_automation_runner, automation_runner_run_saved_automation_run_deterministic_saved_automation, automation_runner_approval_gated_run_actions_approval_gated_run_actions, automation_runner_run_nondeterministic_desktop_task_run_non_deterministic_desktop_task, ddd_executable_action_plan, ddd_hybrid_runner [EXTRACTED 1.00]

## Communities (15 total, 1 thin omitted)

### Community 0 - "Draft Automation Builder"
Cohesion: 0.06
Nodes (45): CLARIFICATION_QUESTION_SCHEMA, createDraftAutomationCreationResult(), DRAFT_AUTOMATION_CREATION_RESULT_SCHEMA, DRAFT_AUTOMATION_SCHEMA, DRAFT_STEP_DETAILS_SCHEMA, DraftAutomationCreationConfig, DraftAutomationCreationContext, DraftAutomationCreationError (+37 more)

### Community 1 - "Documentation And Domain"
Cohesion: 0.06
Nodes (54): Agent Instructions, Lean Agentic Documentation Model, Provider Boundary Safety, Edit Saved Automation With Prompt, Latest-Run Context, Clarification-Gated Draft Automation Creation, Automation Builder, Shared Draft Validation Boundary (+46 more)

### Community 2 - "React Workspace UI"
Cohesion: 0.10
Nodes (20): AutomationBuilderPane(), ClarificationPanel(), DraftPreview(), EmptyPreview(), useAutomationWorkspace(), ApprovalControls(), AutomationRunResult(), formatStatus() (+12 more)

### Community 3 - "Executable Action Planning"
Cohesion: 0.11
Nodes (29): actionRequiresApproval(), actionText(), createHeuristicExecutableActionPlan(), createModelExecutableActionPlan(), ExecutableActionPlannerConfig, inferActions(), inferDestination(), inferTypedText() (+21 more)

### Community 4 - "Project Configuration"
Cohesion: 0.06
Nodes (30): dependencies, dotenv, express, lucide-react, react, react-dom, devDependencies, concurrently (+22 more)

### Community 5 - "Frontend API Client"
Cohesion: 0.15
Nodes (22): ApiClientError, createDraftAutomationCreationResult(), createSavedAutomationEditDraft(), decideAutomationApproval(), fetchAutomationRuns(), fetchSavedAutomationCandidates(), isApiErrorResponse(), replaceSavedAutomation() (+14 more)

### Community 6 - "Automation Run State"
Cohesion: 0.12
Nodes (17): createAutomationApproval(), AutomationRunManagerConfig, draftStepDetails(), savedAutomationCandidate(), executeDesktopAction(), ExecutableActionPlanner, NonDeterministicDesktopTaskResult, NonDeterministicDesktopTaskRunner (+9 more)

### Community 7 - "Desktop Driver Testing"
Cohesion: 0.11
Nodes (12): requestBody(), requestContent(), requestText(), capturePrimaryScreen(), DesktopDriverError, DesktopWindow, mapSendKey(), readRootAccessibilityTree() (+4 more)

### Community 8 - "Non-Deterministic Runner"
Cohesion: 0.15
Nodes (17): isDecision(), isRecord(), NonDeterministicDesktopTaskRunnerConfig, requestNextAction(), DesktopObservation, extractAssistantContent(), isAbortError(), isRecord() (+9 more)

### Community 9 - "Client TypeScript Config"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, lib (+9 more)

### Community 10 - "Server TypeScript Config"
Cohesion: 0.15
Nodes (12): compilerOptions, esModuleInterop, module, moduleResolution, outDir, rootDir, skipLibCheck, strict (+4 more)

### Community 11 - "Automation Graph Projection"
Cohesion: 0.22
Nodes (8): DraftAutomationStep, AutomationGraph, AutomationGraphMetadata, AutomationGraphMetadataKind, AutomationGraphMetadataState, AutomationGraphNode, metadataLabels, AutomationStepRunStatus

## Knowledge Gaps
- **95 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+90 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SavedAutomationCandidate` connect `Frontend API Client` to `Draft Automation Builder`, `React Workspace UI`, `Executable Action Planning`, `Automation Run State`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `AutomationRun` connect `React Workspace UI` to `Automation Graph Projection`, `Frontend API Client`, `Automation Run State`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `DraftAutomation` connect `React Workspace UI` to `Draft Automation Builder`, `Automation Graph Projection`, `Executable Action Planning`, `Frontend API Client`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _95 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Draft Automation Builder` be split into smaller, more focused modules?**
  _Cohesion score 0.05913461538461538 - nodes in this community are weakly interconnected._
- **Should `Documentation And Domain` be split into smaller, more focused modules?**
  _Cohesion score 0.06009783368273934 - nodes in this community are weakly interconnected._
- **Should `React Workspace UI` be split into smaller, more focused modules?**
  _Cohesion score 0.09872241579558652 - nodes in this community are weakly interconnected._