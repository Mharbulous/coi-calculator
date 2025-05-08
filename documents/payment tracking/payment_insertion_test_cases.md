# Payment Insertion Test Cases

This document outlines the test cases that should be implemented or updated to verify the refactored payment insertion functionality.

## Core Test Scenarios

### 1. Basic Payment Insertion

#### Test Case: Insert Payment in Middle of Period
- **Setup**: Create an interest calculation with a period spanning multiple days
- **Action**: Insert a payment in the middle of the period
- **Expected Results**:
  - Period is split at payment date
  - Payment is inserted between split periods
  - Interest first payment application is correct
  - Principal is updated for all subsequent periods
  - Interest is recalculated for all subsequent periods

#### Test Case: Insert Payment on End Date
- **Setup**: Create an interest calculation with multiple periods
- **Action**: Insert a payment on the exact end date of a period
- **Expected Results**:
  - Period is not split
  - Payment is inserted after the period
  - Interest first payment application is correct
  - Principal is updated for all subsequent periods
  - Interest is recalculated for all subsequent periods

### 2. Payment Amount Scenarios

#### Test Case: Payment Equal to Interest Only
- **Setup**: Create an interest calculation with accumulated interest
- **Action**: Insert a payment equal to the accumulated interest
- **Expected Results**:
  - All payment is applied to interest
  - No change in principal amount
  - Interest is reset for the next period

#### Test Case: Payment Exceeds Interest
- **Setup**: Create an interest calculation with accumulated interest
- **Action**: Insert a payment greater than the accumulated interest
- **Expected Results**:
  - Interest portion is applied to interest
  - Remaining amount is applied to principal
  - Principal is reduced for subsequent periods
  - Interest is recalculated based on new principal

#### Test Case: Payment Exceeds Total Owing
- **Setup**: Create an interest calculation with a known principal and interest
- **Action**: Insert a payment greater than principal + interest
- **Expected Results**:
  - Interest is fully paid
  - Principal becomes negative (indicating a refund)
  - Interest on subsequent periods is zero

### 3. Multiple Payments

#### Test Case: Sequential Payments in Order
- **Setup**: Create an interest calculation spanning multiple periods
- **Action**: Insert multiple payments in chronological order
- **Expected Results**:
  - Each payment is processed correctly
  - Principal and interest are updated correctly after each payment
  - Final principal reflects all payments

#### Test Case: Multiple Payments Inserted at Once
- **Setup**: Create an interest calculation spanning multiple periods
- **Action**: Insert multiple payments at once (via batch process)
- **Expected Results**:
  - Payments are sorted by date
  - All payments are processed correctly in date order
  - Final state is the same as if payments were added sequentially

### 4. Edge Cases

#### Test Case: Payment on Rate Change Date
- **Setup**: Create an interest calculation with a rate change
- **Action**: Insert a payment on the exact date of the rate change
- **Expected Results**:
  - Payment is processed at the end of the period with the old rate
  - New period starts with updated principal and new rate

#### Test Case: Payment With Zero Amount
- **Setup**: Any valid interest calculation
- **Action**: Attempt to insert a payment with zero amount
- **Expected Results**:
  - Validation fails
  - No changes to interest calculation

#### Test Case: Payment With Invalid Date
- **Setup**: Any valid interest calculation
- **Action**: Attempt to insert a payment with invalid date
- **Expected Results**:
  - Validation fails
  - No changes to interest calculation

### 5. DOM Integration Tests

#### Test Case: Payment Row UI Rendering
- **Setup**: Create an interest calculation and add a payment
- **Action**: Verify that payment row is rendered correctly in UI
- **Expected Results**:
  - Payment date is displayed correctly
  - Payment amount is displayed correctly
  - Negative principal and interest values have correct styling

#### Test Case: Payment Row Interaction
- **Setup**: Create an interest calculation with a payment
- **Action**: Modify the payment amount in the UI
- **Expected Results**:
  - Interest calculation is updated correctly
  - Principal and interest values are updated
  - Table totals are recalculated

#### Test Case: Payment Row Deletion
- **Setup**: Create an interest calculation with a payment
- **Action**: Delete the payment row
- **Expected Results**:
  - Payment is removed from the table
  - Interest calculation is reset to original state
  - Principal and interest values are recalculated

## Test Implementation

### Unit Tests

Update the following files in the Testing directory:

1. **payment-insertion.test.js**:
   - Add or update tests for core payment insertion logic
   - Test all scenarios for the `insertPaymentRecord` function
   - Test helper functions like `checkPaymentDateMatchesEndDate` and `findCalculationRowContainingDate`

2. **payment-processor.test.js**:
   - Update tests for payment processing and interest application
   - Test scenarios for `processPayment` and `recalculateWithPayments`

### Integration Testing

Create or update integration tests that verify:

1. End-to-end flow from payment entry to table update
2. Persistence and reload of payment data
3. Correct display and styling of payment rows in the UI

## Test Data

For consistent testing, create standardized test cases with predefined:
- Principal amounts
- Date ranges
- Interest rates
- Payment amounts and dates

This will ensure that tests are repeatable and comparable across different implementations.

## Validation Strategy

The testing approach should follow this sequence:

1. Unit test individual functions to verify correct behavior
2. Test the integration of components to ensure they work together
3. Manually verify edge cases and UI interactions
4. Create regression tests to prevent future issues

All tests should be automated where possible to allow for continuous validation during the refactoring process.
