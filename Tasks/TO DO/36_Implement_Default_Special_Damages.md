# Task 36: Implement Default Special Damages

## Overview
This task involves implementing default special damages in the Court Order Interest Act (COIA) Calculator. The calculator should initialize with three default special damages entries as specified in the requirements, along with the existing defaults for Judgment Date, prejudgment date, and postjudgment date.

Default values for special damages should be:
1. "test 3" - $333.00 on 2024-04-30
2. "test 1" - $11.00 on 2024-07-01
3. "test 2" - $222.00 on 2024-07-02

## Subtasks

### 36.0: Default Special Damages Store Implementation
**Goal**: Add default special damages to the application's initial state in the Zustand store.

**Implementation**:
- Modify `calculator.ui.js` to define default special damages
- Update `defaultResults` object in `initializeCalculator()` function
- Calculate and set the correct `specialDamagesTotal`
- Ensure these values are included in store initialization

**Testing**:
- Console log the store state after initialization to confirm special damages are present
- Verify values match the required defaults

### 36.1: Connect Store Special Damages to DOM Rendering
**Goal**: Ensure special damages in the store are reflected in the DOM during initialization.

**Implementation**:
- Modify `updateInterestTable()` in `tables.interest.js` to check if `existingSpecialDamagesRows` is empty
- If empty, retrieve special damages from the store
- Format those store values correctly for DOM insertion
- Add them to the `existingSpecialDamagesRows` array for insertion

**Testing**:
- Verify that default special damages appear in the prejudgment interest table on application load
- Confirm that the special damages total appears correctly in the summary table

### 36.2: Sort and Position Special Damages Correctly
**Goal**: Ensure special damages are sorted by date and positioned correctly relative to interest periods.

**Implementation**:
- Review special damages insertion logic in `updateInterestTable()`
- Confirm sorting logic correctly handles the default special damages
- Ensure dates are properly formatted for comparison
- Verify insertion position logic for special damages rows

**Testing**:
- Check that special damages appear in date order
- Verify that special damages appear in correct positions relative to interest periods
- Test sorting with a mix of default and user-added special damages

### 36.3: Handle Special Damages Persistence
**Goal**: Ensure default special damages are correctly handled during state changes.

**Implementation**:
- Verify how special damages are preserved when toggling prejudgment interest checkbox
- Check that special damages are saved and restored properly
- Confirm that new special damages can be added alongside defaults

**Testing**:
- Toggle prejudgment interest off and on, verify special damages persist
- Add new special damages, verify all are displayed
- Delete a special damage, verify others remain

### 36.4: Update Special Damages Summary Display
**Goal**: Ensure the special damages total is correctly displayed in the summary table.

**Implementation**:
- Verify the summary table rows properly show the total special damages amount
- Confirm that the summary table calculation includes special damages
- Check that the total is updated correctly when special damages change

**Testing**:
- Verify Special Damages row in summary table shows correct total ($566.00)
- Add/remove special damages, confirm summary updates correctly
- Ensure special damages are included in final total calculations

### 36.5: Edge Case Handling and Cleanup
**Goal**: Address any edge cases or issues that arise during implementation.

**Implementation**:
- Test with various date ranges
- Check boundary conditions (e.g., special damages on judgment date)
- Verify behavior with empty special damages list
- Clean up any console.log statements or debug code

**Testing**:
- Clear all special damages, verify app functions correctly
- Test with special damages at boundary dates
- Verify calculations are accurate with defaults
