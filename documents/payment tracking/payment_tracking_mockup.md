# Payment Tracking Implementation Mockup

This document provides a visual mockup of how the payment tracking feature will look and function in the BC Court Order Interest Act Calculator.

## Feature Overview

The payment tracking feature will allow users to:
1. Record payments by date and amount
2. Automatically calculate how payments are applied to interest and principal
3. See updated interest calculations based on the remaining principal

## UI Components

### "Record Payment" Button
- Location: Below the Per Diem row
- Styling: Uses the existing blue and white color scheme (matching "add special damages" button)
- Function: Opens a modal for payment entry

### Payment Entry Modal
- Fields:
  - Payment Date (date picker)
  - Payment Amount (currency input)
- Buttons:
  - "Cancel" (amber color)
  - "Record Payment" (blue and white, matching app theme)

## Table Integration

Payments will be integrated into the interest calculation tables with the following workflow:

1. When a payment is recorded, an interest calculation row will be added up to the payment date
2. A payment row will be inserted showing how the payment is applied
3. Interest calculations continue with the updated principal amount

---

## Visual Mockup: Interest Table with Payments

### Prejudgment Interest Table

| Date       | Description                    | Rate  | Principal        | Interest       |
|------------|--------------------------------|-------|------------------|----------------|
| 2024-01-01 | Start of prejudgment interest  | 5.00% | $10,000.00       | -              |
| 2024-02-15 | 45 days                        | 5.00% | $10,000.00       | $61.64         |
| 2024-02-15 | Payment received ($500.00)     |       |                  |                |
|            | └─ Applied to interest         |       |                  | -$61.64        |
|            | └─ Applied to principal        |       | -$438.36         |                |
| 2024-04-15 | 60 days                        | 5.00% | $9,561.64        | $78.53         |
| 2024-04-15 | Payment received ($750.00)     |       |                  |                |
|            | └─ Applied to interest         |       |                  | -$78.53        |
|            | └─ Applied to principal        |       | -$671.47         |                |
| 2024-08-15 | 122 days                       | 5.50% | $8,890.17        | $163.39        |
| 2024-08-15 | Payment received ($1,000.00)   |       |                  |                |
|            | └─ Applied to interest         |       |                  | -$163.39       |
|            | └─ Applied to principal        |       | -$836.61         |                |
| 2024-11-30 | 107 days                       | 5.50% | $8,053.56        | $129.53        |
| **Total**  |                                |       | **$8,053.56**    | **$129.53**    |

### Postjudgment Interest Table

| Date       | Description                    | Rate  | Principal        | Interest       |
|------------|--------------------------------|-------|------------------|----------------|
| 2024-12-01 | Start of postjudgment interest | 6.00% | $8,183.09        | -              |
| 2025-02-15 | 76 days                        | 6.00% | $8,183.09        | $102.46        |
| 2025-02-15 | Payment received ($500.00)     |       |                  |                |
|            | └─ Applied to interest         |       |                  | -$102.46       |
|            | └─ Applied to principal        |       | -$397.54         |                |
| 2025-04-15 | 59 days                        | 6.00% | $7,785.55        | $75.46         |
| **Total**  |                                |       | **$7,785.55**    | **$75.46**     |

## Payment Processing Logic

1. **Interest Calculation to Payment Date**:
   - When a payment is recorded, the system will calculate interest up to the payment date
   - This ensures that interest is properly calculated before applying the payment

2. **Payment Application**:
   - Payments are first applied to outstanding interest
   - Any remaining amount is applied to reduce the principal
   - The new principal amount is used for subsequent interest calculations

3. **Visual Display**:
   - A payment row is highlighted to distinguish it from regular calculation rows
   - Sub-rows show exactly how the payment was applied to interest and principal
   - The remaining principal is clearly displayed for transparency

## Implementation Considerations

1. The payment functionality will follow a similar pattern to the existing special damages feature
2. Payment records will be stored in the application state (Zustand store)
3. The existing interest calculation logic will be extended to handle payment adjustments
4. Table rendering in `tables.interest.js` will be updated to include payment rows
5. A new modal component will be created for payment entry

## User Experience

Users will be able to:
1. Enter payments at any time
2. See how payments affect their interest calculations in real-time
3. Get a clear breakdown of how each payment was applied to interest and principal
4. View the updated total amount owing after each payment
