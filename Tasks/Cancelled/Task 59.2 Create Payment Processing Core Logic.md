# Task 59.2: Create Payment Processing Core Logic

## Background
When a payment is recorded, it needs to be applied correctly to accumulated interest first, and then to principal, following standard accounting practices. This requires core logic to calculate how the payment should be distributed.

## Objective
Create a payment processing module that handles the allocation of payments to interest and principal, calculates the new principal balance, and properly accounts for payments made on different dates.

## Requirements

### Payment Processing Logic
- Create a dedicated module (`payment-processor.js`) to handle payment calculations
- Implement a main processing function that:
  - Takes a payment amount and date
  - Calculates all accumulated interest up to that date
  - Applies the payment first to accumulated interest
  - Applies any remaining amount to reduce the principal
  - Returns the resulting distribution and new principal balance

### Interest Calculation Integration
- The payment processor needs to work with the existing interest calculation system
- It must calculate interest accurately up to the payment date
- It must handle different rate periods correctly

### Edge Case Handling
- Payments that exceed the total outstanding amount (interest + principal)
- Payments made on the exact same day as a rate change
- Payments made on the first day of an interest period
- Payments made on the last day of an interest period
- Zero or negative payment amounts (should be rejected)

## Implementation Steps
1. Create a new module file for the payment processor
2. Implement the core payment allocation function
3. Create helper functions to calculate interest up to a specific date
4. Add validation to handle edge cases
5. Ensure the processor returns all necessary data for store updates and UI rendering

## Testing
- Test with a payment that covers only part of the interest
- Test with a payment that covers all interest and part of the principal
- Test with a payment that covers all interest and principal
- Test payments on different dates, including period boundaries
- Verify calculations match examples in `pay_table.md`

## Acceptance Criteria
- Payment allocation follows the "interest first, then principal" rule
- Calculations are accurate and match the expected results in `pay_table.md`
- Edge cases are handled correctly
- The module integrates cleanly with existing interest calculation code
