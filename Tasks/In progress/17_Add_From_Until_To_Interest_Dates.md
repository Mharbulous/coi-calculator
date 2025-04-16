# Task 17: Add "from" and "until" Labels to Interest Dates in Summary Table

## Description
Add the word "from" next to the date in the Prejudgment Interest row and "until" next to the date in the Postjudgment Interest row within the summary table. These labels should appear in the same cell as the date input, positioned to the left of the date input using a flex layout with `justify-content: space-between`. This aims to clarify the meaning of these dates as requested in the visual example provided.

## Implementation Plan

### 1. Modify HTML Template (`index.html`)
- Update the `summary-row-editable-date` template.
- Wrap the date input and a new span for the label ("from"/"until") within a container div inside the `td`.
- Add a data attribute (e.g., `data-display="dateLabel"`) to the new span to allow dynamic text setting.

### 2. Update CSS (`styles.css`)
- Add styles for the new container div to use `display: flex` and `justify-content: space-between`.
- Ensure proper alignment and spacing within the cell.
- Adjust the width of the date input if necessary to accommodate the label.

### 3. Update JavaScript (`tables.js`)
- In the `updateSummaryTable` function:
    - When processing the Prejudgment and Postjudgment Interest rows using the `summary-row-editable-date` template:
        - Find the new label span using its data attribute.
        - Set the text content of the label span to "from" for Prejudgment Interest and "until" for Postjudgment Interest.

### 4. Testing
- Verify that "from" appears to the left of the Prejudgment Interest date input.
- Verify that "until" appears to the left of the Postjudgment Interest date input.
- Confirm that the layout is correct and visually appealing.
- Ensure that editing the dates still works correctly and triggers recalculations.

## Files to Modify
1. `BC COIA calculator/index.html`
2. `BC COIA calculator/styles.css`
3. `BC COIA calculator/dom/tables.js`

## Expected Outcome
The summary table's Prejudgment Interest row will display "from" aligned to the left and the date input aligned to the right within the date cell. The Postjudgment Interest row will similarly display "until" aligned to the left and the date input aligned to the right.
