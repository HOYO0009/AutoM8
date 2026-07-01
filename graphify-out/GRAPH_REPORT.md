# Graph Report - .  (2026-07-01)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 451 nodes · 916 edges · 15 communities (14 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b706bab9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Draft Automation Builder|Draft Automation Builder]]
- [[_COMMUNITY_Documentation And Domain|Documentation And Domain]]
- [[_COMMUNITY_React Workspace UI|React Workspace UI]]
- [[_COMMUNITY_Executable Action Planning|Executable Action Planning]]
- [[_COMMUNITY_Project Configuration|Project Configuration]]
- [[_COMMUNITY_Frontend API Client|Frontend API Client]]
- [[_COMMUNITY_Automation Run State|Automation Run State]]
- [[_COMMUNITY_Non-Deterministic Runner|Non-Deterministic Runner]]
- [[_COMMUNITY_Client TypeScript Config|Client TypeScript Config]]
- [[_COMMUNITY_Server TypeScript Config|Server TypeScript Config]]
- [[_COMMUNITY_Automation Graph Projection|Automation Graph Projection]]
- [[_COMMUNITY_HTML App Shell|HTML App Shell]]
- [[_COMMUNITY_Community 16|Community 16]]

## God Nodes (most connected - your core abstractions)
1. `SavedAutomation` - 21 edges
2. `AutomationRun` - 18 edges
3. `compilerOptions` - 16 edges
4. `DraftAutomation` - 14 edges
5. `requestOpenRouterStructuredOutput()` - 13 edges
6. `AutoM8` - 12 edges
7. `createAutoM8App()` - 10 edges
8. `ExecutableAction` - 10 edges
9. `compilerOptions` - 10 edges
10. `validateExecutableAction()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Saved Automation Prompt Edit` --semantically_similar_to--> `Edit Saved Automation With Prompt`  [INFERRED] [semantically similar]
  DDD.md → documentation/vertical-slices/automation-builder/edit-saved-automation-with-prompt.md
- `Approval Gate` --semantically_similar_to--> `Approval-Gated Run Actions`  [INFERRED] [semantically similar]
  DDD.md → documentation/vertical-slices/automation-runner/approval-gated-run-actions.md
- `Hybrid Runner` --semantically_similar_to--> `Automation Runner`  [INFERRED] [semantically similar]
  DDD.md → documentation/vertical-slices/automation-runner/README.md
- `Non-Deterministic Desktop Task` --semantically_similar_to--> `Run Non-Deterministic Desktop Task`  [INFERRED] [semantically similar]
  DDD.md → documentation/vertical-slices/automation-runner/run-nondeterministic-desktop-task.md
- `Shared OpenRouter Structured-Output Boundary` --semantically_similar_to--> `OpenRouter Structured Outputs`  [INFERRED] [semantically similar]
  PATTERN.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Documentation Foundation** — agents_agent_instructions, readme_autom8, todo_todo, ddd_ddd, pattern_patterns, tdd_tdd [EXTRACTED 1.00]
- **Prompt To Saved Automation Lifecycle** — automation_builder_readme_automation_builder, automation_builder_prompt_to_draft_automation_clarification_gated_draft_automation_creation, automation_builder_save_draft_automation_save_draft_automation, automation_builder_edit_saved_automation_with_prompt_edit_saved_automation_with_prompt, ddd_draft_automation, ddd_saved_automation_candidate [EXTRACTED 1.00]
- **Hybrid Automation Run Lifecycle** — automation_runner_readme_automation_runner, automation_runner_run_saved_automation_run_deterministic_saved_automation, automation_runner_approval_gated_run_actions_approval_gated_run_actions, automation_runner_run_nondeterministic_desktop_task_run_non_deterministic_desktop_task, ddd_executable_action_plan, ddd_hybrid_runner [EXTRACTED 1.00]

## Communities (15 total, 1 thin omitted)

### Community 0 - "Draft Automation Builder"
Cohesion: 0.11
Nodes (23): createSavedAutomationStore(), invalidDraftError(), invalidSavedAutomationStoreError(), isRecord(), loadSavedAutomations(), SaveAutomationError, SavedAutomationStoreConfig, temporaryDirs (+15 more)

