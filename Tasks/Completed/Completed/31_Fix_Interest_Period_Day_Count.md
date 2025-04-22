# Task 31: Fix Interest Period Day Count

## Problem Description

There's a bug in the interest calculation where the number of days in the first row of interest calculation tables is incorrect. Specifically:

- For the date range 2024-04-20 to 2024-07-01, the app shows 71 days
- Manual count shows it should be 72 days (April 21-30: 10 days, May: 31 days, June: 30 days, July 1: 1 day)

Users have reported this discrepancy, and it affects the accuracy of interest calculations.

## Investigation

The issue is in how date ranges are determined for interest rate periods. Here's what's happening:

1. In `interestRates.js`, rate periods are defined with start dates, and end dates are calculated as the day before the next period starts. For example, the rate period starting on 2024-01-01 has an end date of 2024-06-30 (the day before the next rate period starts on 2024-07-01).

2. In `getApplicableRatePeriods` function in `calculations.js`, these rate periods are used to determine segments for interest calculation. For the first segment, it uses the start date of 2024-04-20 and the end date of 2024-06-30 (the end of the rate period).

3. When calculating days between 2024-04-20 and 2024-06-30 using the `daysBetween` function, it returns 71 days, which is correct for that range.

4. However, we should be counting from 2024-04-20 to 2024-07-01 (including the day when the rate changes), which would be 72 days.

The root cause is that the `getApplicableRatePeriods` function is using the end date of the rate period (2024-06-30) instead of the start of the next rate period (2024-07-01) when determining segment boundaries.

## Solution

Modify the `getApplicableRatePeriods` function in `calculations.js` to use the start date of the next rate period as the end date for the current segment, rather than using the end date of the current rate period.

Here's how to implement the fix:

1. Change the function to find the rate period index instead of just the rate period:

```javascript
const ratePeriodIndex = jurisdictionRates.findIndex(rate =>
    currentTime >= rate.start.getTime() && currentTime <= rate.end.getTime()
);

if (ratePeriodIndex === -1) {
    // Skip to the next day if no rate period is found
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    continue;
}

const ratePeriod = jurisdictionRates[ratePeriodIndex];
```

2. Find the next rate period if it exists:

```javascript
const nextRatePeriod = ratePeriodIndex < jurisdictionRates.length - 1 ? 
                      jurisdictionRates[ratePeriodIndex + 1] : null;
```

3. Use the start date of the next rate period as the end date for the current segment:

```javascript
let segmentEndDate;

if (nextRatePeriod && nextRatePeriod.start <= endDate) {
    // If there's a next rate period and it starts before or on the end date,
    // use the next rate period's start date as the end date for this segment
    segmentEndDate = new Date(nextRatePeriod.start);
} else {
    // Otherwise use the end date of the calculation
    segmentEndDate = new Date(endDate);
}
```

4. Make sure to handle the case where we're at the end date to prevent infinite loops:

```javascript
// Move to the day after the segment ends
currentDate = new Date(segmentEndDate);
if (!datesEqual(currentDate, endDate)) {
    // Only increment the date if we're not already at the end date
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
}
```

This change ensures that interest calculations correctly count days between periods, following the rule of "excluding the first day and including the last day."

## Testing

To verify the fix:
1. Enter a prejudgment interest date of 2024-04-20
2. Enter a judgment date of 2024-10-17
3. Check that the first row shows 72 days (from 2024-04-20 to 2024-07-01)
4. Check that the second row shows 108 days (from 2024-07-01 to 2024-10-17)

## Notes

This fix preserves the existing day calculation logic in `daysBetween` while ensuring the correct date ranges are used for each interest period. The key insight is that we need to use the start date of the next rate period as the end date for the current segment, rather than using the end date of the current rate period.
