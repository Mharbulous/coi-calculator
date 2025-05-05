# Task 57.1: Update Interest Table Headers

## Overview
This task involves changing the order of columns in all interest calculation tables from the current order of "Rate, Principal, Interest" to "Principal, Rate, Interest". In this first step, we'll update the table headers in the HTML to reflect the new order.

## Background
It has been brought to our attention that the current order of columns in our interest calculation tables is unconventional. A more conventional and readable order would be "Principal, Rate, Interest" instead of the current "Rate, Principal, Interest".

## Current Structure
Currently, the interest table headers in both prejudgment and postjudgment tables have the following order:
1. Date
2. Description
3. Rate
4. Principal
5. Interest

## Required Changes
- Locate the table header sections in the `index.html` file for both prejudgment and postjudgment tables
- Swap the 3rd and 4th columns (Rate and Principal) in each table's header row

## Files to Modify
- `BC COIA calculator/index.html`

## Specific Changes
1. Find the `<thead>` section for the prejudgment table
   - Locate the header row containing the column titles
   - Swap the "Rate" and "Principal" `<th>` elements (3rd and 4th columns)

2. Find the `<thead>` section for the postjudgment table
   - Locate the header row containing the column titles
   - Swap the "Rate" and "Principal" `<th>` elements (3rd and 4th columns)

## Acceptance Criteria
- The prejudgment table header displays columns in this order: Date, Description, Principal, Rate, Interest
- The postjudgment table header displays columns in this order: Date, Description, Principal, Rate, Interest
- No other header content or attributes are changed

## Dependencies
- None (this is the first step in the column reordering process)

## Follow-up Tasks
- Task 57.2: Update Interest Table CSS Styling
- Task 57.3: Update Regular Interest Table Rows
- Task 57.4: Update Interest Table Footers
- Task 57.5: Update Special Damages Handling
