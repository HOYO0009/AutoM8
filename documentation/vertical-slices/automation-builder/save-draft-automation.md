# Save Draft Automation

Status: Done

End-to-end behavior:
- Given a user has generated a draft automation or focused a saved automation
- When they save the draft or delete the saved automation without an active run
- Then AutoM8 persists the saved automation list in `.autom8-data/saved-automations.json` and reloads it across browser reloads and API server restarts
- And deleted saved automations leave the sidebar, local storage, and stale latest-run context
