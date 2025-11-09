# Task 64: Refactor Special Damages Data Collection to Prioritize Store

## Description

The current implementation of `getExistingSpecialDamages` in `tables.interest.rowSorting.js` prioritizes DOM scraping for collecting special damages data, only falling back to reading from the Zustand store if no DOM elements are found. This approach contradicts the architectural principle stated in the context documentation that collection functions "must read directly from the store" and "should not scrape data from the DOM." This inconsistency creates potential stability issues and violates the "single source of truth" pattern.

## Current Behavior

In `tables.interest.rowSorting.js`, the `getExistingSpecialDamages` function currently:
1. First attempts to query the DOM using `tableBody.querySelectorAll('.editable-item-row')` to find special damages rows
2. Extracts date, description, and amount values from input fields within these rows
3. Only reads from the Zustand store (`state.results.specialDamages`) if the DOM query returns no results
4. Returns an array of row data objects based primarily on DOM content, not store data

This DOM-first approach means that if there's any inconsistency between the DOM state and the store state (e.g., during UI updates or partial rerenders), the function may return incorrect or outdated data.

## Desired Behavior

The `getExistingSpecialDamages` function should:
1. Prioritize reading special damages data from the Zustand store (`useStore.getState().results.specialDamages`)
2. Format this data appropriately for rendering (including specialDamageId and other necessary fields)
3. Only rely on DOM querying in exceptional cases or for supplementary information that isn't stored in the state
4. Ensure consistent behavior with `getExistingPayments` which already correctly reads directly from the store

This change will:
- Align the implementation with the documented architectural principle of using the store as the single source of truth
- Reduce the risk of data inconsistencies between the store and the UI
- Make the system more robust against race conditions during updates
- Create consistency with how payments are handled

## Context for Review

The following files would be beneficial to review during planning:

1. `BC COIA calculator/dom/tables.interest.rowSorting.js` - Contains the `getExistingSpecialDamages` function to be refactored
2. `BC COIA calculator/dom/specialDamages.js` - Has related code for rendering and updating special damages
3. `BC COIA calculator/store.js` - The Zustand store implementation that should be the source of truth
4. `AI/Context/dom_tables_interest_context.md` - Documents the architectural principles being enforced
5. `BC COIA calculator/calculator.core.js` - Contains code that interacts with these collection functions
6. `BC COIA calculator/calculator.ui.js` - May contain related event handling code

## Acceptance Criteria

- `getExistingSpecialDamages` reads primary data from the Zustand store, not from the DOM
- Special damages IDs are correctly preserved and included in the returned data
- The function maintains backward compatibility with code that uses its output
- Special damages are correctly rendered in the interest table
- Adding, editing, and deleting special damages work correctly after the change
- No regression in functionality or performance

## Technical Considerations

- Take note of any subtle differences in data structure between store data and the current function output format
- Ensure proper error handling for cases where store data might be invalid or incomplete
- Consider adding comments explaining the architectural principle being followed
- Add appropriate logging to assist with debugging potential issues during initial deployment
