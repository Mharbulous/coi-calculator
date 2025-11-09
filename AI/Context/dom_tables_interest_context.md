# Context: DOM Interest Table Rendering (`tables.interest.*.js`)

**Purpose:** This document provides essential context for developers working on the interest table rendering logic within the BC COIA calculator, specifically the modules refactored from the original `dom/tables.interest.js`. Reviewing this context is beneficial before modifying how interest tables are displayed, how special damages or payments are inserted/sorted within these tables, or how user interactions like adding special damages trigger updates.

## 1. Non-Obvious Discoveries & Key Learnings

*   **Event-Driven Recalculation Impact:** A critical discovery during debugging was the interaction between direct DOM manipulation (like adding a special damages row) and the application's event-driven recalculation (`recalculate()` triggered by `special-damages-updated`). Adding a row to the DOM and immediately triggering an event that caused `updateInterestTable` to run (which clears and rebuilds the table from store data) led to the newly added DOM row being lost before it could be properly persisted or interacted with.
*   **Row Duplication Filtering:** To prevent duplicative rows in interest tables, `tables.interest.core.js` implements a filtering mechanism before rendering. The function applies a two-pass process: first, it identifies payment dates that match end dates of interest periods, and then it filters out rows that would cause duplication (e.g., payment rows that share dates with previously processed rows). This filtered data is passed to `renderInitialInterestRows` instead of the raw calculation results.
*   **Store Synchronization (Source of Truth):** A fundamental principle is that the **Zustand store is the single source of truth.**
    *   Simply adding a row to the DOM is insufficient. The corresponding data (e.g., for special damages or payments) must be added to the Zustand store (e.g., `useStore.getState().addSpecialDamage()`, `useStore.getState().addPayment()`) *before* any related update events (like `special-damages-updated` or `payment-updated`) are dispatched. This ensures the data exists in the central state when the table is rebuilt during the subsequent `recalculate()` cycle.
    *   Functions that collect data for table rendering or calculation (e.g., `getExistingSpecialDamages`, `getExistingPayments` in `rowSorting.js`, or `collectPayments`/`collectSpecialDamages` in `calculator.core.js`) **must read directly from the store.** They should not scrape data from the DOM and then update the store during a recalculation cycle, as this can overwrite valid store changes that haven't yet been rendered, leading to data loss or inconsistent state.
*   **Race Condition Mitigation (Special Damages Example - DEPRECATED):** Previously, a temporary global flag (`window._isSpecialDamagesAddInProgress`) was used to prevent table rebuilds during special damage row additions. This approach was found to be a source of instability (e.g., datepickers disappearing) and has been removed from the core module (`tables.interest.core.js`), though a check still exists in the facade module (`tables.interest.js`). The current best practice is to ensure the store is updated, dispatch an event, and let the standard `recalculate` and `updateInterestTable` flow handle a full and consistent re-render.
*   **Unique IDs for Editable Row Items:** For editable fields within table rows (like dates or amounts for payments and special damages) to correctly update the Zustand store, each underlying store item *must* have a unique identifier (e.g., `paymentId`, `specialDamageId`).
    *   These IDs must be consistently assigned when items are added (`addPayment`, `addSpecialDamage`), updated (`updatePayment`, `updateSpecialDamage`), initialized by default (`calculator.ui.js` for initial default data, `store.js` `resetStore` for its single default payment), or restored from a saved state (`store.js` `restorePrejudgmentState`).
    *   The DOM rendering functions (`insertPaymentRowFromData`, `insertSpecialDamagesRowFromData`, and also `insertPaymentRow`, `insertSpecialDamagesRow` for new rows) must set these IDs as `data-payment-id` or `data-special-damage-id` attributes on a relevant DOM element within the row (typically the date input, as it's consistently present).
    *   Event handlers for changes to these editable fields (e.g., `onPaymentDateChange` in `datepickers.js`, or callbacks for `setupCurrencyInputListeners`) must then retrieve this `data-id` from the DOM, find the corresponding item in the store, and update that specific item *before* triggering a general recalculation event.
*   **Data Propagation for Rendering:** When `collectAndSortRows` (in `tables.interest.rowSorting.js`) prepares data for rendering by `insertPaymentRowFromData` or `insertSpecialDamagesRowFromData`, it's crucial that the helper functions it uses (`getExistingPayments`, `getExistingSpecialDamages`) include these unique IDs in the `rowData` objects they create. If IDs are omitted here, the `insert...FromData` functions won't be able to set the `data-id` attributes on the DOM elements, breaking the update chain for existing/default items.
*   **Datepicker Lifecycle Management:** All Flatpickr instances for date inputs in the interest tables must be destroyed (e.g., using `destroyAllSpecialDamagesDatePickers()` and `destroyAllPaymentDatePickers()` in `calculator.core.js` before `updateInterestTable`) and then re-initialized by the row rendering functions (`insert...FromData`, `insert...Row`) during each table rebuild. This prevents stale or orphaned datepicker instances.

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
    *   The `window._isSpecialDamagesAddInProgress` flag (now removed) was an attempt to manage timing for visual updates vs. full recalculations, but proved unstable. Rely on synchronous store updates followed by event-driven full re-renders.
*   **DOM vs. Store Discrepancies (Source of Truth Adherence & ID Propagation):**
    *   The primary source of truth for table rendering data (special damages, payments, interest period details) is the Zustand store. All items should have unique IDs.
    *   When rendering rows (e.g., via `insertPaymentRowFromData`, `insertSpecialDamagesRowFromData`), ensure the `rowData` passed to these functions includes the unique ID from the store item. These functions must then set this ID as a `data-id` attribute on the relevant input fields (e.g., the date input).
    *   Event handlers for editable fields (dates, amounts) *must* retrieve this `data-id`, find the item in the store, update the store *first*, and then dispatch an event to trigger `recalculate()`. Failure to update the store first will cause the UI to revert to the old value.
    *   Ensure that functions like `getExistingPayments` and `getExistingSpecialDamages` in `tables.interest.rowSorting.js` correctly pass through the unique IDs when preparing data for `collectAndSortRows`.
*   **Initial Data Population:** Default data (e.g., in `calculator.ui.js` `initializeCalculator`) that is loaded into the store via `initializeStore` must include the necessary unique IDs (`paymentId`, `specialDamageId`) from the outset. If `resetStore` is called first, and then `initializeStore` overwrites parts of the `results` state, the data from `initializeStore` must be ID-complete.
*   **Insertion Index Calculation:** Calculating the correct index to insert sorted rows (`findInsertionIndex` in `rowSorting.js`) is complex due to different row types (interest periods, special damages, payments) and specific sorting rules based on date and type precedence. Errors here can lead to incorrectly ordered tables.
*   **Row Duplication After Payment Handling:** The module includes a `handleRowDuplicationAfterPayment` function in `tables.interest.rowSorting.js` which was originally designed to duplicate interest period rows in the DOM when a payment would split a period. This row duplication logic has been intentionally disabled (code is commented out) because the responsibility for providing correctly split rows has shifted to the store/calculation engine. Now, when a payment falls within an interest period, the calculation engine should directly produce the required separate periods in the result data rather than relying on DOM manipulation to visually simulate this splitting.
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
