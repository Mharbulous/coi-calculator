# End-to-End Testing Plan for COI Calculator

This document outlines the testing procedure for verifying that all components of the COI Calculator work together correctly in a complete end-to-end flow, with a focus on lifecycle-aware datepickers.

## Prerequisites

- All tasks 33.1 through 33.6 have been successfully implemented
- Debug logging has been added to track lifecycle events:
  - In datepickers.js: Added logging to initializeDatePickers()
  - In store.js: Enhanced logging in savePrejudgmentState() and restorePrejudgmentState()

## Testing Procedure

### 1. Basic Functionality Tests

#### a. Datepicker Initialization:
- [ ] Open the application with browser console open
- [ ] Verify datepickers are created for visible elements
- [ ] Uncheck prejudgment checkbox
- [ ] Verify prejudgment datepicker is destroyed (check console logs)
- [ ] Check prejudgment checkbox
- [ ] Verify prejudgment datepicker is recreated (check console logs)

#### b. Date Constraints:
- [ ] Enter a judgment date of "2024-05-15"
- [ ] Verify prejudgment datepicker has max date of "2024-05-15"
- [ ] Verify postjudgment datepicker has min date of "2024-05-15"
- [ ] Change judgment date to "2024-06-01"
- [ ] Verify constraints update accordingly

### 2. State Preservation and Restoration Tests

#### a. Date Preservation:
- [ ] Enter a prejudgment date of "2024-01-15"
- [ ] Uncheck prejudgment checkbox
- [ ] Verify in console that date is saved in state
- [ ] Check prejudgment checkbox
- [ ] Verify prejudgment date is restored to "2024-01-15"
- [ ] Verify no console errors

#### b. Special Cases:
- [ ] Add some special damages entries
- [ ] Toggle prejudgment checkbox off and on
- [ ] Verify both date and special damages are preserved
- [ ] Try with various combinations of dates

### 3. DOM Synchronization Tests

#### a. Input Field Updates:
- [ ] Enter a prejudgment date
- [ ] Toggle checkbox off and on
- [ ] Verify the input field visually shows the correct date
- [ ] Edit the date, toggle again, verify new date is preserved

#### b. Event Handling:
- [ ] Use the browser debugger to set a breakpoint in any event listeners
- [ ] Toggle the checkbox off and on
- [ ] Verify if change events are properly triggered

### 4. Validation Tests

#### a. Hidden Element Validation:
- [ ] Leave prejudgment date blank
- [ ] Observe validation error (red background)
- [ ] Uncheck prejudgment checkbox
- [ ] Verify validation error disappears
- [ ] Check prejudgment checkbox
- [ ] Verify validation error reappears

#### b. Error Message Clarity:
- [ ] Create various validation scenarios
- [ ] Verify error messages are clear and specific to visible elements

### 5. Edge Case Tests

#### a. Quick Toggling:
- [ ] Rapidly toggle checkboxes multiple times
- [ ] Verify no console errors and proper state management

#### b. Mixed Visibility:
- [ ] Create a scenario with prejudgment visible but postjudgment hidden
- [ ] Verify proper behavior with this mixed visibility

#### c. Error Recovery:
- [ ] Deliberately create an error scenario (e.g., enter invalid date)
- [ ] Verify application can recover gracefully

## Final Verification

After completing all tests, perform a final verification by following this workflow:

1. [ ] Clear all data and refresh the page
2. [ ] Enter these values:
   - Judgment Date: 2024-05-15
   - Prejudgment Date: 2024-01-10
   - Postjudgment Date: 2024-10-20
   - Pecuniary Amount: $10,000
3. [ ] Uncheck prejudgment checkbox, then recheck it
4. [ ] Uncheck postjudgment checkbox, then recheck it
5. [ ] Change judgment date to 2024-06-01
6. [ ] Verify all constraints and values update correctly
7. [ ] Verify no console errors or validation warnings

## Test Results

| Test Case | Result | Notes |
|-----------|--------|-------|
| | | |

## Issues Found

| Issue | Description | Resolution |
|-------|-------------|------------|
| | | |

## Conclusion

Summary of testing results and any recommendations for further improvements.
