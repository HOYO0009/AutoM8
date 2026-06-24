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
- `GLOSSARY.md` owns project terms.
- `PATTERN.md` records only GoF-style design patterns with `Used` or concrete `Planned` status.
- `PRINCIPLE.md` records coding/design principles with `Used` or concrete `Planned` status.
- `documentation/vertical-slices/<module>/<slice>.md` owns one end-to-end behavior when a slice exists.
- `documentation/vertical-slices/<module>/README.md` owns integrated module behavior when a module exists.

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
