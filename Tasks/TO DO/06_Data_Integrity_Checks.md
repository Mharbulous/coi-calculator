# Task: Add Interest Rate Data Integrity Checks

**Goal:** Increase the robustness of the calculator by adding checks to validate the raw interest rate data during the processing step, preventing potential errors caused by malformed data.

**Context:**
The calculator relies on the interest rate data in `interestRates.js` being correctly structured and chronologically contiguous. Errors in this data (e.g., overlapping date ranges, gaps, invalid dates) could lead to incorrect calculations or runtime errors.

**Target File:**
*   `BC COIA calculator/interestRates.js`

**Requirements:**

1.  **Enhance Rate Processing Logic:**
    *   Locate the section in `interestRates.js` where the raw `rates` object is processed into `processedRates` (the loop iterating through jurisdictions and mapping/sorting rates).
    *   Within this processing logic, *after* sorting the rates by start date for a given jurisdiction, add checks to verify data integrity:
        *   **Overlap Check:** Iterate through the sorted rates and ensure that the `start` date of a rate period is *after* the `end` date of the previous rate period. If `rate[i].start <= rate[i-1].end`, log a warning indicating an overlap.
        *   **Gap Check:** Ensure that the `start` date of a rate period is *exactly one day after* the `end` date of the previous rate period. If `rate[i].start` is not the day after `rate[i-1].end`, log a warning indicating a potential gap in coverage. (Note: Be careful with timezones/UTC when comparing "one day after").
        *   **Date Validity:** The existing `parseUTCDate` already provides some validation, but ensure any `null` results from parsing are handled gracefully (the current `.filter(rate => rate !== null)` does this, which is good).

2.  **Logging:**
    *   Use `console.warn` or `console.error` to log informative messages when integrity issues (overlaps, gaps) are detected. Include the jurisdiction and the specific rate periods involved in the message.

**Acceptance Criteria:**
*   The rate processing logic in `interestRates.js` includes checks for overlapping date ranges between consecutive rate periods within a jurisdiction.
*   The logic includes checks for gaps between consecutive rate periods within a jurisdiction.
*   Appropriate warning messages are logged to the console if overlaps or gaps are detected during the initial processing of rates.
*   The calculator continues to function correctly with valid data.
*   The `processedRates` object exported by the module remains structurally the same (an object with jurisdictions as keys and arrays of processed rate objects as values).

**Notes:**
*   These checks run only once when the `interestRates.js` module is loaded and processed. They are intended to catch data entry errors in the source `rates` object.
*   The primary goal is to *detect and warn* about data issues, not necessarily to automatically fix them, as the correct fix requires understanding the source data.
*   Ensure date comparisons correctly handle UTC and the "end of day" logic used for the `end` dates.
