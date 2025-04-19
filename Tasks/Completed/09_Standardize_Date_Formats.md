# Standardize Date Formats to YYYY-MM-DD

## Description
Standardize all date formats throughout the codebase to use the YYYY-MM-DD format. This will ensure consistency across all files, reduce the risk of date-related bugs, and improve maintainability.

## Current State
Most of the codebase already uses the YYYY-MM-DD format for dates, including:

1. **BC COIA calculator**:
   - `utils.js`: All date formatting functions use YYYY-MM-DD
   - `calculations.js`: Uses YYYY-MM-DD for special damages dates and via imported utils.js functions
   - `calculator.js`: Uses YYYY-MM-DD for date inputs and handling special damages
   - HTML files: Use HTML5 `<input type="date">` which defaults to YYYY-MM-DD

2. **BC Special Interest calculator**:
   - `specialCalc.js`: Uses YYYY-MM-DD for date parsing and formatting
   - `defaultValues.js`: Uses YYYY-MM-DD for all date strings
   - HTML files: Use HTML5 `<input type="date">` which defaults to YYYY-MM-DD

3. **Test Files**:
   - All test files use YYYY-MM-DD format for date strings

4. **Documentation and Mockups**:
   - All mockup files use YYYY-MM-DD format in examples

## Changes Needed

### 1. Client-side Version (2025-04-09)
The `formatDate` function in `BCcalculator.js` currently formats dates as DD/MM/YYYY:

```javascript
function formatDate(date) { 
    if (!date || isNaN(date.getTime())) return ''; 
    const day = date.getUTCDate().toString().padStart(2, '0'); 
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); 
    const year = date.getUTCFullYear(); 
    return `${day}/${month}/${year}`; 
}
```

This function should be updated to use YYYY-MM-DD format:

```javascript
function formatDate(date) { 
    if (!date || isNaN(date.getTime())) return ''; 
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); 
    const day = date.getUTCDate().toString().padStart(2, '0'); 
    return `${year}-${month}-${day}`; 
}
```

### 2. Impact Analysis
After making this change, verify that:
- The UI correctly displays dates in the interest tables
- Calculations continue to work correctly
- Any code that depends on the formatted date strings continues to function properly

## Acceptance Criteria
1. All date formatting functions across the codebase use YYYY-MM-DD format
2. The client-side version's `formatDate` function is updated to use YYYY-MM-DD format
3. All UI components display dates in YYYY-MM-DD format
4. All calculations and functionality continue to work correctly after the changes
5. All tests pass after the changes

## Priority
Medium - This is a consistency improvement that will help with maintainability and reduce potential bugs.

## Estimated Effort
1-2 hours
- 30 minutes to update the code
- 30-60 minutes for testing and verification
