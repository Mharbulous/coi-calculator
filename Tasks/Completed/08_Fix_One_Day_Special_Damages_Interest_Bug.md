# Fix One-Day Special Damages Interest Bug

## Problem Description
When a special damages entry is dated exactly 1 day before the Judgment Date, the system fails to render the interest calculation row in the summary table. However, when the special damages entry is dated 2 or more days before the Judgment Date, the interest calculation row is correctly displayed.

### Current Behavior
- Special damages dated 2+ days before Judgment Date: Interest calculation row is rendered correctly
- Special damages dated exactly 1 day before Judgment Date: No interest calculation row is rendered

### Expected Behavior
- Special damages dated 1 day before Judgment Date should also display an interest calculation row, even if the interest amount is minimal

## Visual Evidence
Two screenshots demonstrate the issue:
1. When a special damages entry is dated 2023-04-29 (2 days before Judgment Date of 2023-05-01), the system correctly shows "test (2 days)" with interest of $0.08
2. When a special damages entry is dated 2023-04-30 (1 day before Judgment Date of 2023-05-01), the system only shows "test" with no interest calculation

## Technical Details
This is likely a logic issue in the code that calculates or renders interest for special damages. The problem might be:
- A conditional statement that incorrectly handles the 1-day case
- A rounding issue with date calculations
- A display condition that filters out entries with very small interest amounts

## Acceptance Criteria
- Special damages dated 1 day before Judgment Date should display an interest calculation row
- The interest amount should be calculated correctly based on 1 day of interest
- The description should show "test (1 day)" to correctly indicate the duration

## Priority
Medium - This is a functional bug that affects accuracy of calculations, but only in a specific edge case.
