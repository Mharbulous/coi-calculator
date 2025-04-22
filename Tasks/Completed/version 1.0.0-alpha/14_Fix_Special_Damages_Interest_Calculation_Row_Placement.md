# Fix Special Damages Interest Calculation Row Placement

## Issue Description

Currently, when special damages are entered in the final period, the calculator generates inconsistent rows:

1. For all special damages, it generates:
   - A detailed interest calculation row above the special damage with the description "special damage name (X days)"
   - The special damage row itself with editable values

2. For the last special damage in the list only, it generates an additional:
   - A detailed interest calculation row below with just the description "X days"

This inconsistency creates confusion and makes the table harder to read. As shown in the screenshot, for three special damages ("test 1", "test 2", and "test 3"), each has an interest calculation row above it, but only "test 3" has an additional interest calculation row below it.

## Current Behavior

The current behavior can be observed in the screenshot:

1. For "test 1":
   - Row with "test 1 (119 days)" - interest calculation row
   - Row with "test 1" - special damage row

2. For "test 2":
   - Row with "test 2 (89 days)" - interest calculation row
   - Row with "test 2" - special damage row

3. For "test 3":
   - Row with "test 3 (61 days)" - interest calculation row
   - Row with "test 3" - special damage row
   - Row with "61 days" - additional interest calculation row

This inconsistency is caused by:
1. The `calculateInterestPeriods` function in `calculations.js` adding final period damage interest details to the main details array (creating the rows above)
2. The `insertCalculatedRowIfNeeded` function in `dom/specialDamages.js` inserting another calculated interest row (creating the row below for the last special damage)

## Desired Behavior

1. Each special damage in the final period should have exactly one detailed interest calculation row
2. The detailed interest calculation row should appear directly below the special damage row to which it relates, never above
3. The description format should be "X days" with right alignment (not "special damage name (X days)")

## Files to Modify

1. `BC COIA calculator/calculations.js` - Modify the `calculateInterestPeriods` function to not add final period damage interest details to the main details array
2. `BC COIA calculator/dom/specialDamages.js` - Update the `insertCalculatedRowIfNeeded` function to ensure the calculated row is inserted below the special damages row
3. `BC COIA calculator/dom/tables.js` - Modify the `updateInterestTable` function to handle the insertion of special damages rows and their calculated interest rows correctly

## Implementation Approach

1. **Modify `calculations.js`**:
   - Update the `calculateInterestPeriods` function to not add final period damage interest details to the main details array
   - Ensure the `finalPeriodDamageInterestDetails` array is still populated correctly for use by other functions

2. **Update `dom/specialDamages.js`**:
   - Modify the `insertCalculatedRowIfNeeded` function to:
     - Always insert the calculated row after the special damages row (not before)
     - Use the format "X days" for the description (not "special damage name (X days)")
     - Apply right alignment to the description cell

3. **Adjust `dom/tables.js`**:
   - Update the `updateInterestTable` function to ensure that when re-inserting special damages rows, the calculated interest rows are inserted in the correct order
   - Ensure that the reference node passed to `insertCalculatedRowIfNeeded` is the next row after the special damages row, not the current row

## Testing

After implementation, test the following scenarios:
1. Add a single special damage in the final period
2. Add multiple special damages in the final period
3. Add special damages in both regular periods and the final period
4. Verify that each special damage has exactly one interest calculation row
5. Verify that each interest calculation row appears directly below its corresponding special damage row
6. Verify that the description format is "X days" with right alignment

## Acceptance Criteria

- Each special damage in the final period has exactly one interest calculation row
- Each interest calculation row appears directly below its corresponding special damage row
- The description format is "X days" with right alignment
- The calculation is correct and matches the expected interest amount
