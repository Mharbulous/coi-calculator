# 11 Fix formatDateLong Test Failure

## Context

During the cleanup of change tracking comments in the calculator.js file (Task 10.2), a test failure was discovered in the utils.test.js file. This failure is unrelated to the comment cleanup but needs to be addressed to maintain the integrity of the test suite.

## Issue

The test failure occurs in the `utils.test.js` file, specifically in the test for the `formatDateLong` function:

```javascript
it('should handle different dates', () => {
    const date1 = createUTCDate(2025, 0, 1); // January 1, 2025
    expect(formatDateLong(date1)).toBe('2025-01-01'); // Changed expected format
    const date2 = createUTCDate(2023, 12, 31); // December 31, 2023
    expect(formatDateLong(date2)).toBe('2024-12-31'); // Changed expected format
});
```

The test expects that when given a date of December 31, 2023, the `formatDateLong` function should return "2024-12-31". However, the function is correctly returning "2023-12-31", which matches the input date.

## Possible Causes

There are two potential issues:

1. **Test Expectation Error**: The test might be expecting the wrong output. If the function is supposed to return the date in YYYY-MM-DD format, then for an input of 2023-12-31, it should return "2023-12-31", not "2024-12-31".

2. **Date Creation Issue**: The `createUTCDate(2023, 12, 31)` might be creating a date for January 31, 2024, not December 31, 2023, because JavaScript months are 0-indexed (0 = January, 11 = December). So `12` would actually refer to January of the next year.

## Solution

1. **If the test expectation is wrong**:
   - Update the test to expect "2023-12-31" instead of "2024-12-31"
   
   ```javascript
   expect(formatDateLong(date2)).toBe('2023-12-31');
   ```

2. **If the date creation is wrong**:
   - Update the date creation to use month 11 for December:
   
   ```javascript
   const date2 = createUTCDate(2023, 11, 31); // December 31, 2023
   ```

## Steps to Fix

1. Examine the `formatDateLong` function in utils.js to understand its expected behavior
2. Check how the `createUTCDate` function works and whether it adjusts for JavaScript's 0-indexed months
3. Update either the test expectation or the date creation based on findings
4. Run the tests to verify the fix

## Benefits

1. **Test Integrity**: Ensures the test suite accurately validates the code's behavior
2. **Prevents False Negatives**: Avoids failing tests for correctly functioning code
3. **Documentation**: Clarifies the expected behavior of the formatDateLong function

## Completion Criteria

- The test passes without any modifications to the actual `formatDateLong` function
- The test accurately reflects the expected behavior of the function
- All tests in the suite pass
