# Run Saved Automation

Status: Done

End-to-end behavior:
- Given a user has saved an automation candidate
- When they run the saved automation
- Then AutoM8 starts a real Windows-first hybrid run with step-by-step status
- And deterministic actions execute through a local desktop driver while ambiguous actions use bounded LLM-assisted desktop control
- And external side-effect actions pause for approval before continuing
