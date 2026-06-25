# Inspect Automation Graph

Status: Done

End-to-end behavior:
- Given a user has generated a draft automation or saved an automation candidate
- When AutoM8 shows the automation
- Then the user can inspect the automation as an ordered node graph with node type, title, description, and available latest-run status
- And inputs, outputs, fallbacks, and verification show Draft Step Details when modeled, or appear as not modeled yet when those details are empty
