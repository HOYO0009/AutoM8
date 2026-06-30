# Edit Saved Automation With Prompt

Status: Done

End-to-end behavior:
- Given a user has a saved automation candidate
- When they describe a change to that saved automation in an edit prompt
- Then AutoM8 uses the saved automation as context and either asks Clarification Questions for missing Execution Blockers or creates a complete edited Draft Automation
- And edit clarification continuations use the same full Clarification Answer context and bounded invalid-JSON-shape repair behavior as Draft Automation Creation
- And when the user saves the edited draft, AutoM8 replaces the saved automation candidate in place and clears stale latest-run context for that automation
