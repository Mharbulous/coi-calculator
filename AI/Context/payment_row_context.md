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

2. **UI Creation (`dom/payments.js`):**
   - Contains `insertPaymentRow()` to add new editable payment rows
   - Contains `insertPaymentRowFromData()` to restore saved payment rows
   - Manages date inputs with datepickers
   - Handles payment deletion

3. **Table Rendering (`dom/tables.interest.js`):** 
   - Renders the complete interest tables including payment rows
   - Controls the display of payment effects on interest and principal

## Non-Obvious Implementation Details

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

3. **Editable field in description format:**
   ```
   |2021-10-13|Payment received: [editable field]||||
   ```

Each format affects multiple files and requires coordinated changes.

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

### Integration with Interest Tables

Interest tables handle multiple row types (interest periods, payments, special damages) which must be properly sorted chronologically. Payment rows:
- Are identified with CSS class `payment-row`
- Show negative values for principal and interest with special styling
- Are sorted and inserted based on date

### HTML vs. Text Content

When updating the payment description:
- `textContent` will display HTML tags literally
- `innerHTML` will render the HTML but requires careful escaping
- For dynamic updates, consider the security implications of using innerHTML

### Input Field Location

The editable payment amount field can be located in different cells:
1. In a dedicated column (original implementation)
2. Embedded within the description cell (newer implementation)

The choice affects both the visual presentation and event handling.

## Common Pitfalls

1. **HTML Tag Display:** Using `textContent` instead of `innerHTML` for currency display will show raw HTML.

2. **Event Coordination:** Changes to payment amounts must trigger recalculation events.

3. **Input References:** Be careful with variable references - ensure the correct inputs are focused.

4. **Row Classification:** Interest tables contain multiple row types that need different styling and event handling.

5. **Split Implementation:** Remember that payment row creation spans multiple files, so changes often need to be made in multiple places.

6. **Testing with Test-Payment-Insertion:** The test button may not show all UI changes - test with the actual "Record Payment" functionality.

## Related Documentation

For more details, refer to:
- `documents/payment tracking/payment_insertion_implementation.md`
- `documents/payment tracking/current_payment_algorithm.md`
- `documents/payment tracking/payment_tracking_implementation_plan.md`
