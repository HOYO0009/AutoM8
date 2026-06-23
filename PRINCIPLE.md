# Principles

Record durable coding principles learned from verified work in this repo.
Prefer specific, evidence-backed lessons over generic maxims.

| Principle | When to apply | Evidence | Notes |
|---|---|---|---|
| Keep provider credentials server-side. | Any feature that calls an external LLM or automation provider. | `server/index.ts`, `src/App.tsx` | The browser submits prompts to the local API and never receives `OPENROUTER_API_KEY`. |
| Constrain LLM output at the provider boundary. | Any feature that turns model output into UI-visible application data. | `server/draftGenerator.ts`, `server/draftGenerator.test.ts` | Request structured output, validate it locally, and return actionable errors when the provider cannot satisfy the contract. |
