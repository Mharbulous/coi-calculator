# Payment Row Context

## Introduction

This document provides essential context information for developers working on payment record rows in the COI Calculator. Review this document before making any changes to payment row display, formatting, or processing. It's particularly useful when working on tasks related to payment UI, payment record insertion, or interest table rendering that involves payments.

## Architecture Overview

The payment row implementation spans multiple files and follows a separation of concerns between data structures and UI rendering:

1. **Data Structure (`payment-insertion.js`):**
   - Defines how payment records are stored internally
   - Handles the algorithm for inserting payments into interest tables
   - Contains the `createPaymentRow()` function which creates the data object for a payment row
   - Handles interest-first payment application logic
   - Allows negative principal for overpayments

2. **UI Creation (`dom/payments.js`):**
   - Contains `insertPaymentRow()` to add new editable payment rows
   - Contains `insertPaymentRowFromData()` to restore saved payment rows
   - Manages date inputs with Flatpickr datepickers
   - Handles payment deletion with confirmation dialogs
   - Implements validation for payment dates

3. **Table Rendering (`dom/tables.interest.js`):** 
   - Renders the complete interest tables including payment rows
   - Controls the display of payment effects on interest and principal
   - Implements sophisticated chronological sorting logic for mixed row types

4. **State Management (`store.js`):**
   - Stores payment records in the application state
   - Provides actions for adding, updating, and removing payments
   - Handles saving and restoring payment state when toggling prejudgment calculations
   - Includes default payment record in demonstration mode

## Non-Obvious Implementation Details

### Default Payment Record

When the application is reset with default values (`resetStore(true)`), a default payment record is included:
```javascript
payments: useDefaults ? [{ date: '2021-10-13', amount: 500 }] : []
```
This default payment is used for demonstration purposes and should be considered when testing or developing new features.

### HTML Structure vs. Display Format

The payment rows in the UI can be presented in different formats:

1. **Initial implementation:**
   ```
   |2021-10-13|Payment received: $500.00<br>Principal: -$X.XX    Interest: -$Y.YY|$500.00|   |   |
   ```

2. **Simplified format:**
   ```
   |2021-10-13|Payment received: $500.00||||
   ```

3. **Current standard implementation:**
   ```
   |2021-10-13|Payment received: [editable field]||||
   ```

The current standard is to embed the payment amount as an editable field within the description cell, which provides a more intuitive user experience.

### Currency Formatting

The `formatCurrencyForDisplay()` function in `utils.currency.js` returns HTML with span tags, not plain text:

```javascript
// Returns something like: <span class="currency">$500.00</span>
formatCurrencyForDisplay(500);
```

When using this function's output:
- Use `innerHTML` not `textContent` to properly render the HTML
- Remember to handle HTML escaping if combining with user input

### DOM Event Handling

Payments trigger multiple events and state updates:
- When a payment is inserted, recalculation is triggered via `payment-updated` events
- Newly created payment rows focus on the amount field automatically
- Payment amounts immediately update the interest-first payment application
- The complete event flow is:
  1. User adds or modifies a payment
  2. A `payment-updated` custom event is dispatched
  3. Event listeners trigger recalculation of interest tables
  4. UI is updated to reflect the new calculations

### Integration with Interest Tables

Interest tables handle multiple row types (interest periods, payments, special damages) which must be properly sorted chronologically. Payment rows:
- Are identified with CSS class `payment-row`
- Show negative values for principal and interest with special styling (`negative-value` class)
- Are sorted and inserted based on date

### Chronological Sorting Logic

The application implements sophisticated logic for sorting different row types in chronological order:

1. Interest calculation row/segment ending on a specific day
2. Special Damage entry on that day (if applicable)
3. Payment row for a payment made on that day
4. Interest calculation row/segment starting on that day

This ordering ensures that calculations are performed correctly and that the UI presents a logical flow of events.

### HTML vs. Text Content

When updating the payment description:
- `textContent` will display HTML tags literally
- `innerHTML` will render the HTML but requires careful escaping
- For dynamic updates, consider the security implications of using innerHTML

### Input Field Location

The editable payment amount field can be located in different cells:
1. In a dedicated column (original implementation)
2. Embedded within the description cell (current standard implementation)

The current implementation embeds the payment amount field within the description cell, creating a more intuitive user interface.

### Row Highlighting

Newly added payment rows receive a temporary `highlight-new-row` class that is removed after a short delay (2000ms). This provides visual feedback to users when a new payment row is added.

### Payment Date Validation

Payment dates are validated using the `validatePaymentDate()` function, which ensures:
- The date is a valid date object
- The date falls within the allowed range (after prejudgment date and before or on judgment date + 1 year)
- The date format is consistent (YYYY-MM-DD)

### Payment Deletion Flow

When a user attempts to delete a payment:
1. If the payment amount is zero, it's deleted immediately
2. Otherwise, a confirmation dialog is shown with payment details
3. If confirmed, the payment is removed from both the DOM and the store
4. A `payment-updated` event is triggered to recalculate interest

## Payment Algorithm Summary

The current payment insertion algorithm:

1. Determines which table (prejudgment/postjudgment) to use based on payment date
2. Finds the calculation row containing the payment date
3. Splits the row at the payment date if necessary
4. Applies payment first to interest, then to principal
5. Allows negative principal for overpayments
6. Updates all subsequent periods with the new principal
7. Processes multiple payments in chronological order

This implementation follows a clean, functional approach with immutable state updates and comprehensive validation.

## Common Pitfalls

1. **HTML Tag Display:** Using `textContent` instead of `innerHTML` for currency display will show raw HTML.

2. **Event Coordination:** Changes to payment amounts must trigger recalculation events.

3. **Input References:** Be careful with variable references - ensure the correct inputs are focused.

4. **Row Classification:** Interest tables contain multiple row types that need different styling and event handling.

5. **Split Implementation:** Remember that payment row creation spans multiple files, so changes often need to be made in multiple places.

6. **Testing with Test-Payment-Insertion:** The test button may not show all UI changes - test with the actual "Record Payment" functionality.

7. **Default Payment in Demo Mode:** Be aware that demo mode includes a default payment record that may affect testing.

8. **Flatpickr Integration:** The date inputs are managed by Flatpickr, which has its own event handling and validation.

## Store Integration

Payment records are stored in the application state using Zustand:

```javascript
// In store.js
results: {
    // ... other properties
    payments: [] // Array of payment objects
}
```

The store provides several actions for managing payments:
- `addPayment(payment)`: Adds a new payment to the store
- `updatePayment(index, payment)`: Updates an existing payment
- `removePayment(index)`: Removes a payment at the specified index
- `calculatePaymentTotal()`: Calculates the total amount of all payments
- `savePrejudgmentState()`: Saves the current payments when toggling prejudgment off
- `restorePrejudgmentState()`: Restores saved payments when toggling prejudgment on

When working with payments, always use these store actions to ensure consistent state management.

## Related Documentation

For more details, refer to:
- `documents/payment tracking/payment_insertion_implementation.md`
- `documents/payment tracking/current_payment_algorithm.md`
- `documents/payment tracking/payment_tracking_implementation_plan.md`
