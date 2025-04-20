# Task 32: Enhance Prejudgment Interest Checkbox Behavior

## Current Behavior

Currently, when the "Calculate prejudgment interest" checkbox is turned off:
- The prejudgment interest calculation table is hidden
- The summary table still shows the prejudgment interest date field, help icon, and "from" text
- The prejudgment interest amount shows $0.00 and is not editable

This behavior is inconsistent with how the "Show postjudgment interest" checkbox works and limits flexibility for users.

## Desired Behavior

The desired behavior has been divided into three subtasks:

### 1. Hide Prejudgment Interest Date When Checkbox is Unchecked

When the "Calculate prejudgment interest" checkbox is unchecked:
- The prejudgment interest date field in the summary table should be hidden
- The help icon and "from" text next to the date field should also be hidden
- The state should still maintain the prejudgment start date value for when the checkbox is checked again

See [Task 32.1](./32.1_Hide_Prejudgment_Interest_Date.md) for detailed implementation instructions.

### 2. Make Prejudgment Interest Amount Editable When Checkbox is Unchecked

When the "Calculate prejudgment interest" checkbox is unchecked:
- The prejudgment interest amount should become an editable currency field
- When switching from checked to unchecked, the editable field should initialize with the same value that had previously been calculated
- When switching from unchecked to checked, the value should go back to being non-editable and calculated based on the dates and amounts entered

See [Task 32.2](./32.2_Make_Prejudgment_Interest_Amount_Editable.md) for detailed implementation instructions.

### 3. Preserve Calculation State When Toggling Checkbox

When toggling the "Calculate prejudgment interest" checkbox:
- The calculation state (including special damages entries) should be preserved
- Switching between checked and unchecked should not erase the calculation table state
- When the user unchecks then checks the checkbox, all details including special damages should remain

See [Task 32.3](./32.3_Preserve_Calculation_State.md) for detailed implementation instructions.

## Reference: Postjudgment Interest Checkbox Behavior

The "Show postjudgment interest" checkbox currently:
- Hides the postjudgment interest section (table) when unchecked
- Completely removes the postjudgment interest row from the summary table when unchecked
- Adjusts the validation logic to not require a valid postjudgment date when the checkbox is unchecked
- Preserves the postjudgment end date value in the state for when the checkbox is checked again

This behavior should be used as a reference for implementing the prejudgment interest checkbox behavior.

## Implementation Approach

The implementation has been divided into three subtasks to be completed in sequence:

1. First, implement the changes to hide the prejudgment interest date when the checkbox is unchecked (Task 32.1)
2. Then, implement the changes to make the prejudgment interest amount editable when the checkbox is unchecked (Task 32.2)
3. Finally, ensure the calculation state is preserved when toggling the checkbox (Task 32.3)

Each subtask builds on the previous one, but they are designed to be implemented and tested independently.
