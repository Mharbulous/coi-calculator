# Task: Refactor `tables.interest.js` for Improved Modularity

**Date:** 2025-05-07

**Objective:**
Split the `BC COIA calculator/dom/tables.interest.js` file, which is currently over 450 lines, into three or more smaller, more manageable modules. This refactoring aims to improve maintainability, readability, and testability without altering existing application functionality. The target is to keep individual file sizes around 200 lines or less.

**Chosen Approach: Component-Based Split**

The `tables.interest.js` module will be divided into the following new files:

1.  **`tables.interest.core.js`**: This module will serve as the main orchestrator and entry point. It will retain the primary `updateInterestTable` function signature for backward compatibility and will coordinate calls to the other new modules.
2.  **`tables.interest.rowRendering.js`**: This module will be responsible for all aspects of row creation, DOM manipulation for individual rows (interest calculation rows, payment rows), cell formatting, and rendering the table footer and totals.
3.  **`tables.interest.rowSorting.js`**: This module will encapsulate the complex logic for sorting all row types (interest, special damages, payments) chronologically and according to specific business rules. It will also handle the logic for determining the correct insertion position for these rows within the table.

**Refactoring Steps:**

1.  **Create New Files:**
    *   Create `tables.interest.core.js`, `tables.interest.rowRendering.js`, and `tables.interest.rowSorting.js` in the `BC COIA calculator/dom/` directory.
    *   Set up initial imports (utils, store, other DOM modules) and exports for each new file.

2.  **Incrementally Extract Logic:**
    *   **`tables.interest.rowRendering.js`**:
        *   Move functions/logic related to creating and populating cells for standard interest rows.
        *   Move functions/logic for rendering payment rows.
        *   Move logic for updating the table's footer (totals, dates, total days).
        *   Ensure all necessary utility functions (e.g., `formatCurrencyForDisplay`, `formatDateForDisplay`) are imported or data is passed as parameters.
        *   Handle the "add special damages" button creation and its event listener logic within this module, as it's part of row rendering.
    *   **`tables.interest.rowSorting.js`**:
        *   Move the logic for collecting existing special damages and payment data.
        *   Move the complex sorting algorithm that orders all row types (interest periods, special damages, payments) based on date and precedence rules.
        *   Move the logic for finding the correct DOM insertion index for each sorted row.
        *   This module will call `insertSpecialDamagesRowFromData` and `insertPaymentRowFromData` from their respective existing modules (`specialDamages.js`, `payments.js`).
    *   **`tables.interest.core.js`**:
        *   The `updateInterestTable` function will be refactored to:
            *   Perform initial setup (clearing table, getting result state).
            *   Call functions from `tables.interest.rowRendering.js` to render the basic structure of interest calculation rows.
            *   Call functions from `tables.interest.rowSorting.js` to handle the re-insertion and correct placement of special damages and payments.
            *   Call functions from `tables.interest.rowRendering.js` to update the table footer.
        *   This module will import functions from the new `rowRendering` and `rowSorting` modules.

3.  **Maintain Backward Compatibility (Facade Pattern):**
    *   Initially, the original `tables.interest.js` file will be modified to import and re-export the `updateInterestTable` function (and any other necessary exports) from `tables.interest.core.js`.
    *   This ensures that other parts of the application that import from `tables.interest.js` continue to function without modification during the refactoring process.

4.  **Update Original File:**
    *   Once the refactoring is complete and tested, the original `tables.interest.js` can be simplified to solely act as a facade, re-exporting all necessary functionalities from the new modules.

5.  **Testing Strategy:**
    *   **Unit Testing:** Write unit tests for each new exported function in `tables.interest.rowRendering.js` and `tables.interest.rowSorting.js` to verify their logic in isolation.
    *   **Integration Testing:** Test the `updateInterestTable` function in `tables.interest.core.js` to ensure it correctly orchestrates the calls to the other modules and the overall table rendering process remains correct.
    *   **Visual Comparison:** Manually inspect and compare the rendered interest tables before and after the refactoring in various scenarios to ensure no visual or functional regressions.
    *   **End-to-End Testing:** Leverage existing or create new end-to-end tests that cover scenarios involving the interest tables.

6.  **Gradual Transition (Optional Post-Refactor):**
    *   After the refactor is stable, consider updating import statements in other parts of the application to point directly to the new, more specific modules if appropriate, rather than going through the `tables.interest.js` facade.

**Key Considerations During Refactoring:**

*   **Dependency Management:** Carefully manage imports and exports. Ensure all utility functions, store access, DOM element references, and other module dependencies are correctly handled in the new files (either imported directly or data passed as parameters).
*   **Scope and Closures:** Be mindful of variable scopes and closures when moving logic from the large original function into smaller, separate functions/modules. Data may need to be explicitly passed.
*   **Side Effects:** Ensure all DOM manipulations and interactions with the Zustand store are correctly replicated or delegated. The orchestration in `tables.interest.core.js` is key.
*   **Dynamic Imports:** The dynamic import `await import('./specialDamages.js')` (used for the "add special damages" button) must be correctly handled in its new location (likely `tables.interest.rowRendering.js`).
*   **Order of Operations:** The precise sequence of operations in the original `updateInterestTable` function must be maintained in the refactored version.
*   **Store Access:** Decide whether new modules will import `useStore` directly or receive necessary state slices as parameters from `tables.interest.core.js`. Passing state as parameters is generally preferred for better testability.
*   **Error Handling:** Ensure consistent error handling across the new modules, or centralize it in `tables.interest.core.js`.
