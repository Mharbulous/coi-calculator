# Task 25: Fix Validation For Hidden Postjudgment Date

## Description
When the "Show postjudgment interest" checkbox is unchecked, the postjudgment interest section is hidden. However, the validation logic is still checking for the postjudgment end date, causing an error message to appear even when the user has intentionally hidden that section.

## Requirements
1. Update the validation logic to only check for the postjudgment end date if the showPostjudgment checkbox is checked
2. Ensure that when postjudgment interest is hidden, a missing or invalid postjudgment date does not trigger the error message
3. Maintain the visual cues for invalid date fields (light red background)
4. Maintain the full-width error message in the TOTAL OWING row for other validation errors

## Current Issues
- The error message "One or more required dates are missing or invalid" appears when the postjudgment date is missing or invalid, even when the "Show postjudgment interest" checkbox is unchecked
- Initial fix in inputs.js did not fully resolve the issue

## Application Validation Architecture
Understanding the complete validation flow is crucial for fixing this issue:

1. **Input Collection and Initial Validation**:
   - `getInputValues()` in `inputs.js` collects all input values from the DOM
   - `validateInputValues()` in `inputs.js` performs the primary validation checks
   - This function already has conditional logic for `showPostjudgment` but it's not sufficient

2. **Error Handling and Store Updates**:
   - When validation fails, `handleInvalidInputs()` in `calculator.core.js` is called
   - This function sets the `validationError` flag in the Zustand store
   - The store state is used by other components to display error messages

3. **Visual Feedback**:
   - `updatePrejudgmentPostjudgmentConstraints()` in `datepickers.js` applies error styling to date inputs
   - This styling is applied regardless of section visibility
   - `updateSummaryTable()` in `tables.summary.js` displays the error message based on the `validationError` flag

4. **Visibility Control**:
   - `togglePostjudgmentVisibility()` in `visibility.js` controls section visibility
   - This function updates the store but doesn't clear validation errors when hiding sections

## Proposed Solution
1. Update all three layers of the validation architecture:
   - **Visual Layer**: Modify `datepickers.js` to only apply error styling when the section is visible
   - **Logic Layer**: Update `calculator.core.js` to bypass validation errors from hidden sections
   - **Control Layer**: Enhance `visibility.js` to clear validation errors when hiding sections

2. Specifically:
   - Check `showPostjudgment` state before applying error styling in datepickers.js
   - Add special case handling in recalculate() to proceed despite validation errors when they're only related to hidden sections
   - Clear validation errors when toggling off the postjudgment checkbox

3. Test thoroughly with different combinations of checkbox states and date values

## Related Files
- BC COIA calculator/dom/inputs.js
- BC COIA calculator/calculator.core.js
- BC COIA calculator/dom/datepickers.js
- BC COIA calculator/dom/tables.summary.js
- BC COIA calculator/dom/visibility.js

## Notes
- This task is a continuation of the work to add visual cues for invalid date fields and replace the popup error notification with a persistent error message in the TOTAL OWING row
- The validation flow involves multiple components that all need to be updated to fully respect the visibility state
