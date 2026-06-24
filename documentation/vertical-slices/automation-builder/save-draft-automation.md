# Save Draft Automation

Status: Done

End-to-end behavior:
- Given a user has generated a draft automation from a prompt
- When they save the draft
- Then AutoM8 keeps the draft as a saved automation candidate with an ID and creation time
- And the saved automation candidate appears in the Automation Builder sidebar without being executed
- And focusing a saved automation shows its graph, run controls, and latest run detail in the main area
