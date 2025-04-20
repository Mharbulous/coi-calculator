# Task 30: Standardize Date Calculations and Data Representation

## Overview

This task will standardize how the application calculates days between dates and how date ranges are represented in the data.

## Core Principle

The new standard will:

*   **Day counting**: Exclude the first date, include the last date in a range
*   **Date ranges**: Use half-open intervals \[start, end) where end is the start of the next period

## Implementation Overview

Here's a concise overview of the changes needed for each file:

**utils.date.js**:

*   Modify `daysBetween` to remove the +1 and handle same-day edge case (return 0)
*   Review other date comparison functions to ensure compatibility

**calculations.js**:

*   Adapt the date range comparisons to work with the existing data structure
*   Modify interest calculation logic to work with the new day counting approach
*   Update special damages processing to use the new date range interpretation

**Test Files**:

*   Update all test expectations to reflect the new day counting approach
*   Add tests for edge cases like same-day calculations

**Note**: We will NOT be modifying the `interestRates.js` file. Instead, the calculations will adapt to work with the existing data structure while implementing the new day counting approach (excluding the first date, including the last date).

## Files and Functions to Update

### 1\. utils.date.js

*   `daysBetween`: Modify to exclude the first date (remove the +1 and handle edge cases)
*   `datesEqual`, `dateBefore`, `dateAfter`, `dateOnOrBefore`, `dateOnOrAfter`: Review and ensure compatibility with new approach

### 2\. calculations.js

*   `getInterestRateForDate`: Adapt to work with the existing date range representation while using the new day counting approach
*   `getApplicableRatePeriods`: Adapt to work with the existing date range representation while using the new day counting approach
*   `calculateSegmentInterest`: Update to work with the new day counting approach
*   `processSpecialDamages`: Update to correctly assign damages to segments
*   `calculateFinalPeriodDamageInterest`: Update to handle the new day counting

### 4\. Test Files

*   **calculations.test.periods.js**: Update test expectations for the new day counting approach
*   **calculations.test.perdiem.js**: Update test expectations for the new day counting approach
*   **utils.test.date.js**: Update test expectations for `daysBetween` and other date functions

## Detailed Implementation Steps

### 1\. Update `utils.date.js`

#### Modify `daysBetween` function:

```javascript
// CURRENT IMPLEMENTATION (inclusive)
export function daysBetween(date1, date2) {
    if (!date1 || !date2 || isNaN(date1.getTime()) || isNaN(date2.getTime())) {
        return 0;
    }
    
    // Normalize dates to midnight UTC
    const normalizedDate1 = normalizeDate(date1);
    const normalizedDate2 = normalizeDate(date2);
    
    // Check if normalized date2 is before normalized date1
    if (normalizedDate2.getTime() < normalizedDate1.getTime()) {
        return 0;
    }
    
    // Calculate difference in milliseconds between normalized dates
    const differenceInMilliseconds = normalizedDate2.getTime() - normalizedDate1.getTime();
    
    // Convert milliseconds to days and add 1 for inclusivity
    return Math.round(differenceInMilliseconds / (1000 * 60 * 60 * 24)) + 1;
}

// NEW IMPLEMENTATION (exclude first date, include last date)
export function daysBetween(date1, date2) {
    if (!date1 || !date2 || isNaN(date1.getTime()) || isNaN(date2.getTime())) {
        return 0;
    }
    
    // Normalize dates to midnight UTC
    const normalizedDate1 = normalizeDate(date1);
    const normalizedDate2 = normalizeDate(date2);
    
    // Check if normalized date2 is before normalized date1
    if (normalizedDate2.getTime() < normalizedDate1.getTime()) {
        return 0;
    }
    
    // Check if dates are the same day
    if (datesEqual(normalizedDate1, normalizedDate2)) {
        return 0; // Same day = 0 days between
    }
    
    // Calculate difference in milliseconds between normalized dates
    const differenceInMilliseconds = normalizedDate2.getTime() - normalizedDate1.getTime();
    
    // Convert milliseconds to days (no +1 for exclusivity of first date)
    return Math.round(differenceInMilliseconds / (1000 * 60 * 60 * 24));
}
```

### 3\. Update `calculations.js`

#### Modify `daysBetween`:

