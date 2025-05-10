# Context: DOM Interest Table Rendering (`tables.interest.*.js`)

**Purpose:** This document provides essential context for developers working on the interest table rendering logic within the BC COIA calculator, specifically the modules refactored from the original `dom/tables.interest.js`. Reviewing this context is beneficial before modifying how interest tables are displayed, how special damages or payments are inserted/sorted within these tables, or how user interactions like adding special damages trigger updates.

## 1. Non-Obvious Discoveries & Key Learnings

*   **Event-Driven Recalculation Impact:** A critical discovery during debugging was the interaction between direct DOM manipulation (like adding a special damages row) and the application's event-driven recalculation (`recalculate()` triggered by `special-damages-updated`). Adding a row to the DOM and immediately triggering an event that caused `updateInterestTable` to run (which clears and rebuilds the table from store data) led to the newly added DOM row being lost before it could be properly persisted or interacted with.
*   **Store Synchronization (Source of Truth):** A fundamental principle is that the **Zustand store is the single source of truth.**
    *   Simply adding a row to the DOM is insufficient. The corresponding data (e.g., for special damages or payments) must be added to the Zustand store (e.g., `useStore.getState().addSpecialDamage()`, `useStore.getState().addPayment()`) *before* any related update events (like `special-damages-updated` or `payment-updated`) are dispatched. This ensures the data exists in the central state when the table is rebuilt during the subsequent `recalculate()` cycle.
    *   Functions that collect data for table rendering or calculation (e.g., `getExistingSpecialDamages`, `getExistingPayments` in `rowSorting.js`, or `collectPayments`/`collectSpecialDamages` in `calculator.core.js`) **must read directly from the store.** They should not scrape data from the DOM and then update the store during a recalculation cycle, as this can overwrite valid store changes that haven't yet been rendered, leading to data loss or inconsistent state.
*   **Race Condition Mitigation (Special Damages Example):** To prevent the table rebuild from interfering with the immediate DOM update when adding a special damages row, a temporary global flag (`window._isSpecialDamagesAddInProgress`) was introduced. This flag is checked in the `tables.interest.js` facade to skip the `coreUpdateInterestTable` call if a row addition is in progress, allowing the DOM update to complete visually before the full table rebuild occurs shortly after. A similar consideration for data integrity (store first, then event) applies to payment additions.

## 2. Architectural Patterns & Relationships

*   **Module Splitting:** The original monolithic `tables.interest.js` (450+ lines) was refactored into three distinct modules based on responsibility:
    *   `tables.interest.core.js`: Orchestration and coordination.
    *   `tables.interest.rowRendering.js`: DOM manipulation, row/cell creation, formatting, button handling.
    *   `tables.interest.rowSorting.js`: Data collection (from DOM/store), sorting logic for special damages/payments, insertion index calculation.
*   **Facade Pattern:** The original `tables.interest.js` now acts as a facade, re-exporting the primary `updateInterestTable` function from `tables.interest.core.js`. This maintains backward compatibility for other parts of the system (`calculator.core.js`, `domUtils.js`) that import from it.
*   **Event-Driven Updates:** The system relies heavily on custom DOM events (`special-damages-updated`, `payment-updated`, `content-changed`) listened to in `calculator.ui.js` to trigger `recalculate()` in `calculator.core.js`, which in turn calls `updateInterestTable`.
*   **Centralized State (Zustand):** Table rendering primarily relies on data fetched from the Zustand store (`useStore`). DOM elements like input fields within special damages rows are used for user interaction but the source of truth for recalculation and re-rendering is the store.

## 3. Potential Pitfalls & Edge Cases

*   **Timing Issues & Store Integrity:**
    *   Modifying the table DOM and triggering recalculation events requires careful sequencing. Always update the Zustand store with new data (e.g., new special damage, new payment) *before* dispatching any event that triggers `recalculate()`.
    *   Avoid patterns where data collection functions (e.g., `collectPayments`, `collectSpecialDamages` in `calculator.core.js`) read from the DOM and then write back to the store during a `recalculate()` cycle. This can inadvertently overwrite new data that was added to the store but not yet rendered to the DOM. These collection functions should primarily be *readers* of the store state during recalculation.
    *   The `window._isSpecialDamagesAddInProgress` flag is an example of managing timing for visual updates vs. full recalculations.
*   **DOM vs. Store Discrepancies (Source of Truth Adherence):** The primary source of truth for table rendering data (special damages, payments, interest period details) is the Zustand store.
    *   While `getExistingSpecialDamages` in `rowSorting.js` might have logic to read from the DOM as a fallback or for specific UI interactions, the core data for rebuilding tables during `updateInterestTable` comes from the `resultState` (derived from the store) passed into it.
    *   Ensure that any user interactions that modify data (e.g., editing a special damage amount in a DOM input) correctly update the Zustand store, which then triggers a re-render.
*   **Insertion Index Calculation:** Calculating the correct index to insert sorted rows (`findInsertionIndex` in `rowSorting.js`) is complex due to different row types (interest periods, special damages, payments) and specific sorting rules based on date and type precedence. Errors here can lead to incorrectly ordered tables.
*   **Dynamic Imports:** The "add special damages" button relies on a dynamic import (`await import('./specialDamages.js')`). Failures in loading this module will break the button functionality.

## 4. Component Interactions

*   **`calculator.ui.js`:** Listens for `special-damages-updated` and `payment-updated` events, triggering `recalculate()`.
*   **`calculator.core.js`:** Contains `recalculate()`, which gathers inputs, performs calculations, updates the store, and calls `updateInterestTable` (via `domUtils.js`) for both prejudgment and postjudgment tables.
*   **`domUtils.js`:** Acts as a central export point for DOM-related functions, including re-exporting `updateInterestTable` from the `tables.interest.js` facade.
*   **`specialDamages.js`:** Contains `insertSpecialDamagesRow` (called by the button click handler in `rowRendering.js`) and `insertSpecialDamagesRowFromData` (called by `rowSorting.js`). It interacts with the store (`addSpecialDamage`) and dispatches the `special-damages-updated` event.
*   **`payments.js`:** Contains `insertPaymentRowFromData` (called by `rowSorting.js`).
*   **`store.js` (Zustand):** Provides the central state (`results.specialDamages`, `results.payments`, `results.prejudgmentResult`, etc.) used by `rowSorting.js` to get data and by `core.js` to pass `resultState` for rendering.

## 5. Testing Considerations

*   **Integration Testing:** Due to the heavy interaction between modules, the store, and DOM events, integration testing is crucial. Testing `updateInterestTable` in `core.js` should verify the correct orchestration and final rendered output.
*   **Unit Testing:** Individual functions within `rowRendering.js` (e.g., cell formatting) and `rowSorting.js` (e.g., sorting algorithm, index calculation) can be unit-tested. Mocking store state and dependencies will be necessary.
*   **Visual Regression:** Manual visual comparison or automated visual regression testing is recommended after changes, as the table structure and styling are complex.
*   **Edge Case Testing:** Test scenarios involving:
    *   Adding/deleting multiple special damages/payments quickly.
    *   Items with the same date but different types (ensure correct sorting precedence).
    *   Empty tables or tables with only one type of row.
    *   Interaction with the "Show Prejudgment" checkbox (saving/restoring state).
