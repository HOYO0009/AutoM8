# Approval-Gated Run Actions

Status: Done

End-to-end behavior:
- Given a saved automation run reaches an action that could create an external side effect
- When AutoM8 prepares to continue that action
- Then the run pauses with an approval request describing the action, destination, and data involved
- And the user can approve to resume the run or deny to stop it with a failed step result