```javascript
// CURRENT IMPLEMENTATION (inclusive)
export function daysBetween(date1, date2) {
    if (!date1 || !date2 || isNaN(date1.getTime()) || isNaN(date2.getTime())) {
        return 0;
    }
    
    // Normalize dates to midnight UTC
    const normalizedDate1 = normalizeDate(date1);
    const normalizedDate2 = normalizeDate(date2);
    
    // Check if normalized date2 is before normalized date1
    if (normalizedDate2.getTime() < normalizedDate1.getTime()) {
        return 0;
    }
    
    // Calculate difference in milliseconds between normalized dates
    const differenceInMilliseconds = normalizedDate2.getTime() - normalizedDate1.getTime();
    
    // Convert milliseconds to days and add 1 for inclusivity
    return Math.round(differenceInMilliseconds / (1000 * 60 * 60 * 24)) + 1;
}

// NEW IMPLEMENTATION (exclude first date, include last date)
export function daysBetween(date1, date2) {
    if (!date1 || !date2 || isNaN(date1.getTime()) || isNaN(date2.getTime())) {
        return 0;
    }
    
    // Normalize dates to midnight UTC
    const normalizedDate1 = normalizeDate(date1);
    const normalizedDate2 = normalizeDate(date2);
    
    // Check if normalized date2 is before normalized date1
    if (normalizedDate2.getTime() < normalizedDate1.getTime()) {
        return 0;
    }
    
    // Check if dates are the same day
    if (datesEqual(normalizedDate1, normalizedDate2)) {
        return 0; // Same day = 0 days between
    }
    
    // Calculate difference in milliseconds between normalized dates
    const differenceInMilliseconds = normalizedDate2.getTime() - normalizedDate1.getTime();
    
    // Convert milliseconds to days (no +1 for exclusivity of first date)
    return Math.round(differenceInMilliseconds / (1000 * 60 * 60 * 24));
}
```

#### Adapt calculations.js to work with existing data:

```javascript
// In getInterestRateForDate and other functions:
// We continue to use <= for end date checks because the rate periods in the data are inclusive
// But we use the new daysBetween function which excludes the first date and includes the last date
const ratePeriod = jurisdictionRates.find(rate => {
    return normalizedDate.getTime() >= rate.start.getTime() && 
           normalizedDate.getTime() <= rate.end.getTime();
});
```

### 4\. Update Test Files

#### Update `utils.test.date.js`:

```javascript
// CURRENT TEST
it('should return 1 for the same start and end date', () => {
    const date = createUTCDate(2024, 3, 15);
    expect(daysBetween(date, date)).toBe(1);
});

// NEW TEST
it('should return 0 for the same start and end date', () => {
    const date = createUTCDate(2024, 3, 15);
    expect(daysBetween(date, date)).toBe(0);
});

// CURRENT TEST
it('should return the correct number of days for consecutive dates', () => {
    const date1 = createUTCDate(2024, 3, 15);
    const date2 = createUTCDate(2024, 3, 16);
    expect(daysBetween(date1, date2)).toBe(2);
});

// NEW TEST
it('should return the correct number of days for consecutive dates', () => {
    const date1 = createUTCDate(2024, 3, 15);
    const date2 = createUTCDate(2024, 3, 16);
    expect(daysBetween(date1, date2)).toBe(1);
});
```

#### Update `calculations.test.periods.js` and `calculations.test.perdiem.js`:

All tests that expect specific day counts or interest calculations will need to be updated to reflect the new day counting approach.

## Expected Outcomes

*   Consistent day counting across the application (excluding first date, including last date)
*   No gaps or overlaps in interest rate periods
*   Accurate interest calculations with the new approach
*   All tests passing with updated expectations

## Potential Challenges

*   Adapting calculations to work with the existing data structure
*   Handling edge cases (e.g., calculations on the same day)
*   Maintaining calculation accuracy during the transition

## Testing Strategy

1.  **Unit Tests**: Update all unit tests to reflect the new day counting approach
2.  **Integration Tests**: Create tests that verify the entire calculation pipeline works correctly
3.  **Edge Cases**: Add specific tests for:
    *   Same day calculations (should return 0 days)
    *   One day apart (should return 1 day)
    *   Calculations spanning rate period boundaries

## Verification Steps

1.  Run all tests to ensure they pass with the new implementation
2.  Manually verify interest calculations for sample periods:
    *   Simple period within a single rate
    *   Period spanning multiple rates
    *   Period with special damages
3.  Compare results with expected values calculated manually

## Rollout Plan

1.  Implement changes in a feature branch
2.  Run comprehensive tests
3.  Review changes with the team
4.  Merge to main branch
5.  Monitor for any issues in production