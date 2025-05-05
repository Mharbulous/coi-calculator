# Task 57.4: Update Interest Table Footers

## Overview
This task involves updating the table footers in the interest calculation tables to match the new column order. The footers contain total values and additional information that must align properly with the reordered columns.

## Background
As part of changing the column order from "Rate, Principal, Interest" to "Principal, Rate, Interest", we need to ensure that the footer rows in the tables display information in the correct columns. This includes the total amounts, dates, and day counts.

## Current Structure
Currently, the table footers in both prejudgment and postjudgment tables have specific cells for:
- Date information (in the first column)
- Total days information (in the second column)
- An empty cell for Rate (in the third column)
- "Prejudgment Interest" or "Postjudgment Interest" text and Principal total (in the fourth column)
- Interest total amount (in the fifth column)

## Required Changes
- Update the HTML structure of the footer rows in both prejudgment and postjudgment tables
- Ensure that data-display attributes are in the correct columns
- Update any JavaScript code that references footer cells by index

## Files to Modify
- `BC COIA calculator/index.html` (footer HTML structure)
- `BC COIA calculator/dom/tables.interest.js` (any JavaScript that references footer cells)

## Specific Changes
1. In `index.html`:
   - Locate the footer (`<tfoot>`) sections for both prejudgment and postjudgment tables
   - Swap the empty cell (currently in the third position for Rate) with the Principal total cell (currently in the fourth position)
   - Ensure all data-display attributes remain with the correct cells

2. In `tables.interest.js`:
   - Update any code that references footer cells by index to account for the new order
   - Ensure that total values are inserted into the correct cells

## Acceptance Criteria
- Footer rows display information in the correct order, matching the new column order
- The "Prejudgment Interest" and "Postjudgment Interest" labels appear in the correct column
- Total values display in the proper columns
- Date and total days information appears in the correct columns
- Footer styling remains consistent

## Dependencies
- Task 57.1: Update Interest Table Headers
- Task 57.2: Update Interest Table CSS Styling
- Task 57.3: Update Regular Interest Table Rows

## Follow-up Tasks
- Task 57.5: Update Special Damages Handling
