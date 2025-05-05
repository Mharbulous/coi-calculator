# Task 57.5: Update Special Damages Handling

## Overview
This task involves updating the special damages functionality to ensure compatibility with the new column order in the interest calculation tables. Special damages rows need to maintain their structure and functionality while conforming to the updated column layout.

## Background
The application allows users to add "special damages" rows to the prejudgment interest table via an "add special damages" button. These special rows have a unique structure but must align with the same column order as regular rows. As we change the column order from "Rate, Principal, Interest" to "Principal, Rate, Interest", we need to ensure special damages rows are properly updated.

## Current Structure
Currently, when a user adds a special damages row:
1. A row is inserted with input fields for date, description, and amount
2. The row spans across all columns in the table
3. The insertSpecialDamagesRow and insertSpecialDamagesRowFromData functions in specialDamages.js handle this functionality

## Required Changes
- Update the special damages row creation functions to align with the new column order
- Ensure input fields appear in the correct columns
- Maintain all existing functionality for special damages entries

## Files to Modify
- `BC COIA calculator/dom/specialDamages.js`
- Potentially `BC COIA calculator/dom/tables.interest.js` if it contains special damages-related functionality

## Specific Changes
1. In the `insertSpecialDamagesRow` and `insertSpecialDamagesRowFromData` functions:
   - Update how cells are created and populated to match the new column order
   - Ensure data values are mapped to the correct columns
   - Update any column index references to reflect the new order

2. Check for any other functions that interact with special damages rows and update as needed

## Acceptance Criteria
- Special damages functionality continues to work correctly with the new column order
- Special damages rows display input fields in the correct positions
- Adding a special damages row maintains the correct structure
- Existing special damages rows are properly displayed after the column reordering
- All calculations involving special damages continue to function correctly

## Dependencies
- Task 57.1: Update Interest Table Headers
- Task 57.2: Update Interest Table CSS Styling
- Task 57.3: Update Regular Interest Table Rows
- Task 57.4: Update Interest Table Footers

## Follow-up Tasks
- None (this is the final step in the column reordering process)
- Consider adding comprehensive testing to verify all table functionality works with the new column order
