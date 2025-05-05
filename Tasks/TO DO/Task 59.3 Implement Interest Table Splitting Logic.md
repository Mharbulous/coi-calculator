# Task 59.3: Implement Interest Table Splitting Logic

## Background
When a payment is made in the middle of an interest period, that period needs to be split into two parts: before and after the payment. This ensures interest is calculated correctly for each part using the appropriate principal amount.

## Objective
Implement logic to split interest periods when a payment occurs within them, ensuring accurate interest calculations for both segments and proper handling of edge cases.

## Requirements

### Period Splitting Logic
- Create a function to split an interest period when a payment falls within it
- Calculate interest for the first segment using the original principal
- Calculate interest for the second segment using the reduced principal
- Ensure all date ranges are correctly maintained

### Edge Case Handling
- Payments on period boundaries (first or last day of a period):
  - For payments on the last day: Place the payment row after the completed interest period
  - For payments on the first day: Place the payment row before the interest period
- Multiple payments within the same period need to split the period multiple times
- Payments exactly on interest rate change dates need special handling

### Integration with Existing Calculation Logic
- Extend the `calculations.js` module to handle period splitting
- Ensure the existing interest rate lookup functions are used consistently
- Maintain compatibility with the current interest calculation flow

## Implementation Steps
1. Analyze the current `getApplicableRatePeriods` function to understand how periods are determined
2. Extend or modify this function to handle period splitting for payments
3. Create a function to determine if a payment requires period splitting
4. Implement logic to recalculate interest for split periods
5. Ensure correct date handling throughout the splitting process

## Testing
- Test payment on the first day of a period (no split needed)
- Test payment on the last day of a period (no split needed)
- Test payment in the middle of a period (requires split)
- Test multiple payments in the same period
- Test payments at various points in the interest calculation timeline
- Compare results with the example in `pay_table.md`

## Acceptance Criteria
- Interest periods are correctly split when payments fall within them
- Interest is calculated correctly for both segments with the appropriate principal
- Edge cases are properly handled
- Results match the expected behavior shown in `pay_table.md`
- The solution integrates seamlessly with the existing calculation system
