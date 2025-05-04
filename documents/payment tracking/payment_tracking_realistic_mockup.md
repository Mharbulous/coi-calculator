# Payment Tracking Realistic Mockup

This mockup shows how payment tracking would integrate with the actual interest calculation tables in the BC COIA Calculator, based on the current application structure.

## Prejudgment Interest Calculations

| Date       | Description                         | Rate    | Principal     | Interest    |
|------------|-------------------------------------|---------|---------------|-------------|
| 2021-04-09 | 83 days                             | 0.50%   | $10,000.00    | $11.37      |
| 2021-04-30 | Payment received ($500.00)          |         |               |             |
|            | └─ Applied to interest              |         |               | -$11.37     |
|            | └─ Applied to principal             |         | -$488.63      |             |
| 2021-07-01 | 62 days                             | 0.80%   | $9,511.37     | $12.91      |
| 2022-01-01 | 184 days                            | 0.70%   | $9,511.37     | $33.92      |
| 2022-07-01 | 181 days                            | 2.05%   | $9,511.37     | $97.53      |
| 2022-08-15 | 45 days                             | 2.05%   | $9,511.37     | $24.24      |
| 2022-08-15 | Payment received ($1,000.00)        |         |               |             |
|            | └─ Applied to interest              |         |               | -$168.60    |
|            | └─ Applied to principal             |         | -$831.40      |             |
| 2023-01-01 | 139 days                            | 4.85%   | $8,679.97     | $161.03     |
| 2023-07-01 | 181 days                            | 5.40%   | $8,679.97     | $230.20     |
| 2024-01-01 | 184 days                            | 4.80%   | $8,679.97     | $210.11     |
| 2024-07-01 | 182 days                            | 5.40%   | $8,679.97     | $156.21     |
| 2024-10-31 | 122 days                            | 5.40%   | $8,679.97     | $104.67     |
| 2024-10-31 | Total: 1363 days                    |         | $8,679.97     | $862.22     |

## Postjudgment Interest Calculations

| Date       | Description                         | Rate    | Principal     | Interest    |
|------------|-------------------------------------|---------|---------------|-------------|
| 2024-10-31 | 20 days                             | 7.30%   | $8,679.97     | $34.97      |
| 2024-11-20 | Payment received ($500.00)          |         |               |             |
|            | └─ Applied to interest              |         |               | -$34.97     |
|            | └─ Applied to principal             |         | -$465.03      |             |
| 2025-01-01 | 42 days                             | 7.30%   | $8,214.94     | $69.42      |
| 2025-01-01 | 123 days                            | 5.90%   | $8,214.94     | $164.45     |
| 2025-05-04 | Total: 185 days                     |         | $8,214.94     | $268.84     |

## Notes on Implementation

1. **Integration with Current Table Structure:**
   - Payment rows will be inserted chronologically based on payment date
   - Each payment has a main row plus two detail rows showing allocation and remaining principal
   - Interest is calculated up to the payment date to ensure proper application

2. **Interest Calculation for Payments:**
   - The system calculates interest up to the payment date automatically
   - When a payment is received on any day other than interest period start dates (Jan 1 or Jul 1), a new row is added to calculate the partial period interest
   - Payment is then applied first to accrued interest, then to principal
   - The calculation handles partial periods properly to ensure accurate interest

3. **Visual Distinctions:**
   - Payment rows are highlighted to stand out from regular interest calculations
   - Detail rows are indented and use a lighter color scheme
   - Payment amounts are shown in red to distinguish from regular calculations

4. **Principal Updates:**
   - After each payment, subsequent interest calculations use the updated principal amount
   - The final total shows the adjusted principal amount after all payments

This mockup demonstrates how payments on specific dates (April 30, 2021, August 15, 2022, and November 20, 2024) would be processed and displayed within the existing interest calculation framework.
