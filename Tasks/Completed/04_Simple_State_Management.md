# Task: Introduce Simple State Management

**Goal:** Improve data flow clarity, reduce direct DOM dependencies, and make the application easier to reason about by introducing a simple, centralized state object.

**Context:**
Currently, application state (like input values and calculation results) is often read directly from the DOM when needed (e.g., in `recalculate`) or passed extensively between functions. Centralizing this state can simplify logic and decouple modules.

**Target Files:**
*   `BC COIA calculator/calculator.js`
*   `BC COIA calculator/domUtils.js`
*   Potentially `BC COIA calculator/calculations.js` (depending on implementation choice)

**Requirements:**

1.  **Define State Object in `calculator.js`:**
    *   Create a module-level variable (e.g., `let appState = {};`) in `calculator.js` to hold the application's state.
    *   Define the structure of this state object. It should include fields for:
        *   Validated input values (e.g., `jurisdiction`, `pecuniaryAmount`, `pecuniaryDate`, `prejudgmentStartDate`, `showPrejudgment`, etc.).
        *   Calculated results (e.g., `prejudgmentInterestTotal`, `postjudgmentInterestTotal`, `totalOwing`, `perDiem`).
        *   Potentially UI state (e.g., `isValid`, `validationMessage`).

2.  **Update Input Handling:**
    *   Modify `calculator.js` so that after getting raw values (`getInputValues`) and validating them (`validateInputValues` - from Task #2 refactor), the validated inputs are stored in the `appState` object.

3.  **Update Calculation Logic:**
    *   Refactor the calculation helper functions (created in Task #2) within `calculator.js` (e.g., `calculatePrejudgmentInterest`, `calculatePostjudgmentInterest`) to:
        *   Read necessary input parameters directly from the `appState` object.
        *   Write their results back into the appropriate fields in the `appState` object.
    *   Reduce the need to pass numerous parameters between these internal functions.

4.  **Update UI Rendering:**
    *   Modify the UI update functions in `domUtils.js` (`updateInterestTable`, `updateSummaryTable`) to accept the relevant parts of the `appState` object as input, rather than individual calculated values or inputs read directly from the DOM elsewhere.
    *   These functions will read from the passed state data to render the tables and summary section.
    *   The main `recalculate` (or its orchestrating helpers) in `calculator.js` will be responsible for passing the necessary state slices to the `domUtils` functions.

**Acceptance Criteria:**
*   A central `appState` object exists in `calculator.js` and holds key input values and calculation results.
*   Input gathering and validation logic updates this `appState`.
*   Calculation logic reads inputs from and writes results to `appState`.
*   UI update functions (`domUtils.js`) are driven by data passed from `appState`, reducing their need to know about the calculation specifics or read inputs directly.
*   The calculator's overall functionality remains unchanged.
*   Data flow within the application is clearer and less reliant on direct DOM reads or excessive parameter passing.

**Notes:**
*   This task benefits significantly from having completed the function refactoring (Task #2).
*   Keep the state management simple; avoid complex libraries unless the application's complexity significantly increases. A plain JavaScript object managed within `calculator.js` is likely sufficient.
*   Ensure the initial state is set correctly during `initializeCalculator`.
