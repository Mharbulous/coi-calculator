# Task 57.3: Update Regular Interest Table Rows

## Overview
This task involves modifying the JavaScript code that populates the interest table rows to reflect the new column order. After changing the column headers and CSS styling in Tasks 57.1 and 57.2, we need to ensure that the content in each row follows the same order.

## Background
The interest calculation tables are currently displaying columns in the order "Rate, Principal, Interest". We are changing this to the more conventional order of "Principal, Rate, Interest". After updating the headers and CSS, we need to modify how data is inserted into table rows.

## Current Structure
Currently, the `updateInterestTable` function in `tables.interest.js` creates rows with cells in this order:
1. Date
2. Description
3. Rate
4. Principal
5. Interest

Each cell is also assigned specific CSS classes for text alignment.

## Required Changes
- Modify the `updateInterestTable` function to change the order in which cells are created and populated
- Update the CSS class assignments to ensure proper text alignment
- Ensure the data values are mapped to the correct columns

## Files to Modify
- `BC COIA calculator/dom/tables.interest.js`

## Specific Changes
1. In the `updateInterestTable` function:
   - Change the order of cell creation and content assignment for regular rows
   - Swap the third cell (currently Rate) with the fourth cell (currently Principal)
   - Adjust the CSS class assignments to match the new order
   - Ensure the data values are correctly mapped to their respective columns

2. Update all related references to cell indices in the function to reflect the new order

## Acceptance Criteria
- Table rows display data in the order: Date, Description, Principal, Rate, Interest
- Cell content is correctly aligned (Principal right-aligned, Rate center-aligned)
- All calculations and data values appear in the correct columns
- No regression in table functionality or appearance

## Dependencies
- Task 57.1: Update Interest Table Headers
- Task 57.2: Update Interest Table CSS Styling

## Follow-up Tasks
- Task 57.4: Update Interest Table Footers
- Task 57.5: Update Special Damages Handling
