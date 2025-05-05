# Task 57.2: Update Interest Table CSS Styling

## Overview
This task involves updating the CSS styling rules that target specific columns in the interest tables to reflect the new column order. This ensures that the visual presentation of the tables remains consistent after reordering the columns.

## Background
After changing the order of columns in the interest tables from "Rate, Principal, Interest" to "Principal, Rate, Interest" in Task 57.1, we need to update the CSS selectors that apply specific styling to each column.

## Current Structure
The current CSS uses nth-child selectors to apply specific styling to each column:
- 1st column (Date): text-left alignment
- 2nd column (Description): text-left alignment, takes remaining space
- 3rd column (Rate): text-center alignment, fixed width
- 4th column (Principal): text-right alignment, fixed width
- 5th column (Interest): text-right alignment, fixed width

## Required Changes
- Update the CSS selectors for the 3rd and 4th columns to reflect their new positions
- Ensure proper text alignment for each column (Principal should be right-aligned, Rate should be center-aligned)
- Maintain the width constraints for each column

## Files to Modify
- `BC COIA calculator/styles/tables/interest-tables.css`

## Specific Changes
1. Update the CSS selectors for the 3rd column (now Principal):
   - Change alignment from center to right
   - Maintain fixed width and no-wrap settings

2. Update the CSS selectors for the 4th column (now Rate):
   - Change alignment from right to center
   - Maintain fixed width and no-wrap settings

3. Keep all other column styling consistent

## Acceptance Criteria
- Principal column (3rd) is right-aligned with appropriate width
- Rate column (4th) is center-aligned with appropriate width
- No visual regression in other column styling
- Tables display correctly with the new column order

## Dependencies
- Task 57.1: Update Interest Table Headers must be completed first

## Follow-up Tasks
- Task 57.3: Update Regular Interest Table Rows
- Task 57.4: Update Interest Table Footers
- Task 57.5: Update Special Damages Handling
