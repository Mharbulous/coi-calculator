# Task 59.4: Update Interest Table Rendering for Payments

## Background
After processing a payment, we need to display it in the interest table with proper formatting and position. The table needs to show how much of the payment was applied to interest and how much to principal, and reflect the updated principal for subsequent interest calculations.

## Objective
Extend the current interest table rendering logic to properly display payment entries and their impact on interest calculations, following the pattern demonstrated in `pay_table.md`.

## Requirements

### Payment Row Rendering
- Extend `updateInterestTable` function in `dom/tables.interest.js` to handle payment rows
- Create a payment row with:
  - Payment date in the Date column
  - "Payment received: $XXX.XX" in the Description column
  - Principal reduction amount in the Principal column (negative)
  - Interest payment amount in the Interest column (negative)
- Maintain proper styling and formatting for payment rows

### Payment Position in Table
- Insert payment rows at the chronologically correct position in the table
- Handle special cases for payments on period boundaries:
  - Payments on the last day of a period should appear after the interest row
  - Payments on the first day of a period should appear before the interest row
- Ensure payment rows are properly integrated with existing special damages rows

### Visual Differentiation
- Apply distinct styling to payment rows to visually differentiate them from interest and special damages rows
- Clearly indicate the breakdown of payment application (interest vs. principal)
- Use appropriate formatting for negative values

## Implementation Steps
1. Create a function to render payment rows in the interest table
2. Modify the sorting algorithm to correctly position payment rows
3. Add CSS styling for payment rows
4. Ensure table totals are correctly updated to reflect payments
5. Implement visual indicators for payment breakdown

## Testing
- Test rendering payments made on different dates
- Verify payment rows appear in the correct position
- Check that formatting follows the pattern in `pay_table.md`
- Test with multiple payments to ensure correct sorting
- Verify interactions with special damages rows

## Acceptance Criteria
- Payment rows are displayed in the correct position in the table
- Formatting matches the example in `pay_table.md`
- Payment breakdown between interest and principal is clearly shown
- Table totals correctly reflect the impact of payments
- The solution integrates well with existing table rendering code
