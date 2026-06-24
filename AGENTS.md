# Agent Instructions

## Workflow

- Inspect existing docs, code, commands, and current changes before editing.
- Work one vertical slice at a time unless the task is integration.
- Use `TODO.md` as the work tracker.
- Keep slice notes focused on end-to-end behavior.
- Keep changes surgical and aligned with the current repository state.

## Documentation

- `README.md` explains project vision, status, structure, and commands.
- `TODO.md` tracks slice and integration work.
- `DDD.md` owns domain language, glossary terms, domain concepts, and naming conventions.
- `PATTERN.md` records only GoF-style design patterns with `Used` or concrete `Planned` status.
- `TDD.md` records test strategy, pyramid balance, coverage evidence, and testing gaps.
- `documentation/vertical-slices/<module>/<slice>.md` owns one end-to-end behavior when a slice exists.
- `documentation/vertical-slices/<module>/README.md` owns integrated module behavior when a module exists.

## Conventions

- Keep provider credentials server-side. Browser code must not receive `OPENROUTER_API_KEY` or other provider secrets.
- Constrain LLM output at the provider boundary and validate provider responses before turning them into UI-visible data or executable automation actions.
- Centralize shared provider-boundary mechanics while keeping domain validation in the owning module.

## Safety

- Preserve user changes.
- Do not commit secrets, credentials, tokens, `.env` values, or machine-local paths.
- Mark unknown facts as `Unknown` or `TODO:` instead of inventing them.
- Run relevant checks before handoff.

## Commands

| Command | Purpose |
|---|---|
| `npm install` | Install project dependencies. |
| `npm run dev` | Start the local API and Vite web app. |
| `npm run test` | Run focused Vitest checks. |
| `npm run build` | Type-check the server and build the client. |
