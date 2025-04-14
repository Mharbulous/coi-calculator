# Task: Implement Unit Testing

**Goal:** Enhance the maintainability and reliability of the COIA Calculator by adding unit tests for critical JavaScript modules.

**Context:**
The application currently lacks automated tests. Adding tests will prevent regressions, verify the correctness of calculations and utility functions, and make future refactoring safer.

**Target Files:**
*   `BC COIA calculator/calculations.js`
*   `BC COIA calculator/utils.js`

**Requirements:**

1.  **Setup Testing Framework:**
    *   Choose and set up a suitable JavaScript testing framework (e.g., Jest or Vitest). Configure it for the project.
    *   Update `package.json` with necessary development dependencies and test scripts.

2.  **Test `utils.js`:**
    *   Write comprehensive tests for all functions:
        *   `parseDateInput`: Test valid dates, invalid formats, null/empty strings.
        *   `formatDateForDisplay`, `formatDateForInput`, `formatDateLong`: Test with valid dates, edge cases (e.g., start/end of month/year), null values. Ensure UTC handling is correct.
        *   `daysBetween`: Test various date ranges, including same day, consecutive days, across month/year boundaries, leap years, invalid inputs.
        *   `isLeap`, `daysInYear`: Test leap and non-leap years.
        *   `parseCurrency`: Test valid numbers, strings with/without '$' and ',', negative numbers, invalid inputs.
        *   `formatCurrencyForInput`, `formatCurrencyForDisplay`: Test positive/negative numbers, zero, large numbers. Verify correct formatting and class application for display.

3.  **Test `calculations.js`:**
    *   Write comprehensive tests for all functions:
        *   `getInterestRateForDate`: Test dates within, before, after, and on the boundaries of rate periods. Test different jurisdictions and interest types (`prejudgment`, `postjudgment`). Test missing rates/jurisdictions.
        *   `calculateInterestPeriods`: This is critical. Test scenarios including:
            *   Periods entirely within one rate segment.
            *   Periods spanning multiple rate segments.
            *   Periods starting/ending exactly on rate change dates.
            *   Calculations involving leap years.
            *   Zero principal amount.
            *   Negative principal amount (should return 0 interest).
            *   Invalid date ranges (end before start).
            *   Missing rates for a portion of the period.
            *   Different jurisdictions.
        *   `calculatePerDiem`: Test with various principal amounts and dates. Test dates with and without applicable postjudgment rates. Test zero/negative principal.

**Acceptance Criteria:**
*   A testing framework is installed and configured.
*   `package.json` includes a script to run tests (e.g., `npm test`).
*   There are dedicated test files (e.g., `utils.test.js`, `calculations.test.js`).
*   Tests cover the specified functions and scenarios with meaningful assertions.
*   All tests pass.
*   Code coverage metrics are generated (optional but recommended).

**Notes:**
*   Ensure all date comparisons and calculations within tests also correctly handle UTC.
*   Mock the `interestRatesData` structure for testing `calculations.js` to isolate it from the actual data file.
