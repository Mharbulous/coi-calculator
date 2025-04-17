# Task 18: Reposition Help Icons in Summary Table

## Description
Reposition the help icons (question marks) in the summary table to improve the user interface. Specifically:

1. Remove the help icon next to "General Damages & Debt"
2. Move the help icons for Prejudgment Interest and Postjudgment Interest to be next to their respective date inputs instead of next to the row labels

## Implementation Plan

### 1. Modify HTML Templates (`index.html`)
- Update the `summary-row-editable-date` template to move the help icon from the label cell to the date cell
- Update the `summary-row-editable-pecuniary` template to remove the help icon

### 2. Update JavaScript (`tables.js`)
- Modify the `updateSummaryTable` function to handle the new help icon positions
- Ensure help text tooltips are still properly associated with the moved icons

### 3. Adjust CSS if needed
- Make any necessary adjustments to the CSS to ensure proper positioning and display of the relocated help icons

## Files to Modify
1. `BC COIA calculator/index.html`
2. `BC COIA calculator/dom/tables.js`
3. `BC COIA calculator/styles.css` (if needed)

## Expected Outcome
- The help icon next to "General Damages & Debt" will be removed
- The help icons for Prejudgment Interest and Postjudgment Interest will appear next to their respective date inputs
- All tooltips will continue to function correctly when users hover over or focus on the help icons
