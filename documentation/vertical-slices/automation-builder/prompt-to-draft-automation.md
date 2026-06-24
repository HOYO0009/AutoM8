# Prompt-To-Draft Automation

Status: Done

End-to-end behavior:
- Given a user has a desktop workflow they want to automate and configured an OpenRouter model that supports structured outputs
- When they submit a natural-language prompt
- Then AutoM8 creates a draft automation with a title, summary, and ordered steps
- And the draft is not saved or executed yet
- And graph inspection of the draft is owned by `documentation/vertical-slices/node-graph-viewer/inspect-automation-graph.md`
