# Automation Builder

Purpose:
Summarize integrated Automation Builder behavior across prompt-based draft creation, saved automation candidates, and prompt-based edits.

Status: In progress

Integrated slices:
- prompt-to-draft-automation
- save-draft-automation
- edit-saved-automation-with-prompt

Integrated behavior:
- Given a user describes a desktop workflow in the Automation Builder
- When AutoM8 reviews the workflow prompt
- Then the builder asks for Clarification Answers when Execution Blockers are missing or shows the created Draft Automation when the prompt is complete enough
- And the user can save a created Draft Automation as an in-memory saved automation candidate
- And saved automation candidates are listed in a sidebar while the main area shows either a new draft workflow or one focused saved automation
- And the user can prompt-edit a focused saved automation by previewing a complete edited Draft Automation before replacing the saved candidate in place
- And the saved candidate is not executed or persisted across server restart
- And new draft creation and saved automation prompt edits share full Clarification Answer context, one bounded parsed-JSON repair pass, and the shared draft validation boundary before generated drafts become UI-visible or saved candidate data
