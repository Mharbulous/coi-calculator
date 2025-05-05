# Payment Tracking Realistic Mockup

This mockup shows how payment tracking would integrate with the actual interest calculation tables in the BC COIA Calculator, based on the current application structure.

## Prejudgment Interest Calculations

| Date | Description | Rate | Principal | Interest |
| --- | --- | --- | --- | --- |
| 2021-04-09 |   |   | $10,000.00 |   |
| 2021-04-30 | 20 days | 0.50% |   | $2.74 |
| 2021-04-30 | Payment received ($500.00) |   | \-$488.77 |   |
|   |   |   |   | \-$11.23 |
| 2021-05-01 |   |   | $9,511.23 |   |
| 2021-07-01 | 61 days | 0.50% |   | $7.95 |
| 2021-07-01 |   |   | $9,511.23 |   |
| 2022-01-01 | 184 days | 0.80% |   | $38.52 |
| 2022-01-01 |   |   | $9,511.23 |   |
| 2022-07-01 | 181 days | 0.70% |   | $33.25 |
| 2022-07-01 |   |   | $9,511.23 |   |
| 2022-08-15 | 45 days | 2.05% |   | $24.12 |
| 2022-08-15 | Payment received ($1,000.00) |   | \-$904.11 |   |
|   |   |   |   | \-$95.89 |
| 2022-08-16 |   |   | $8,607.12 |   |
| 2023-01-01 | 137 days | 2.05% |   | $66.47 |
| 2023-01-01 |   |   | $8,607.12 |   |
| 2023-07-01 | 181 days | 4.85% |   | $210.27 |
| 2023-07-01 |   |   | $8,607.12 |   |
| 2024-01-01 | 184 days | 5.40% |   | $236.18 |
| 2024-01-01 |   |   | $8,607.12 |   |
| 2024-07-01 | 182 days | 4.80% |   | $205.82 |
| 2024-07-01 |   |   | $8,607.12 |   |
| 2024-10-31 | 122 days | 5.40% |   | $154.85 |
| 2024-10-31 | Judgment date |   |   |   |
| 2024-10-31 | Total: 1298 days (ending 2024-10-31) |   | $8,607.12 | $879.24 |

## Postjudgment Interest Calculations

| Date | Description | Rate | Principal | Interest |
| --- | --- | --- | --- | --- |
| 2024-10-31 |   |   | $8,607.12 |   |
| 2024-11-20 | 20 days | 7.30% |   | $34.68 |
| 2024-11-20 | Payment received ($500.00) |   | \-$465.32 |   |
|   |   |   |   | \-$34.68 |
| 2024-11-21 |   |   | $8,141.80 |   |
| 2025-01-01 | 41 days | 7.30% |   | $67.66 |
| 2025-01-01 |   |   | $8,141.80 |   |
| 2025-05-04 | 124 days | 5.90% |   | $164.08 |
| 2025-05-04 | Total: 185 days (ending 2025-05-04) |   | $8,141.80 | $266.42 |

## Notes on Implementation

**Integration with Current Table Structure:**

*   Payment rows will be inserted chronologically based on payment date
*   Each payment has a main row plus a detail row showing allocation to principal and interest
*   Interest is calculated up to the payment date to ensure proper application

**Interest Calculation for Payments:**

*   The system calculates interest up to the payment date automatically
*   When a payment is received on any day other than interest period start dates (Jan 1 or Jul 1), a new row is added to calculate the partial period interest
*   Payment is then applied first to accrued interest, then to principal
*   The calculation handles partial periods properly to ensure accurate interest

**Visual Distinctions:**

*   Payment rows are highlighted to stand out from regular interest calculations
*   Detail rows use a lighter color scheme
*   Payment amounts are shown in red to distinguish from regular calculations

**Principal Updates:**

*   After each payment, subsequent interest calculations use the updated principal amount
*   The final total shows the adjusted principal amount after all payments

This mockup demonstrates how payments on specific dates (April 30, 2021, August 15, 2022, and November 20, 2024) would be processed and displayed within the existing interest calculation framework.