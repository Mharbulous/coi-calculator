# Task 29: Add Total Days Count to Interest Table Footers

## Description
Add a count of the total number of days for both prejudgment and postjudgment interest in the table footers of the respective interest calculation tables. This information should be displayed in the Description column of the table footer row (the same row that displays the total interest).

## Requirements

1. **Prejudgment Interest Table Footer**:
   - Calculate the total number of days of prejudgment interest by summing the days from each period
   - Display the total days count in the Description column of the footer row
   - Format as "Total: X days" where X is the total number of days
   - Position the total days count on the right side of the cell, while keeping the judgment date on the left

2. **Postjudgment Interest Table Footer**:
   - Calculate the total number of days of postjudgment interest by summing the days from each period
   - Display the total days count in the Description column of the footer row
   - Format as "Total: X days" where X is the total number of days
   - Position the total days count on the right side of the cell, while keeping the postjudgment end date on the left

3. **Visual Presentation**:
   - The total days count should be clearly visible and not interfere with the existing date display
   - The layout should maintain proper alignment and spacing
   - The solution should work with the existing HTML structure without disrupting the table layout

## Implementation Notes

- The days for each period are already available in the `_days` property of each detail object in the `details` array
- The total days can be calculated by summing these values
- The footer cell already contains the date, so we need to add the total days count without removing the date
- Use a flex container to position the date on the left and the total days count on the right

## Acceptance Criteria

- [ ] Total days count appears in the Description column of the Prejudgment Interest table footer
- [ ] Total days count appears in the Description column of the Postjudgment Interest table footer
- [ ] The format is "Total: X days" where X is the correct sum of days
- [ ] The existing date display is preserved
- [ ] The layout is visually balanced with the date on the left and total days on the right
- [ ] The solution works with the existing HTML structure
