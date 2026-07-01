# TDD

Purpose:
Track test strategy, coverage confidence, and test pyramid balance across vertical slices and modules.

## Test Commands

| Command | Purpose |
|---|---|
| `npm run test` | Run focused Vitest checks. |
| `npm run build` | Type-check the server and build the client. |

## Test Pyramid

| Level | Intended use | Current balance | Notes |
|---|---|---|---|
| Unit | Pure logic and edge cases | Used | Current coverage focuses on backend module logic, shared validation/projection, and small React render checks. |
| Integration | Public interfaces and real code paths | Preferred default | Use for vertical slices when behavior crosses module boundaries. |
| Contract/API | External or internal service boundaries | Limited | Structured LLM boundary behavior is covered with mocked provider responses. |
| E2E | Critical user journeys only | Unknown | No dedicated browser or desktop E2E suite is currently documented. |
| Manual | Temporary fallback when automation is impractical | Unknown | Use only when desktop or provider behavior cannot be automated locally. |

## Coverage Map

| Area | Slice/module reference | Test level | Evidence | Doubles/mocks | Gap or next action |
|---|---|---|---|---|---|
| Automation Builder Draft Automation Creation | `documentation/vertical-slices/automation-builder/prompt-to-draft-automation.md` | Unit / contract boundary / component render | `server/automation-builder/draftAutomationCreation.test.ts`, `server/apiErrorResponse.test.ts`, `shared/draftValidation.test.ts`, `src/api/autom8Api.test.ts`, `src/automationBuilder/AutomationBuilderPane.test.tsx` cover full Clarification Answer context, malformed continuation rejection, invalid-shape and invalid-semantic repair success/failure, screenshot-style meta-node rejection, ordered trigger/source/extract/draft steps, typed Clarification Questions, and safe diagnostics. | Mocked structured-output provider response and mocked browser `fetch` | Add API integration coverage if clarification sessions become server-stateful. |
| Automation Builder picker-backed Clarification Answers | `documentation/vertical-slices/automation-builder/picker-backed-clarification-answers.md` | Unit / API integration / component render | `shared/draftValidation.test.ts`, `server/automation-builder/draftAutomationCreation.test.ts`, `server/app.test.ts`, `src/api/autom8Api.test.ts`, `src/automationBuilder/ClarificationPanel.test.tsx` cover answer-kind validation, provider schema enum, picker success/cancel/invalid-kind API paths, frontend picker request handling, and picker-backed panel rendering. | Injected picker service and mocked browser `fetch` | Add browser interaction coverage when an E2E harness is introduced. |
| Shared draft validation | Automation Builder / shared boundary | Unit | `shared/draftValidation.test.ts` | None | Add storage-format validation coverage if saved automation persistence gains schema versions or imports. |
| Automation Builder Clarification Panel | `documentation/vertical-slices/automation-builder/prompt-to-draft-automation.md` | Component render | `src/automationBuilder/ClarificationPanel.test.tsx` | None | Add browser interaction coverage when answer controls move beyond text fields. |
| Automation Builder saved automations | `documentation/vertical-slices/automation-builder/save-draft-automation.md` | Unit / API integration / component render | `server/automation-builder/savedAutomationStore.test.ts`, `server/app.test.ts`, `src/api/autom8Api.test.ts`, `src/automationRunner/SavedAutomationList.test.tsx` cover local JSON persistence across store creation, invalid persisted file rejection, deletion, refreshed API lists, active-run delete rejection, and focused detail delete rendering. | Temporary filesystem paths, local ephemeral HTTP server, mocked browser `fetch` | Add browser interaction coverage when an E2E harness is introduced. |
| Automation Builder Saved Automation Prompt Edit | `documentation/vertical-slices/automation-builder/edit-saved-automation-with-prompt.md` | Unit / contract boundary / component render | `server/automation-builder/draftAutomationCreation.test.ts`, `server/automation-builder/savedAutomationStore.test.ts`, `server/automation-runner/automationRunStore.test.ts`, `src/api/autom8Api.test.ts`, `src/automationRunner/SavedAutomationList.test.tsx` | Mocked structured-output provider response and mocked browser `fetch` | Add browser interaction coverage when an E2E harness is introduced. |
| Automation Builder saved automation sidebar | `documentation/vertical-slices/automation-builder/save-draft-automation.md` | Component render | `src/automationRunner/SavedAutomationList.test.tsx`, `src/App.test.tsx` | None | Add browser interaction coverage if sidebar selection becomes more complex. |
| Node Graph Viewer graph inspection | `documentation/vertical-slices/node-graph-viewer/inspect-automation-graph.md` | Unit / component render | `shared/automationGraph.test.ts`, `src/nodeGraphViewer/NodeGraphViewer.test.tsx` | None | Add browser interaction coverage if the viewer becomes editable or interactive. |
| Automation Runner deterministic action planning | `documentation/vertical-slices/automation-runner/run-saved-automation.md` | Unit / contract boundary | `server/automation-runner/executableActionPlanner.test.ts` | Mocked structured-output provider response | Add runner API integration coverage around saved automation execution. |
| Automation Runner executable action registry | `documentation/vertical-slices/automation-runner/run-saved-automation.md` | Unit | `server/automation-runner/executableActionRegistry.test.ts` | None | Add coverage when new action types are added to ensure schemas, validation, and runner execution stay aligned. |
| Automation Runner run state and approvals | `documentation/vertical-slices/automation-runner/approval-gated-run-actions.md` | Unit | `server/automation-runner/automationRunStore.test.ts`, `server/automation-runner/executableActionPlanner.test.ts` | None documented | Add cross-slice tests for approve/deny flows through the API when the surface stabilizes. |
| Non-deterministic desktop task runner | `documentation/vertical-slices/automation-runner/run-nondeterministic-desktop-task.md` | Unit / contract boundary | `server/automation-runner/nonDeterministicDesktopTaskRunner.test.ts` | Mocked desktop evidence, driver actions, and model responses | Add guarded desktop-driver integration checks when reliable local fixtures exist. |

## Testing Notes

- Prefer behavior tests through public interfaces.
- Mock only system boundaries such as external APIs, time, randomness, file system, desktop drivers, or third-party services.
- Avoid tests coupled to private methods, internal collaborators, or call counts unless the call itself is the public behavior.
