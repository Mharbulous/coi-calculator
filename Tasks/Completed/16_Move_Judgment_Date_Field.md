# Task 16: Move Judgment Date Field

## Description
Currently, the date of judgment is entered by the user in the line labeled "General Damages and Debt" which is not very intuitive. This task involves moving the date of judgment editable field to be in line with the word "Judgment", and making the editable field format with bold text that matches the format of the word "Judgment". After moving this field, the General Damages & Debt row should have a static date that is basically a reference to the judgment date, just as is currently done for the rows Special Damages, Non-Pecuniary Damages, and Costs & Disbursements.

## Implementation Plan

### 1. Add a new date input field next to the "Judgment" heading
- Modify the HTML structure in `index.html` to add a date input field next to the "Judgment" heading
- Add proper data attributes to the new field so it's recognized by the JavaScript code
- Style the field to match the bold formatting of the "Judgment" heading

### 2. Update the elements.js file
- Add a reference to the new judgment date input field
- Update any references to the old judgment date input field

### 3. Modify the tables.js file
- Update the `updateSummaryTable` function to use the new field for the judgment date
- Modify the template handling for the "General Damages & Debt" row to display a static date instead of an editable field
- Ensure the static date in the "General Damages & Debt" row references the judgment date

### 4. Update the inputs.js file
- Modify the `getInputValues` function to read from the new judgment date input field
- Update any validation logic to use the new field

### 5. Testing
- Test that entering a date in the new field correctly updates all related fields
- Verify that the "General Damages & Debt" row displays the correct static date
- Ensure all calculations still work correctly with the new field arrangement

## Files to Modify
1. `BC COIA calculator/index.html`
2. `BC COIA calculator/dom/elements.js`
3. `BC COIA calculator/dom/tables.js`
4. `BC COIA calculator/dom/inputs.js`

## Expected Outcome
The date of judgment will be entered in a more intuitive location next to the "Judgment" heading, and the "General Damages & Debt" row will display a static date that references the judgment date, similar to other rows in the summary table.
