# Task 23: Break Down Large Files

## Objective
Break down files that exceed 300 lines into smaller, more focused files, with no file being smaller than 200 lines.

## Background
Several files in the codebase exceed 300 lines, making them difficult to maintain and understand. Breaking these files into smaller, more focused modules will improve code organization, maintainability, and readability.

## Files to Break Down

### 1. calculations.test.js (623 lines)
Split into 3 files:
- **calculations.test.rate.js** (~210 lines)
  - Tests for getInterestRateForDate
  - Include the mock data setup and helper functions
  - Include basic test utilities

- **calculations.test.periods.js** (~250 lines)
  - Tests for calculateInterestPeriods
  - Reuse the same mock data by importing from a shared file

- **calculations.test.perdiem.js** (~200 lines)
  - Tests for calculatePerDiem
  - Reuse the same mock data by importing from a shared file

### 2. calculator.js (540 lines)
Split into 2 files:
- **calculator.core.js** (~250 lines)
  - Contains the core calculation functions: recalculate, calculatePrejudgmentInterest, calculatePostjudgmentInterest, calculateFinalTotals
  - Contains error handling functions: handleInvalidInputs, handleMissingRates

- **calculator.ui.js** (~200 lines)
  - Contains UI-related functions: setupEventListeners, initializeCalculator
  - Contains table update functions: updatePrejudgmentTable, updatePostjudgmentTable
  - Contains special damages collection: collectSpecialDamages

### 3. dom/tables.js (407 lines)
Split into 2 files:
- **dom/tables.interest.js** (~200 lines)
  - Contains the updateInterestTable function and related helpers

- **dom/tables.summary.js** (~210 lines)
  - Contains the updateSummaryTable function and clearResults

### 4. store.test.js (344 lines)
Split into 2 files:
- **store.test.basic.js** (~200 lines)
  - Contains tests for initial state, input actions, and result actions

- **store.test.advanced.js** (~200 lines)
  - Contains tests for special damages actions, store management actions, and complex interactions

### 5. utils.js (316 lines)
Split into 2 files:
- **utils.date.js** (~200 lines)
  - Contains all date-related utility functions

- **utils.currency.js** (~200 lines)
  - Contains all currency-related utility functions

### 6. utils.test.js (586 lines)
Split into 2 files:
- **utils.test.date.js** (~300 lines)
  - Contains tests for date-related utility functions

- **utils.test.currency.js** (~200 lines)
  - Contains tests for currency-related utility functions

## Implementation Strategy

For each file split:

1. Create the new files
2. Move the relevant functions/tests to the appropriate files
3. Update imports/exports to maintain functionality
4. Ensure all tests still pass after the refactoring

## Acceptance Criteria

- All files that previously exceeded 300 lines are broken down into smaller files
- No new file is smaller than 200 lines
- No new file exceeds 300 lines
- All tests pass after the refactoring
- The application functions exactly as before
