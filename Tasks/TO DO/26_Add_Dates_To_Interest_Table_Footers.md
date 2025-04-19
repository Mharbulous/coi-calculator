# Task 26: Add Dates to Interest Table Footers

## Description
Add date values to the first cells of the footer rows in both the Prejudgment and Postjudgment Interest Calculation tables.

## Requirements

1. **Prejudgment Interest Table Footer**:
   - Display the Judgment Date in the first cell of the footer row
   - The date should be displayed in the same format as other dates in the table (YYYY-MM-DD)
   - The date should be left-aligned and in normal font weight (not bold)

2. **Postjudgment Interest Table Footer**:
   - Display the Postjudgment Interest Date in the first cell of the footer row
   - The date should be displayed in the same format as other dates in the table (YYYY-MM-DD)
   - The date should be left-aligned and in normal font weight (not bold)

3. **Table Layout Constraints**:
   - The solution must not affect the column widths of the tables
   - The Description column should expand to use all remaining width
   - The Date, Rate, Principal, and Interest columns should be set to shrink to fit their contents

## Implementation Notes

- The Judgment Date can be accessed from `state.inputs.dateOfJudgment`
- The Postjudgment Interest Date can be accessed from `state.results.finalCalculationDate`
- The dates should be formatted using the `formatDateForDisplay` function from utils.date.js
- The implementation should work with the existing HTML structure without disrupting the table layout

## Acceptance Criteria

- [ ] Judgment Date appears in the first cell of the Prejudgment Interest table footer
- [ ] Postjudgment Interest Date appears in the first cell of the Postjudgment Interest table footer
- [ ] Table column widths remain properly proportioned (Description column expands, other columns shrink to fit)
- [ ] Dates are properly formatted and aligned
- [ ] Solution works with the existing HTML structure
