# Clarification-Gated Draft Automation Creation

Status: Done

End-to-end behavior:
- Given a user has a desktop workflow they want to automate and configured an OpenRouter model that supports structured outputs
- When they submit a natural-language workflow prompt
- Then AutoM8 either asks Clarification Questions for missing Execution Blockers or creates a Draft Automation with a title, summary, ordered steps, and Draft Step Details
- And AutoM8 does not create, save, or execute a Draft Automation while required Clarification Answers are missing
- And when the configured model response cannot be validated, AutoM8 shows a safe failure message with diagnostic code, model, validation stage, provider status, and retry guidance without exposing raw provider payloads
- And graph inspection of the draft is owned by `documentation/vertical-slices/node-graph-viewer/inspect-automation-graph.md`
