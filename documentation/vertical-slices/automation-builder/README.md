# Automation Builder

Status: In progress

Integrated behavior:
- Given a user describes a desktop workflow in the Automation Builder
- When AutoM8 reviews the workflow prompt
- Then the builder asks for Clarification Answers when Execution Blockers are missing or shows the created Draft Automation when the prompt is complete enough
- And the user can save a created Draft Automation as an in-memory saved automation candidate
- And saved automation candidates are listed in a sidebar while the main area shows either a new draft workflow or one focused saved automation
- And the saved candidate is not executed or persisted across server restart
- And generated and saved drafts pass through the shared draft validation boundary before becoming UI-visible or saved candidate data
