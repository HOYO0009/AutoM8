# Principles

Record coding/design principles with current evidence or concrete planned triggers.
Prefer specific, evidence-backed principles over generic maxims.
Status must be `Used` or `Planned`. `Planned` requires a named TODO item, vertical slice, refactor, or explicit implementation intent.

| Principle | Status | When to apply | Evidence / Trigger | Notes |
|---|---|---|---|---|
| Keep provider credentials server-side. | Used | Any feature that calls an external LLM or automation provider. | `server/index.ts`, `src/App.tsx` | The browser submits prompts to the local API and never receives `OPENROUTER_API_KEY`. |
| Constrain LLM output at the provider boundary. | Used | Any feature that turns model output into UI-visible application data or executable automation actions. | `server/draftGenerator.ts`, `server/executionPlanner.ts`, `server/adaptiveDesktopExecutor.ts`, `server/draftGenerator.test.ts`, `server/executionPlanner.test.ts` | Request structured output, validate it locally, and return actionable errors or safe fallbacks when the provider cannot satisfy the contract. |
| Centralize provider-boundary mechanics while keeping domain validation local. | Used | Any feature that calls the same provider protocol from multiple domain modules. | `server/openRouterStructuredOutput.ts`, `server/draftGenerator.ts`, `server/executionPlanner.ts`, `server/adaptiveDesktopExecutor.ts` | Shared OpenRouter request, timeout, provider error, assistant-content, and JSON parsing logic lives in one adapter; draft, plan, and action validation stays with the owning module. |
