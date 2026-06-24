# Run Deterministic Saved Automation

Status: Done

End-to-end behavior:
- Given a user has saved an automation candidate with concrete deterministic actions
- When they run the saved automation candidate
- Then AutoM8 executes the deterministic actions through the local Windows desktop driver
- And the saved automation candidate shows the latest run status with step logs and action evidence
