# Task: Refactor Complex Functions

**Goal:** Improve code readability, testability, and maintainability by breaking down large, complex functions into smaller, single-responsibility units.

**Context:**
The `recalculate` function in `calculator.js` and the `getInputValues` function in `domUtils.js` currently handle too many distinct steps, making them harder to understand and modify.

**Target Files:**
*   `BC COIA calculator/calculator.js`
*   `BC COIA calculator/domUtils.js`

**Requirements:**

1.  **Refactor `calculator.js` (`recalculate` function):**
    *   Identify the distinct logical steps within the current `recalculate` function (e.g., input gathering/validation, rate checking, prejudgment calculation, postjudgment calculation, summary data preparation, UI updates).
    *   Extract these steps into separate, well-named helper functions within `calculator.js`.
    *   The main `recalculate` function should now primarily orchestrate the calls to these helper functions.
    *   Ensure data flows correctly between the helper functions (consider passing necessary data as arguments or using a simple state object if implementing Task #4).

2.  **Refactor `domUtils.js` (`getInputValues` function):**
    *   Separate the responsibility of *reading* input values from the DOM from the responsibility of *validating* those values.
    *   Keep `getInputValues` focused on retrieving raw values from the DOM elements.
    *   Create a new function, `validateInputValues(inputs)`, within `domUtils.js` (or potentially a new `validation.js` module if preferred).
    *   This new validation function will take the object returned by `getInputValues` as input.
    *   Move all the validation logic (date comparisons, range checks, amount checks) from `getInputValues` into `validateInputValues`.
    *   `validateInputValues` should return an object indicating validity status and any error messages (e.g., `{ isValid: boolean, validationMessage: string }`).
    *   Update `calculator.js` to call `getInputValues` first, then pass the result to `validateInputValues`.

**Acceptance Criteria:**
*   The `recalculate` function in `calculator.js` is significantly shorter and delegates most work to clearly named helper functions.
*   The `getInputValues` function in `domUtils.js` primarily reads DOM values.
*   A separate `validateInputValues` function exists and contains the validation logic previously in `getInputValues`.
*   The calculator's overall functionality remains unchanged.
*   The code is arguably easier to read and understand.

**Notes:**
*   This refactoring is a prerequisite or can be done concurrently with implementing unit tests (Task #1), as smaller functions are easier to test.
*   Consider how this interacts with the potential State Management task (Task #4). If implementing state management, the refactored functions should read from/write to the state object appropriately.
