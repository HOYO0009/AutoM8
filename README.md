# AutoM8

Hybrid Desktop Automator concept.

Vision:
A Windows-first desktop automation platform that turns recorded or described workflows into transparent, editable automation graphs. Automations combine deterministic execution with LLM reasoning, using code for reliability and AI for ambiguity, repair, and adaptation.

User goal:
Let users create, inspect, edit, run, and monitor desktop-wide automations without manually scripting every step.

Current status:
Prototype phase. Initial target platform is Windows. The web prototype creates a draft automation from a natural-language prompt through a local OpenRouter-backed API, lets the user save the generated draft as an in-memory automation candidate, and runs that candidate through a safe in-memory MVP runner that records step results without controlling the desktop.

## Quick Start

Prerequisites: Node.js 24 and npm 11.
Setup: `npm install`, then copy `.env.example` to `.env` and set `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`. Use an OpenRouter model that supports structured outputs because draft generation requires a JSON schema response.
Run: `npm run dev`
Test: `npm run test`

## Common Commands

| Command | Purpose |
|---|---|
| `npm install` | Install project dependencies. |
| `npm run dev` | Start the local API and Vite web app. |
| `npm run test` | Run focused Vitest checks. |
| `npm run build` | Type-check the server and build the client. |

## Project Structure

| Path | Owns |
|---|---|
| `README.md` | Project vision, user goal, current status, and commands. |
| `AGENTS.md` | Agent workflow, documentation routing, and safety rules. |
| `TODO.md` | Planned vertical slices, integration work, and completed work. |
| `GLOSSARY.md` | Project terms and domain language. |
| `PATTERN.md` | Actual patterns observed in the codebase. |
| `PRINCIPLE.md` | Durable coding lessons learned from verified project work. |
| `documentation/vertical-slices/automation-builder/` | Automation Builder module behavior and slice notes. |
| `documentation/vertical-slices/automation-runner/` | Automation Runner slice notes. |
| `server/` | Local API, OpenRouter draft generation, in-memory saved automation storage, and safe in-memory automation runs. |
| `shared/` | Types shared by the frontend and backend. |
| `src/` | React web prototype. |
