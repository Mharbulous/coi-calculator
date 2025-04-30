# Task 32: Enhance Prejudgment Interest Checkbox Behavior

## Current Behavior

Currently, when the "Show prejudgment interest" checkbox is turned off:
- The prejudgment interest calculation table is hidden
- The summary table still shows the prejudgment interest date field, help icon, and "from" text
- The prejudgment interest amount shows $0.00 and is not editable

This behavior is inconsistent with how the "Show postjudgment interest" checkbox works and limits flexibility for users.

## Desired Behavior

The desired behavior has been divided into three subtasks:

### 1. Hide Prejudgment Interest Date When Checkbox is Unchecked

When the "Show prejudgment interest" checkbox is unchecked:
- The prejudgment interest date field in the summary table should be hidden
- The help icon and "from" text next to the date field should also be hidden
- The state should still maintain the prejudgment start date value for when the checkbox is checked again

See [Task 32.1](./32.1_Hide_Prejudgment_Interest_Date.md) for detailed implementation instructions.

### 2. Make Prejudgment Interest Amount Editable When Checkbox is Unchecked

When the "Show prejudgment interest" checkbox is unchecked:
- The prejudgment interest amount should become an editable currency field
- When switching from checked to unchecked, the editable field should initialize with the same value that had previously been calculated
- When switching from unchecked to checked, the value should go back to being non-editable and calculated based on the dates and amounts entered

See [Task 32.2](./32.2_Make_Prejudgment_Interest_Amount_Editable.md) for detailed implementation instructions.

### 3. Preserve Calculation State When Toggling Checkbox

When toggling the "Show prejudgment interest" checkbox:
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

## Implementation Notes

### Learnings from Task 32.1

During the implementation of Task 32.1, several important insights were gained that are relevant to the remaining tasks:

1. **Row Template Selection**: The `updateSummaryTable` function in `tables.summary.js` uses different HTML templates for different row types. Understanding this template selection mechanism is crucial for controlling how rows are displayed:
   - For prejudgment interest row with date input: Template ID `summary-row-editable-date`
   - For display-only rows: Template ID `summary-row-display-only`

2. **Row Construction Logic**: Unlike the postjudgment interest row which is conditionally added to the summary table only when its checkbox is checked, the prejudgment interest row is always added to the table. This difference in approach required a different strategy for hiding the prejudgment row elements.

3. **DOM Structure**: The date cell container (`.date-cell-container`) contains multiple elements:
   - The help icon span (`[data-display="helpIcon"]`)
   - The date label span (`[data-display="dateLabel"]`)
   - The date input field (`[data-input="dateValue"]`)
   Each of these elements needs to be handled separately for proper visibility control.

4. **Visibility vs Template Type**: There are two approaches to hiding the date field:
   - Toggle the visibility of elements within an existing template
   - Use a different template entirely based on the checkbox state
   
   The more robust solution implemented was to use different templates based on the checkbox state, with the display-only template when unchecked and the date-editable template when checked.

These insights will be valuable for implementing Tasks 32.2 and 32.3, particularly for Task 32.2 where we need to make the prejudgment interest amount editable when the checkbox is unchecked.
