# Generalized `.breakable` Class Pagination System

## Overview

This documentation visualizes the refactored pagination system which now uses a generalized `.breakable` class approach. The new system simplifies page break insertion logic by focusing on element classification rather than element-specific processing.

## Key Improvements

1. **Unified Processing Logic**
   - Single loop iterates over all elements with the `.breakable` class
   - Replaces separate processors for different element types
   - Simplified codebase with less redundancy

2. **Type Detection vs. Specific Processors**
   - Uses element type checking (`element.tagName === 'TR'`) instead of separate processor modules
   - The `insertPageBreakBeforeElement` utility function handles different element types appropriately
   - Eliminated the need for `tableRowProcessor.js` and `sectionTitleProcessor.js`

3. **Class-Based Element Selection**
   - Elements that should allow page breaks simply need the `.breakable` class
   - Applied to both static elements (in HTML) and dynamic elements (via JS)
   - Easier to maintain and extend

4. **Improved Table Handling**
   - First row after a table header is not marked as breakable to prevent awkward breaks
   - Table headers are automatically repeated when breaks occur within tables
   - Proper colspan handling ensures consistent table structure

## Diagram Files

1. [Module Overview](module-overview.md) - Overall structure of the pagination module
2. [Index Module Diagram](index-diagram.md) - Structure of the module entry point
3. [PageBreaksCore Logic Flow](pageBreaksCore-diagram.md) - Logic flow of the main pagination function
4. [Utils Function Relationships](utils-diagram.md) - Utility functions and their relationships
5. [Tables Integration](tables-integration-diagram.md) - How table rows are prepared for pagination
6. [Pagination Sequence](pagination-sequence.md) - Sequential flow of operations during pagination

## Implementation Details

- The `.breakable` class is added to:
  - Static elements in HTML (section titles)
  - Dynamically generated table rows (except first row after headers)
  - Other elements that should allow page breaks

- The pagination system now follows these steps:
  1. Clear previous spacers and screen-only elements
  2. Calculate page dimensions and boundaries
  3. Find all elements with the `.breakable` class
  4. For each breakable element:
     - Calculate the "block height" (distance to next breakable element)
     - Check if the element's block overflows the current page
     - If overflow is detected, insert an appropriate page break
  5. Perform final adjustments to ensure proper pagination

## Benefits

- **Maintainability**: Fewer files to maintain and simpler logic
- **Consistency**: Uniform handling of different element types
- **Flexibility**: Easy to add pagination support to new elements
- **Readability**: Clear separation between pagination mechanism and content
