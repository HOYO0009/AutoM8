# Automation Runner

Integrated behavior:
- Given a user has saved an automation candidate
- When they start a run
- Then AutoM8 creates an asynchronous run from an executable action plan
- And deterministic actions execute through the Windows desktop driver
- And side-effect actions pause for approval before continuing
- And bounded LLM desktop tasks use screenshot and accessibility evidence, execute one model-selected action at a time, verify from fresh evidence, and pause for approval when needed
