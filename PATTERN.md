# Patterns

Record only patterns currently used in the codebase.

| Pattern | Where | Why |
|---|---|---|
| Server-side provider gateway | `server/index.ts`, `server/draftGenerator.ts`, `src/App.tsx` | The browser calls a local API while provider credentials stay on the server. |
| Strict provider response contract | `server/draftGenerator.ts`, `server/draftGenerator.test.ts` | LLM-backed drafts use an OpenRouter JSON schema plus local validation before the UI receives a draft. |
