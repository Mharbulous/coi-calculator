# Task 60.2: Implement Interest-First Payment Application

## Goal
Correctly apply payment to interest first, then principal, as shown in the payment insertion examples. This ensures that payments are allocated according to standard financial practices.

## Tasks
1. Update `createPaymentRow()` function to:
   - Show separate interest and principal components in the payment row
   - Format the display to match the example in documentation
   - Ensure proper representation of negative values for payment application

2. Refactor how payments are applied to follow the interest-first approach:
   - Apply payment to accumulated interest first
   - Apply any remaining amount to the principal
   - Track both components separately in the payment record

3. Implement proper principal adjustment for subsequent periods:
   - Update the principal amount for all rows following a payment
   - Recalculate interest for those rows based on the new principal
   - Ensure the principal reduction flows through the entire table

## Implementation Details
- Examine all accumulated interest up to the payment date
- Calculate how much of the payment goes to interest vs. principal
- Update the payment row display to show both allocations
- Adjust all subsequent principal amounts and recalculate interest

## Verification Method
- When adding a payment, the console will show:
  ```
  Payment of $500.00 applied: $23.59 to interest, $476.41 to principal
  ```
- Visual confirmation in the UI that the payment row displays both components:
  ```
  Principal: -$476.41    Interest: -$23.59
  ```

## Dependencies
- Depends on successful completion of Task 60.1
- Uses currency utilities from `utils.currency.js`

## Acceptance Criteria
- [ ] Payments are applied to interest first, then to principal
- [ ] Payment rows clearly show the allocation between interest and principal
- [ ] Principal amounts in all subsequent rows are properly reduced
- [ ] Interest calculations for subsequent rows are updated based on new principal
- [ ] Debug information shows the payment allocation details

## Estimated Complexity
Medium

## Priority
High
