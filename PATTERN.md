# Patterns

Record only GoF-style design patterns: creational, structural, or behavioral.
Do not record general architecture notes, data-flow shapes, storage choices, or aspirational patterns.
Status must be `Used` or `Planned`. `Planned` requires a named TODO item, vertical slice, refactor, or explicit implementation intent.

| Pattern | Category | Status | Where / Planned slice | Why | Evidence |
|---|---|---|---|---|---|
| Adapter | Structural | Used | Shared OpenRouter structured-output boundary. | Translates OpenRouter chat-completion JSON-schema requests and responses into AutoM8's local structured-output result contract. | `server/openRouterStructuredOutput.ts`, `server/draftGenerator.ts`, `server/executionPlanner.ts`, `server/adaptiveDesktopExecutor.ts` |
