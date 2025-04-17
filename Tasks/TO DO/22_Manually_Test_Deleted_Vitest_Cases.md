# Task: Manually Test Deleted Vitest Cases

## Description
Several test cases were removed from the Vitest protocols but still need to be manually verified to ensure the functionality works correctly.

## Test Cases to Verify

1. **Prejudgment Interest Across Rate Periods**
   - Test: "should calculate prejudgment interest correctly spanning two rate periods (non-leap)"
   - Verify that prejudgment interest calculations correctly handle transitions between different interest rate periods in non-leap years.

2. **Postjudgment Interest Across Multiple Periods**
   - Test: "should calculate postjudgment interest correctly spanning multiple periods including a leap year"
   - Verify that postjudgment interest calculations correctly handle multiple rate periods, especially when they include leap years.

3. **Special Damages Addition to Principal**
   - Test: "should correctly add special damages to principal for subsequent periods"
   - Verify that special damages are properly added to the principal amount for interest calculations in subsequent periods.

4. **Special Damages on Rate Change Dates**
   - Test: "should handle special damages occurring exactly on rate change dates"
   - Verify that the system correctly processes special damages that occur precisely on dates when interest rates change.

5. **Interest Calculation for Final Period Damages**
   - Test: "should calculate interest separately for damages within the final period"
   - Verify that interest is calculated correctly for damages that occur within the final calculation period.

6. **Final Period Spanning Rate Changes**
   - Test: "should handle final period damages when the final period spans a rate change"
   - Verify that the system correctly handles damages in the final period when that period includes an interest rate change.

## Steps
1. Create test scenarios that match each of the above test cases
2. Manually verify the calculations against expected results
3. Document any discrepancies found

## Priority
Medium

## Estimated Effort
1-2 hours