### Community 1 - "Documentation And Domain"
Cohesion: 0.05
Nodes (46): Provider Boundary Safety, Edit Saved Automation With Prompt, Latest-Run Context, Clarification-Gated Draft Automation Creation, Automation Builder, Shared Draft Validation Boundary, Save Draft Automation, Approval-Gated Run Actions (+38 more)

### Community 2 - "React Workspace UI"
Cohesion: 0.08
Nodes (32): ClarificationPanel(), DraftPreview(), EmptyPreview(), ApprovalControls(), AutomationRunResult(), formatStatus(), SavedAutomationDetail(), SavedAutomationList() (+24 more)

### Community 3 - "Executable Action Planning"
Cohesion: 0.10
Nodes (31): actionRequiresApproval(), actionText(), createHeuristicExecutableActionPlan(), createModelExecutableActionPlan(), ExecutableActionPlannerConfig, ExecutableActionPlanningError, inferActions(), inferDestination() (+23 more)

### Community 4 - "Project Configuration"
Cohesion: 0.06
Nodes (30): dependencies, dotenv, express, lucide-react, react, react-dom, devDependencies, concurrently (+22 more)

### Community 5 - "Frontend API Client"
Cohesion: 0.13
Nodes (32): ApiClientError, createDraftAutomationCreationResult(), createSavedAutomationEditDraft(), decideAutomationApproval(), deleteSavedAutomation(), fetchAutomationRuns(), fetchSavedAutomations(), isApiErrorResponse() (+24 more)

### Community 6 - "Automation Run State"
Cohesion: 0.06
Nodes (29): createAutomationApproval(), AutomationRunManagerConfig, RunAutomationError, draftStepDetails(), savedAutomation(), executeDesktopAction(), ExecutableActionPlanner, isDecision() (+21 more)

### Community 8 - "Non-Deterministic Runner"
Cohesion: 0.07
Nodes (40): CLARIFICATION_QUESTION_SCHEMA, ConfiguredDraftAutomationCreationConfig, createDraftAutomationCreationResult(), diagnosticFailureTypeForStage(), diagnosticGuidanceForStage(), DRAFT_AUTOMATION_CREATION_RESULT_SCHEMA, DRAFT_AUTOMATION_REPAIR_SCHEMA_SUMMARY, DRAFT_AUTOMATION_SCHEMA (+32 more)

### Community 9 - "Client TypeScript Config"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, lib (+9 more)

### Community 10 - "Server TypeScript Config"
Cohesion: 0.15
Nodes (12): compilerOptions, esModuleInterop, module, moduleResolution, outDir, rootDir, skipLibCheck, strict (+4 more)

### Community 11 - "Automation Graph Projection"
Cohesion: 0.17
Nodes (12): createAutomationRunManager(), createExecutableActionPlanner(), createNonDeterministicDesktopTaskRunner(), createWindowsDesktopDriver(), AutoM8AppConfig, createAutoM8App(), createDefaultAutomationRunManager(), servers (+4 more)

### Community 16 - "Community 16"
Cohesion: 0.07
Nodes (24): Agent Instructions, Commands, Conventions, Documentation, Lean Agentic Documentation Model, Safety, Workflow, DDD (+16 more)

## Knowledge Gaps
- **115 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+110 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SavedAutomation` connect `Frontend API Client` to `Draft Automation Builder`, `React Workspace UI`, `Executable Action Planning`, `Automation Run State`, `Non-Deterministic Runner`, `Automation Graph Projection`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `Lean Agentic Documentation Model` connect `Community 16` to `Documentation And Domain`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `requestOpenRouterStructuredOutput()` connect `Non-Deterministic Runner` to `Executable Action Planning`, `Automation Run State`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _115 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Draft Automation Builder` be split into smaller, more focused modules?**
  _Cohesion score 0.10588235294117647 - nodes in this community are weakly interconnected._
- **Should `Documentation And Domain` be split into smaller, more focused modules?**
  _Cohesion score 0.052597402597402594 - nodes in this community are weakly interconnected._
- **Should `React Workspace UI` be split into smaller, more focused modules?**
  _Cohesion score 0.07627118644067797 - nodes in this community are weakly interconnected._