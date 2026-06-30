# Automation Builder

Purpose:
Summarize integrated Automation Builder behavior across prompt-based draft creation, saved automations, and prompt-based edits.

Status: In progress

Integrated slices:
- prompt-to-draft-automation
- save-draft-automation
- edit-saved-automation-with-prompt

Integrated behavior:
- Given a user describes a desktop workflow in the Automation Builder
- When AutoM8 reviews the workflow prompt
- Then the builder asks for Clarification Answers when Execution Blockers are missing or shows the created Draft Automation when the prompt is complete enough
- And the user can save a created Draft Automation as a locally persisted saved automation
- And saved automations are listed in a sidebar while the main area shows either a new draft workflow or one focused saved automation
- And the user can prompt-edit a focused saved automation by previewing a complete edited Draft Automation before replacing the saved automation in place
- And the user can delete a focused saved automation when it has no active run
- And saved automations reload from local repo storage across browser reloads and API server restarts, but are not database-backed or synced
- And new draft creation and saved automation prompt edits share full Clarification Answer context, one bounded parsed-JSON repair pass, and the shared draft validation boundary before generated drafts become UI-visible or saved automation data
