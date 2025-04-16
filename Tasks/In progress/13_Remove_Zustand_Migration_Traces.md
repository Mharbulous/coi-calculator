# Task: Remove Zustand Migration Traces

**Goal:** Improve code readability and maintainability by removing compatibility layers and references that were used during the migration from the custom state management system to Zustand.

**Context:**
During the migration to Zustand (Task 12), compatibility layers were added to ensure a smooth transition. Now that the migration is complete, these layers add unnecessary complexity and should be removed.

**Target Files:**
*   `BC COIA calculator/calculator.js`
*   `BC COIA calculator/domUtils.js`
*   `BC COIA calculator/calculations.js`

**Requirements:**

1.  **Clean up `calculator.js`:**
    *   Remove the `appState` variable that currently serves as a reference to the Zustand store state.
    *   Replace all instances of `appState` access with direct calls to `useStore.getState()`.
    *   Remove all comments related to updating the `appState` reference.
    *   Example:
        ```javascript
        // Before:
        // Update appState reference with the latest state
        appState = useStore.getState();
        const specialDamagesTotal = appState.results.specialDamagesTotal;

        // After:
        const specialDamagesTotal = useStore.getState().results.specialDamagesTotal;
        ```

2.  **Clean up `domUtils.js`:**
    *   Simplify the `updateSummaryTable` function to only work with the Zustand store.
    *   Remove the compatibility code that checks if we're using `appState` or Zustand.
    *   Example:
        ```javascript
        // Before:
        // Determine if we're using appState or Zustand store
        let inputs, results;
        if (state.getState) {
            // Using Zustand store
            const storeState = state.getState();
            inputs = storeState.inputs;
            results = storeState.results;
        } else {
            // Using appState object
            inputs = state.inputs;
            results = state.results;
        }

        // After:
        const storeState = state.getState();
        const inputs = storeState.inputs;
        const results = storeState.results;
        ```

3.  **Clean up `calculations.js`:**
    *   Update the comment that references `appState` to refer to the Zustand store instead.
    *   Example:
        ```javascript
        // Before:
        // Parse and sort special damages (Dates are already YYYY-MM-DD strings in appState)

        // After:
        // Parse and sort special damages (Dates are already YYYY-MM-DD strings in the store)
        ```

4.  **Update function signatures and documentation:**
    *   Update any function documentation that mentions `appState` to refer to the Zustand store instead.
    *   Ensure all JSDoc comments are updated to reflect the new state management approach.

**Acceptance Criteria:**
*   All references to `appState` are removed from the codebase.
*   The code directly uses the Zustand store for all state management.
*   All compatibility layers that were added during the migration are removed.
*   The application's functionality remains unchanged.
*   The code is more readable and easier to maintain without the dual state management references.

**Notes:**
*   This task should be performed after thorough testing of the Zustand implementation to ensure it's fully functional.
*   Consider adding additional unit tests specifically for the Zustand store interactions if they don't already exist.
*   This cleanup will make future maintenance easier by removing the cognitive overhead of understanding the compatibility layers.
