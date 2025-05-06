# Task 60.1: Enhance the Row Finding and Row Splitting Logic

## Goal
Improve the algorithm that identifies where to insert a payment record and correctly splits calculation rows according to the examples in the payment insertion documentation.

## Tasks
1. Refactor `findCalculationRowForPayment()` function to:
   - Accurately identify rows containing payment dates
   - Handle edge cases where payment dates fall exactly on row boundaries
   - Return more detailed information about the identified row

2. Update `splitCalculationRowAtPaymentDate()` function to:
   - Handle edge cases better (especially when payment dates fall on row start/end dates)
   - Ensure date handling is consistent (using proper UTC dates)
   - Generate split rows that match the expected format in the examples

3. Add proper logging for debugging purposes:
   - Include detailed information about row identification
   - Show details of how rows are split
   - Log information about date comparisons and calculations

## Implementation Details
- Ensure all date comparisons use consistent normalization
- Add special handling for payments that fall exactly on interest period boundaries
- Implement proper validation before performing splits
- Add comprehensive commenting for future maintainability

## Verification Method
- Console debug messages showing the row being identified for a payment date:
  ```
  Found row for payment 2020-10-13: Row starting 2020-07-01, ending 2021-01-01
  ```
- Debug visualization of how a row would be split:
  ```
  Original row: 2020-07-01 to 2021-01-01 (184 days)
  Split into:
    - 2020-07-01 to 2020-10-13 (104 days)
    - 2020-10-13 to 2021-01-01 (80 days)
  ```

## Dependencies
- Requires understanding of existing payment insertion logic
- Uses date utilities from `utils.date.js`

## Acceptance Criteria
- [ ] `findCalculationRowForPayment()` correctly identifies the row containing a given payment date
- [ ] `splitCalculationRowAtPaymentDate()` properly splits rows at the payment date
- [ ] Debug logging provides clear visibility into the row splitting process
- [ ] The algorithm handles edge cases properly (dates on boundaries, etc.)

## Estimated Complexity
Medium

## Priority
High
