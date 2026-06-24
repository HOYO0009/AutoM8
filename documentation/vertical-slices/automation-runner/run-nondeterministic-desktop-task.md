# Run Non-Deterministic Desktop Task

Status: Done

End-to-end behavior:
- Given a saved automation step requires ambiguous desktop perception or UI navigation
- When AutoM8 runs the non-deterministic desktop task
- Then it captures real screenshot and accessibility evidence, asks the model for one bounded action, executes that action, and verifies the result from fresh evidence
- And the run records retries, failures, approval pauses, and action evidence without treating weak observation as success
