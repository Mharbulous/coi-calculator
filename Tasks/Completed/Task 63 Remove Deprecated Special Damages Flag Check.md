# Task 63: Remove Deprecated Special Damages Flag Check

## Description

The current implementation of `tables.interest.js` contains a check for a global flag `window._isSpecialDamagesAddInProgress` that has been marked as deprecated in the context documentation. This flag was originally used to prevent table rebuilds during special damage row additions, but has been removed from the core logic (`tables.interest.core.js`). However, it still remains in the facade module, creating an inconsistency between the documentation and implementation.

## Current Behavior

In `tables.interest.js`, the `updateInterestTable` function currently:
1. Checks for the existence of a global flag `window._isSpecialDamagesAddInProgress`
2. If the flag is set to true, it returns early without updating the table
3. Otherwise, it calls the core `updateInterestTable` function in `tables.interest.core.js`

This check means that any part of the application that sets this global flag will prevent table updates, even though the core module no longer relies on this mechanism.

## Desired Behavior

The `updateInterestTable` function in `tables.interest.js` should:
1. Remove the check for `window._isSpecialDamagesAddInProgress`
2. Always pass through the call to the core `updateInterestTable` function
3. Ensure any remaining references to this flag elsewhere in the codebase are also removed (if any exist)

This change will complete the deprecation of the flag mechanism, simplify the code, and align the implementation with the architecture described in the context documentation.

## Context for Review

The following files would be beneficial to review during planning:

1. `BC COIA calculator/dom/tables.interest.js` - The facade module containing the flag check to be removed
2. `BC COIA calculator/dom/tables.interest.core.js` - The core module that no longer uses this flag
3. `AI/Context/dom_tables_interest_context.md` - Contains the documentation about the flag being deprecated
4. `BC COIA calculator/dom/specialDamages.js` - May contain related code that used this flag mechanism
5. Any other code that may potentially use or set this global flag

## Acceptance Criteria

- The check for `window._isSpecialDamagesAddInProgress` in `tables.interest.js` is removed
- The `updateInterestTable` function in `tables.interest.js` always calls the core implementation
- The application functions correctly when adding special damages rows
- No loss of functionality or introduction of race conditions
- Any related code that may have depended on this flag has been appropriately updated

## Technical Considerations

- Verify that the current event-driven architecture with store-first updates functions correctly without this flag
- Ensure that the timing of special damages row additions and subsequent table rebuilds doesn't cause issues without this check
- Consider adding a brief comment explaining why the check was removed for future reference
