# Update Summary Table Terminology and Add Special Damages Row

## Background
The summary table in the Court Order Interest Calculator currently uses terminology that needs to be updated for clarity. Additionally, there is a need to display the total of special damages as a separate row in the summary table.

## Task Description
This task involves making the following changes to the summary table:

1. **Terminology Changes**:
   - Replace "Pecuniary Judgment" with "General Damages & Debt"
   - Replace "Costs Awarded" with "Costs"

2. **Add Special Damages Row**:
   - Add a new row labeled "Special Damages" above the Non-Pecuniary Judgment row
   - This row should display the total of all special damages entered in the Prejudgment Interest section
   - The row should be display-only (not editable)
   - The date field should not be an input field
   - The amount should be calculated by totaling the principal amount of all special damages that have been entered in the Prejudgment Interest section

## Files to Modify
- `src/dom/tables.js` - Update the `updateSummaryTable` function to:
  - Change the item labels as requested
  - Calculate the total of special damages from the state
  - Add a new row for Special Damages in the correct position

## Implementation Details
1. In the `updateSummaryTable` function, modify the items array to:
   - Change "Pecuniary Judgment" to "General Damages & Debt"
   - Change "Costs Awarded" to "Costs"
   - Add a new item for "Special Damages" before the Non-Pecuniary Judgment item
   - Calculate the total of all special damages from `results.specialDamages`
   - Use the display-only template for the Special Damages row

2. Ensure the Special Damages row is positioned correctly in the summary table.

## Expected Outcome
- The summary table will display "General Damages & Debt" instead of "Pecuniary Judgment"
- The summary table will display "Costs" instead of "Costs Awarded"
- A new row labeled "Special Damages" will appear above the Non-Pecuniary Judgment row
- The Special Damages row will show the total amount of all special damages entered in the Prejudgment Interest section

## Testing Criteria
1. Verify that the terminology changes are correctly displayed in the summary table
2. Add special damages in the Prejudgment Interest section and verify that their total appears correctly in the Special Damages row
3. Verify that the Special Damages row is positioned above the Non-Pecuniary Judgment row
4. Verify that the Special Damages row is not editable
5. Verify that the total calculation is correct by comparing it with the sum of all special damages entered
