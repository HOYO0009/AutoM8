# Picker-Backed Clarification Answers

Status: Done

End-to-end behavior:
- Given AutoM8 asks a Clarification Question for an exact local file or spreadsheet source
- When the user chooses a path through the local picker
- Then AutoM8 stores that path as the normal Clarification Answer value
- And Draft Automation Creation continues through the existing validation and repair boundary before any Draft Automation becomes UI-visible
