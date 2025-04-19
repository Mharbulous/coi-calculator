# Standardize Date Handling With Consistent Normalization

## Problem

The current codebase uses JavaScript Date objects for date handling, which include time components. This can lead to unexpected results when comparing dates or determining if dates are equal, as the time components may vary. While the code attempts to normalize time components in some places (by using UTC dates), this is not done consistently throughout the codebase.

For example:
- Most dates are stored as Date objects in the Zustand store
- Special damages dates are stored as YYYY-MM-DD strings
- Date comparisons are done directly using Date object methods (e.g., `<`, `>`, `>=`)
- Some calculations normalize dates to the start of the day, but not all

This inconsistency could lead to bugs where date comparisons fail because of time component differences rather than actual date differences.

## Solution

Implement a consistent approach to date handling by ensuring all Date objects are normalized to midnight UTC (00:00:00.000). This will ensure that date comparisons are based solely on the date component, not the time component.

### Implementation Steps

1. **Add a Normalization Utility Function**

   Add a utility function in `utils.js` that normalizes any Date object to midnight UTC:

   ```javascript
   /**
    * Normalizes a Date object to midnight UTC (00:00:00.000).
    * @param {Date} date - The Date object to normalize.
    * @returns {Date} A new Date object set to midnight UTC on the same day.
    */
   export function normalizeDate(date) {
       if (!date || isNaN(date.getTime())) return date;
       return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
   }
   ```

2. **Create Wrapper Functions for Date Comparisons**

   Add wrapper functions for date comparisons to ensure consistent handling:

   ```javascript
   /**
    * Safely compares two dates for equality, normalizing to midnight UTC.
    * @param {Date} date1 - First date to compare.
    * @param {Date} date2 - Second date to compare.
    * @returns {boolean} True if the dates represent the same day.
    */
   export function datesEqual(date1, date2) {
       if (!date1 || !date2) return false;
       const d1 = normalizeDate(date1);
       const d2 = normalizeDate(date2);
       return d1.getTime() === d2.getTime();
   }

   /**
    * Safely compares if date1 is before date2, normalizing to midnight UTC.
    * @param {Date} date1 - First date to compare.
    * @param {Date} date2 - Second date to compare.
    * @returns {boolean} True if date1 is before date2.
    */
   export function dateBefore(date1, date2) {
       if (!date1 || !date2) return false;
       const d1 = normalizeDate(date1);
       const d2 = normalizeDate(date2);
       return d1.getTime() < d2.getTime();
   }

   /**
    * Safely compares if date1 is after date2, normalizing to midnight UTC.
    * @param {Date} date1 - First date to compare.
    * @param {Date} date2 - Second date to compare.
    * @returns {boolean} True if date1 is after date2.
    */
   export function dateAfter(date1, date2) {
       if (!date1 || !date2) return false;
       const d1 = normalizeDate(date1);
       const d2 = normalizeDate(date2);
       return d1.getTime() > d2.getTime();
   }

   /**
    * Safely compares if date1 is on or before date2, normalizing to midnight UTC.
    * @param {Date} date1 - First date to compare.
    * @param {Date} date2 - Second date to compare.
    * @returns {boolean} True if date1 is on or before date2.
    */
   export function dateOnOrBefore(date1, date2) {
       if (!date1 || !date2) return false;
       const d1 = normalizeDate(date1);
       const d2 = normalizeDate(date2);
       return d1.getTime() <= d2.getTime();
   }

   /**
    * Safely compares if date1 is on or after date2, normalizing to midnight UTC.
    * @param {Date} date1 - First date to compare.
    * @param {Date} date2 - Second date to compare.
    * @returns {boolean} True if date1 is on or after date2.
    */
   export function dateOnOrAfter(date1, date2) {
       if (!date1 || !date2) return false;
       const d1 = normalizeDate(date1);
       const d2 = normalizeDate(date2);
       return d1.getTime() >= d2.getTime();
   }
   ```

3. **Update Key Functions to Use Normalization**

   Modify the following functions to use the new normalization utilities:

   a. **In `utils.js`**:
   - Update `daysBetween()` to normalize dates before calculation
   - Ensure `parseDateInput()` explicitly returns normalized dates

   b. **In `dom/inputs.js`**:
   - Update `validateInputValues()` to use the new date comparison functions

   c. **In `calculations.js`**:
   - Update `getInterestRateForDate()` to use normalized dates
   - Update `calculateInterestPeriods()` to normalize dates when parsing special damages
   - Update date comparisons in the calculation logic

   d. **In `calculator.js`**:
   - Update date comparisons in `calculatePrejudgmentInterest()`
   - Update date comparisons in `calculatePostjudgmentInterest()`
   - Normalize dates when calculating the latest judgment date

4. **Update State Management**

   Ensure all dates are normalized before being stored in the Zustand store:

   a. **In `calculator.js`**:
   - Normalize dates before calling `useStore.getState().setInput()`
   - Normalize dates before calling `useStore.getState().setResult()`

   b. **In `dom/inputs.js`**:
   - Normalize parsed dates in `getInputValues()` before updating the store

5. **Update Special Damages Handling**

   When working with special damages dates:

   a. **In `calculator.js`**:
   - When parsing special damages dates from strings, ensure they are normalized
   - When comparing special damages dates, use the new comparison functions

   b. **In `dom/specialDamages.js`**:
   - Ensure any date comparisons use the new comparison functions

6. **Add Unit Tests**

   Add unit tests to verify that:
   - Date normalization works correctly
   - Date comparison functions handle edge cases
   - Date calculations are not affected by time components

## Expected Outcome

After implementing these changes:

1. All date comparisons will be based solely on the date component, not the time component
2. Date calculations will be consistent and reliable
3. The codebase will have a standardized approach to date handling
4. Bugs related to time component differences will be eliminated

## Testing Approach

1. Run existing unit tests to ensure functionality is preserved
2. Add new unit tests specifically for the date normalization and comparison functions
3. Test edge cases such as:
   - Dates at different times of day
   - Dates around DST changes
   - Date comparisons across month/year boundaries
   - Special cases like leap years

## Acceptance Criteria

- [ ] All date comparisons in the codebase use the new comparison functions
- [ ] All Date objects are normalized to midnight UTC before comparison or calculation
- [ ] All unit tests pass
- [ ] No regressions in existing functionality
- [ ] Code is well-documented with clear comments explaining the date handling approach
