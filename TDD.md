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
| Unit | Pure logic and edge cases | Used | Current coverage focuses on backend module logic and validation. |
| Integration | Public interfaces and real code paths | Preferred default | Use for vertical slices when behavior crosses module boundaries. |
| Contract/API | External or internal service boundaries | Limited | Structured LLM boundary behavior is covered with mocked provider responses. |
| E2E | Critical user journeys only | Unknown | No dedicated browser or desktop E2E suite is currently documented. |
| Manual | Temporary fallback when automation is impractical | Unknown | Use only when desktop or provider behavior cannot be automated locally. |

## Coverage Map

| Area | Slice/module reference | Test level | Evidence | Doubles/mocks | Gap or next action |
|---|---|---|---|---|---|
| Automation Builder draft generation | `documentation/vertical-slices/automation-builder/prompt-to-draft-automation.md` | Unit / contract boundary | `server/automation-builder/draftGenerator.test.ts` | Mocked structured-output provider response | Add broader UI/API integration coverage when builder flows stabilize. |
| Automation Builder saved candidates | `documentation/vertical-slices/automation-builder/save-draft-automation.md` | Unit | `server/automation-builder/savedAutomationCandidateStore.test.ts` | None documented | Add persistence coverage if saved candidates move beyond in-memory storage. |
| Automation Runner deterministic action planning | `documentation/vertical-slices/automation-runner/run-saved-automation.md` | Unit / contract boundary | `server/automation-runner/executableActionPlanner.test.ts` | Mocked structured-output provider response | Add runner API integration coverage around saved candidate execution. |
| Automation Runner run state and approvals | `documentation/vertical-slices/automation-runner/approval-gated-run-actions.md` | Unit | `server/automation-runner/automationRunStore.test.ts`, `server/automation-runner/executableActionPlanner.test.ts` | None documented | Add cross-slice tests for approve/deny flows through the API when the surface stabilizes. |
| Non-deterministic desktop task runner | `documentation/vertical-slices/automation-runner/run-nondeterministic-desktop-task.md` | Unit / contract boundary | `server/automation-runner/nonDeterministicDesktopTaskRunner.test.ts` | Mocked desktop evidence, driver actions, and model responses | Add guarded desktop-driver integration checks when reliable local fixtures exist. |

## Testing Notes

- Prefer behavior tests through public interfaces.
- Mock only system boundaries such as external APIs, time, randomness, file system, desktop drivers, or third-party services.
- Avoid tests coupled to private methods, internal collaborators, or call counts unless the call itself is the public behavior.
