# Task: Refactor State Management to Use Valtio

**Goal:** Replace the current custom `appState` object in `calculator.js` with Valtio for more robust, scalable, and maintainable state management.

**Context:**
The current simple `appState` object works but lacks the structure, tooling, and scalability benefits of a dedicated state management library. Valtio offers an intuitive proxy-based approach that should integrate well with the existing structure while providing these benefits.

**Target Files:**
*   `BC COIA calculator/calculator.js` (Primary focus)
*   `BC COIA calculator/domUtils.js` (Will need updates to consume state differently)
*   `BC COIA calculator/calculations.js` (May need minor adjustments if it interacts with state)
*   `package.json` (To add Valtio dependency)
*   Potentially HTML if React integration is chosen later (but assume vanilla JS for now).

**Requirements:**

1.  **Install Valtio:**
    *   Add Valtio as a project dependency. (Requires `npm` or `yarn`). Command: `npm install valtio`

2.  **Create Valtio Store:**
    *   In `calculator.js` (or a dedicated `store.js` file if preferred), import `proxy` from Valtio.
    *   Define the application state using `proxy()`, mirroring the structure of the existing `appState` object (inputs, results).
    *   Export the created proxy state.

3.  **Refactor State Updates:**
    *   Replace direct assignments to the old `appState` object with mutations to the Valtio proxy state.
        *   Example: Instead of `appState.inputs.jurisdiction = newValue;`, use `valtioState.inputs.jurisdiction = newValue;` (assuming `valtioState` is the exported proxy).
    *   Update `getInputValues` (or where validation happens) to write validated inputs into the Valtio state.
    *   Update calculation functions (`calculateInterestPeriods`, `calculatePerDiem`, `collectSpecialDamages`, `recalculate`) to read from and write results to the Valtio state.

4.  **Refactor State Consumption (UI Updates):**
    *   Import `subscribe` from Valtio in `calculator.js` or `domUtils.js`.
    *   Modify UI update functions (`updateInterestTable`, `updateSummaryTable`, potentially others in `domUtils.js`) to no longer receive state slices as direct arguments.
    *   Instead, use `subscribe` to listen for changes in the Valtio state. When the state changes, these functions should read the necessary data directly from the Valtio proxy state and update the DOM accordingly.
    *   Alternatively, if integrating with a framework like React later, components would use hooks like `useSnapshot` to react to state changes. For vanilla JS, `subscribe` is the primary mechanism.

5.  **Initialization:**
    *   Ensure `initializeCalculator` sets the initial default values within the Valtio state.

6.  **Testing:**
    *   Thoroughly test the calculator to ensure all functionality remains the same after refactoring. Pay attention to input changes, calculations, and UI updates for all sections (prejudgment, postjudgment, summary, special damages).

**Acceptance Criteria:**
*   Valtio is added as a project dependency.
*   The custom `appState` object is removed and replaced by a Valtio proxy store.
*   All state reads and writes throughout the application use the Valtio store.
*   UI updates are triggered by subscribing to changes in the Valtio store.
*   The calculator's functionality is identical to the previous version.
*   The codebase is cleaner and state management logic is centralized and more robust.

**Notes:**
*   This refactor assumes a vanilla JavaScript implementation for now. If React or another framework is introduced later, the consumption part (Step 4) would change to use framework-specific hooks (`useSnapshot`).
*   Consider organizing state-related logic (store definition, update functions if they become complex) into a dedicated `store.js` file for better separation of concerns as the app grows.
