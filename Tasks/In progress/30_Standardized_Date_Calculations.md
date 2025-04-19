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

**interestRates.js**:

*   Shift all end dates in the `rates` data structure to be the start date of the next period
*   Remove or update the `endOfDayUTC` function which may no longer be needed

**calculations.js**:

*   Update all date range comparisons to use \< instead of \<= for end date checks
*   Modify interest calculation logic to work with the new day counting approach
*   Update special damages processing to use the new date range interpretation

**Test Files**:

*   Update all test expectations to reflect the new day counting approach
*   Add tests for edge cases like same-day calculations

## Files and Functions to Update

### 1\. utils.date.js

*   `daysBetween`: Modify to exclude the first date (remove the +1 and handle edge cases)
*   `datesEqual`, `dateBefore`, `dateAfter`, `dateOnOrBefore`, `dateOnOrAfter`: Review and ensure compatibility with new approach

### 2\. interestRates.js

*   `rates` data structure: Shift all end dates to be the start date of the next period
    *   Example: Change `{ start: "1993-01-01", end: "1993-06-30" }` to `{ start: "1993-01-01", end: "1993-07-01" }`
*   `processedRates` processing: Update to handle the new date range representation
*   `endOfDayUTC` function: Review and potentially modify or remove if no longer needed

### 3\. calculations.js

*   `getInterestRateForDate`: Update to handle the new date range representation
*   `getApplicableRatePeriods`: Update to handle the new date range representation
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

### 2\. Update `interestRates.js`

#### Modify the `rates` data structure:

```javascript
// CURRENT IMPLEMENTATION
const rates = {
    BC: [
        { start: "1993-01-01", end: "1993-06-30", prejudgment: 5.25, postjudgment: 7.25 },
        { start: "1993-07-01", end: "1993-12-31", prejudgment: 4.00, postjudgment: 6.00 },
        // ... more rates
    ],
    // ... other jurisdictions
};

// NEW IMPLEMENTATION
const rates = {
    BC: [
        { start: "1993-01-01", end: "1993-07-01", prejudgment: 5.25, postjudgment: 7.25 },
        { start: "1993-07-01", end: "1994-01-01", prejudgment: 4.00, postjudgment: 6.00 },
        // ... more rates with shifted end dates
    ],
    // ... other jurisdictions
};
```

#### Update the `endOfDayUTC` function:

This function may no longer be needed since we're using the start of the next period as the end date. If we keep it, we should update its usage:

```javascript
// CURRENT IMPLEMENTATION
function endOfDayUTC(date) {
    if (!date || isNaN(date.getTime())) return date;
    const newDate = new Date(date);
    newDate.setUTCHours(23, 59, 59, 999);
    return newDate;
}

// In processedRates:
return {
    ...rate,
    start: startDate,
    end: endOfDayUTC(endDate) // Ensure end date includes the whole day
};

// NEW IMPLEMENTATION
// Either remove the function or update its usage:
return {
    ...rate,
    start: startDate,
    end: endDate // No need to set to end of day
};
```

### 3\. Update `calculations.js`

#### Modify `getInterestRateForDate`:

```javascript
// CURRENT IMPLEMENTATION
const ratePeriod = jurisdictionRates.find(rate => {
    // Check if the normalized date is on or after the start date and on or before the end date
    return normalizedDate.getTime() >= rate.start.getTime() && 
           normalizedDate.getTime() <= rate.end.getTime();
});

// NEW IMPLEMENTATION
const ratePeriod = jurisdictionRates.find(rate => {
    // Check if the normalized date is on or after the start date and before the end date
    return normalizedDate.getTime() >= rate.start.getTime() && 
           normalizedDate.getTime() < rate.end.getTime();
});
```

#### Update `getApplicableRatePeriods`:

```javascript
// CURRENT IMPLEMENTATION
const ratePeriod = jurisdictionRates.find(rate =>
    currentTime >= rate.start.getTime() && currentTime <= rate.end.getTime()
);

// NEW IMPLEMENTATION
const ratePeriod = jurisdictionRates.find(rate =>
    currentTime >= rate.start.getTime() && currentTime < rate.end.getTime()
);
```

#### Update `processSpecialDamages`:

```javascript
// CURRENT IMPLEMENTATION
// Check if damage date is within this segment
if (normalizedDamageDate >= normalizedSegmentStart && normalizedDamageDate <= normalizedSegmentEnd) {
    return {
        ...damage,
        segmentIndex: i,
        inFinalSegment: segment.isFinalSegment
    };
}

// NEW IMPLEMENTATION
// Check if damage date is within this segment
if (normalizedDamageDate >= normalizedSegmentStart && normalizedDamageDate < normalizedSegmentEnd) {
    return {
        ...damage,
        segmentIndex: i,
        inFinalSegment: segment.isFinalSegment
    };
}
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

*   Ensuring backward compatibility with existing data
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