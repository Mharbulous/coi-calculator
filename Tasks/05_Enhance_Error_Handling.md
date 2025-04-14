# Task: Enhance Error Handling and Display

**Goal:** Improve the user experience and debugging capability by replacing disruptive `alert()` messages with a dedicated, non-blocking error display area on the page.

**Context:**
The application currently uses `alert()` to notify users of input validation errors or missing interest rate data. This interrupts the user flow and is not ideal for presenting feedback.

**Target Files:**
*   `BC COIA calculator/index.html`
*   `BC COIA calculator/calculator.js`
*   `BC COIA calculator/domUtils.js`

**Requirements:**

1.  **Add Error Display Area in `index.html`:**
    *   Add a dedicated HTML element (e.g., a `<div>`) to `index.html` where error messages can be displayed. Place it in a suitable location, perhaps below the main input fields or above the summary table.
    *   Assign a unique ID or `data-display` attribute to this element (e.g., `id="error-message-area"`).
    *   Style this area appropriately in `styles.css` (e.g., distinct background color, text color like red) and ensure it's hidden by default.

2.  **Create Error Handling Functions in `domUtils.js`:**
    *   Add a new function `displayError(message)`:
        *   Takes an error message string as input.
        *   Selects the error display element.
        *   Sets its `textContent` to the message.
        *   Makes the error display element visible.
    *   Add a new function `clearError()`:
        *   Selects the error display element.
        *   Clears its `textContent`.
        *   Hides the error display element.

3.  **Update `calculator.js`:**
    *   Modify the `recalculate` function (or its refactored helpers from Task #2):
        *   Before starting calculations, call `clearError()` from `domUtils.js`.
        *   In the input validation and rate checking sections, replace all `alert(validationMessage)` calls with `displayError(validationMessage)` from `domUtils.js`.
        *   Ensure that when an error occurs and `displayError` is called, the function exits appropriately (e.g., using `return`) to prevent further calculation attempts with invalid data.

**Acceptance Criteria:**
*   `index.html` includes a dedicated, initially hidden element for displaying errors.
*   `domUtils.js` contains `displayError` and `clearError` functions that manipulate this element.
*   `calculator.js` uses `clearError` at the start of recalculation and `displayError` instead of `alert` for validation/rate errors.
*   Error messages appear in the designated area on the page when inputs are invalid or rates are missing.
*   The error area is cleared when a subsequent recalculation starts.
*   The calculator's core functionality remains unchanged, but error feedback is less intrusive.

**Notes:**
*   Consider accessibility: Ensure the error message area has appropriate ARIA attributes if needed (e.g., `role="alert"`) so screen readers announce the error.
*   This task can be implemented independently but integrates well with the refactored `recalculate` function (Task #2).
