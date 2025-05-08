# Task 59.3: Implement Interest Table Splitting Logic

## Background

When a payment is made in the middle of an interest period, that period needs to be split into two parts: before and after the payment. This ensures interest is calculated correctly for each part using the appropriate principal amount.

## Objective

Implement logic to split interest periods when a payment occurs within them, ensuring accurate interest calculations for both segments and proper handling of edge cases.

## Requirements

### Period Splitting Logic

*   Create a function to split an interest period when a payment falls within it
*   **Data Representation:** When a period from `startDate` to `endDate` with `originalPrincipal` is split by a payment on `paymentDate`, it should be replaced in the calculation results array by two objects representing the segments:
    *   Segment 1: `startDate` to `paymentDate - 1 day`, using `originalPrincipal`.
    *   Segment 2: `paymentDate` to `endDate`, using `reducedPrincipal`.
    *   Each segment object should retain necessary properties (rate, days, calculated interest, etc.) and potentially a flag indicating it's a split segment.
*   Calculate interest for the first segment using the original principal
*   Calculate interest for the second segment using the reduced principal
*   Ensure all date ranges are correctly maintained

### Edge Case Handling

*   Payments on period boundaries (first or last day of a period):
    *   For payments on the last day: Place the payment row after the completed interest period
    *   For payments on the first day: Place the payment row before the interest period
*   **Multiple Payments:** The splitting logic must recursively handle multiple payments within the same original interest period. If a segment is created by one split, a subsequent payment within that segment's date range should split _that segment_ further.
*   **Payment on Rate Change Date:** For payments made on the _exact_ date an interest rate changes: The interest for that _entire day_ should be calculated using the rate effective _at the start_ of the day. The payment is then applied _after_ that day's interest calculation. The new rate applies from the _next_ day onwards.

### Integration with Existing Calculation Logic

*   **Integration Point:** Evaluate whether to modify `getApplicableRatePeriods` in `calculations.js` directly or to implement splitting as a separate processing step _after_ initial period generation. This separate step would take the standard periods and the payment list as input and produce the final list of segments and payments. Choose the approach that maintains clarity and modularity.
*   Ensure the existing interest rate lookup functions are used consistently
*   Maintain compatibility with the current interest calculation flow

## Implementation Steps

1.  Analyze the current `getApplicableRatePeriods` function to understand how periods are determined
2.  Extend or modify this function to handle period splitting for payments
3.  Create a function to determine if a payment requires period splitting
4.  Implement logic to recalculate interest for split periods
5.  Ensure correct date handling throughout the splitting process

## Testing

*   Test payment on the first day of a period (no split needed)
*   Test payment on the last day of a period (no split needed)
*   Test payment in the middle of a period (requires split)
*   Test multiple payments in the same period
*   Test payments at various points in the interest calculation timeline
*   Compare results with the example in `pay_table.md`

## Acceptance Criteria

*   Interest periods are correctly split when payments fall within them
*   Interest is calculated correctly for both segments with the appropriate principal
*   Edge cases are properly handled
*   Results match the expected behavior shown in `pay_table.md`
*   The solution integrates seamlessly with the existing calculation system