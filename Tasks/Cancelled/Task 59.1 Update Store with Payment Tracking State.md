# Task 59.1: Update Store with Payment Tracking State

## Background
Our application needs to track payments made against the calculated interest and principal. Currently, we have a modal UI that collects payment information, but we don't have a mechanism to store and manage this data in our application state.

## Objective
Extend the Zustand store (`store.js`) to support tracking payments, their application to interest and principal, and the resulting changes to the principal balance.

## Requirements

### State Structure Additions
- Add a `payments` array to the results object in the store to track all recorded payments
- Each payment object should contain:
  - `date`: The date the payment was made (Date object)
  - `dateStr`: Formatted date string (YYYY-MM-DD)
  - `amount`: The total payment amount
  - `interestApplied`: Amount applied to interest
  - `principalApplied`: Amount applied to principal
  - `remainingPrincipal`: The principal balance after this payment
  - `segmentIndex`: (Optional) Reference to which interest period this payment affects

### New Store Methods
- `addPayment`: Add a new payment to the payments array
- `updatePayment`: Update an existing payment at a specified index
- `removePayment`: Remove a payment at a specified index
- `calculatePaymentTotal`: Calculate the total amount of all payments

### Persistence Considerations
- Ensure payments persist when toggling the prejudgment interest checkbox on/off
- Add payments to the `savedPrejudgmentState` object
- Restore payments when prejudgment state is restored

## Implementation Steps
1. Modify the store state structure to include the payments array
2. Implement the required methods to manipulate payment data
3. Update the save/restore prejudgment state functions to handle payments
4. Ensure the reset function clears payments appropriately

## Testing
- Write tests to verify that payments can be added, updated, and removed correctly
- Test that payment totals are calculated correctly
- Verify that payments persist when toggling prejudgment interest

## Acceptance Criteria
- The store correctly manages payment data
- Payments persist when toggling prejudgment interest
- All store methods related to payments function as expected
