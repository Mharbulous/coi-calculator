# Task 30: Standardize Date Calculations and Data Representation

## Overview
This task will standardize how the application calculates days between dates and how date ranges are represented in the data. The new standard will:
- **Day counting**: Exclude the first date and include the last date in a range
- **Date ranges**: Shift end dates to be the start date of the next period (half-open interval approach)

## Files and Functions to Update

### 1. utils.date.js
- **`daysBetween`**: Modify to exclude the first date (remove the +1 and handle edge cases)
- **`datesEqual`**, **`dateBefore`**, **`dateAfter`**, **`dateOnOrBefore`**, **`dateOnOrAfter`**: Review and ensure compatibility with new approach

### 2. interestRates.js
- **`rates` data structure**: Shift all end dates to be the start date of the next period
  - Example: Change `{ start: "1993-01-01", end: "1993-06-30" }` to `{ start: "1993-01-01", end: "1993-07-01" }`
- **`processedRates` processing**: Update to handle the new date range representation
- **`endOfDayUTC` function**: Review and potentially modify or remove if no longer needed

### 3. calculations.js
- **`getInterestRateForDate`**: Update to handle the new date range representation
- **`getApplicableRatePeriods`**: Update to handle the new date range representation
- **`calculateSegmentInterest`**: Update to work with the new day counting approach
- **`processSpecialDamages`**: Update to correctly assign damages to segments
- **`calculateFinalPeriodDamageInterest`**: Update to handle the new day counting

### 4. Test Files
- **calculations.test.periods.js**: Update test expectations for the new day counting approach
- **calculations.test.perdiem.js**: Update test expectations for the new day counting approach
- **utils.test.date.js**: Update test expectations for `daysBetween` and other date functions

## Implementation Steps

1. **Update Data Structure**:
   - Modify the interest rate data in `interestRates.js` to use the new date range representation
   - Ensure the last period's end date is handled correctly

2. **Update Core Date Functions**:
   - Modify `daysBetween` to exclude the first date
   - Update other date utility functions as needed

3. **Update Calculation Logic**:
   - Modify interest calculation functions to work with the new approach
   - Ensure special damages are correctly processed

4. **Update Tests**:
   - Adjust test expectations to match the new calculation approach
   - Add new tests to verify edge cases (e.g., same day calculations should return 0)

5. **Verify Calculations**:
   - Run comprehensive tests to ensure interest calculations remain accurate
   - Compare results with manual calculations for verification

## Expected Outcomes

- Consistent day counting across the application (excluding first date, including last date)
- No gaps or overlaps in interest rate periods
- Accurate interest calculations with the new approach
- All tests passing with updated expectations

## Potential Challenges

- Ensuring backward compatibility with existing data
- Handling edge cases (e.g., calculations on the same day)
- Maintaining calculation accuracy during the transition
