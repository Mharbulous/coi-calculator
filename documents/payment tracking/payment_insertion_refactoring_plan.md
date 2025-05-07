# Payment Insertion Refactoring Plan

This document outlines the plan to refactor the payment record insertion process in the COI Calculator to align with the more streamlined approach described in `insert_pay_example.md`.

## Current vs. Desired Flow

### Current Flow (Summary)
1. User clicks Record Payment button
2. Payment modal opens
3. Process payment data with complex validation and position detection
4. Check exact position of payment date (start date, end date, or within row)
5. Split calculation row if needed with special case handling
6. Apply payment with interest-first logic
7. Update principal for subsequent periods
8. Recalculate interest for all periods

### Desired Flow (From insert_pay_example.md)
1. Determine table (prejudgment/postjudgment)
2. Check if payment date matches an interest row end date
3. If not, find the calculation row containing the date and split it
4. Insert payment record after the appropriate row
5. Apply payment to interest first, then principal
6. Update principal for subsequent periods

## Files to Modify

1. **BC COIA calculator/payment-insertion.js** - Primary implementation
2. **BC COIA calculator/payment-processor.js** - Payment processing logic
3. **BC COIA calculator/dom/payments.js** - UI elements for payments
4. **BC COIA calculator/dom/tables.interest.js** - Table rendering
5. **Testing/payment-insertion.test.js** - Tests for insertion logic

## Detailed Changes

### 1. payment-insertion.js

#### a. `insertPaymentRecord` Function
```javascript
// Refactor to simplify the flow:
export function insertPaymentRecord(state, payment, ratesData) {
    // Keep validation and table determination
    
    // Simplify row finding logic to be more direct:
    // 1. Check if date exactly matches an end date
    // 2. Otherwise find containing row
    
    // Simplify row splitting to just two cases
    
    // Maintain interest-first application but simplify logic
    
    // Allow negative principal values in refund cases
    
    // Update subsequent periods
}
```

#### b. `findCalculationRowForPayment` Function
```javascript
// Simplify to primarily check:
// 1. Is payment date an end date of a row?
// 2. Which row contains the payment date?
function findCalculationRowForPayment(interestTable, paymentDate) {
    // Simplify by reducing special cases
    // Focus on the two main scenarios from desired flow
}
```

#### c. `splitCalculationRowAtPaymentDate` Function
```javascript
// Maintain core functionality but simplify edge cases
function splitCalculationRowAtPaymentDate(row, paymentDate, jurisdiction, ratesData, interestType) {
    // Simplify special case handling
    // Ensure consistent splitting behavior
}
```

#### d. `updateSubsequentPeriods` Function
```javascript
// Update to allow negative principal
function updateSubsequentPeriods(interestTable, startIndex, newPrincipal) {
    // Remove constraints preventing negative principal
    // Maintain interest recalculation logic
}
```

### 2. payment-processor.js

#### a. `processPayment` Function
```javascript
// Align with the simplified insertion flow
export function processPayment(state, payment, ratesData) {
    // Maintain validation
    // Simplify overpayment handling to allow negative principal
}
```

#### b. `recalculateWithPayments` Function
```javascript
// Adjust to work with modified insertion logic
export function recalculateWithPayments(state, payments, ratesData) {
    // Update to handle potentially negative principal values
    // Ensure consistent with new insertion approach
}
```

### 3. dom/payments.js

Keep the existing payment input functionality but update display logic if needed:

```javascript
// Update if necessary to display payment records consistently
export function insertPaymentRowFromData(tableBody, index, rowData) {
    // Update any rendering logic to accommodate changes in payment record structure
}
```

### 4. dom/tables.interest.js

Update rendering to accommodate changes:

```javascript
// Update if needed for consistent payment record display
export function updateInterestTable(tableBody, principalTotalElement, interestTotalElement, resultState, principalTotalForFooter) {
    // Ensure payment rows are rendered consistently with new structure
}
```

### 5. payment-insertion.test.js

Update tests to reflect the new algorithm:

```javascript
// Add tests for the simplified algorithm
// Ensure edge cases are covered
// Test scenarios with negative principal
```

## Implementation Sequence

1. **Core Algorithm Changes**:
   - Refactor `payment-insertion.js` first, focusing on simplifying the flow
   - Update `payment-processor.js` to align with the new approach

2. **UI Updates**:
   - Update UI components in `dom/payments.js` and `dom/tables.interest.js` if needed
   - Ensure presentation remains consistent

3. **Testing**:
   - Update and run tests to verify the new implementation
   - Add edge case tests for the simplified approach

## Test Scenarios

For comprehensive testing, the following scenarios should be covered:

1. **Basic Payment Insertion**:
   - Payment on a regular day (not start/end of period)
   - Verify correct interest-first application
   - Verify correct principal update for subsequent periods

2. **Edge Cases**:
   - Payment on exact end date of a period
   - Payment that exceeds current interest (testing principal reduction)
   - Payment that exceeds total owing (should allow negative principal)
   - Multiple payments in chronological order
   - Multiple payments with some out of order (should sort correctly)

3. **Table Integration**:
   - Verify insertion position in the table
   - Verify row splitting visual presentation
   - Verify payment row formatting

## Success Criteria

The refactoring will be considered successful when:

1. All test scenarios pass
2. The implementation aligns with the flow in `insert_pay_example.md`
3. Existing saved payment data still loads and displays correctly
4. The UI presentation maintains consistency
5. The code is more maintainable with reduced complexity

## Fallback Plan

If issues arise during implementation:
1. Document the specific problem
2. Revert to the original implementation for that component
3. Create a hybrid approach that addresses the specific issue while maintaining as much of the simplified flow as possible
