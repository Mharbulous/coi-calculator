# Task 58.2: Create Base Modal Structure

**Objective:** Establish the foundational HTML structure and basic CSS for the new "Record Payment" modal, created dynamically using JavaScript.

**Prerequisites:** Task 58.1 completed (old modal code removed).

**Steps:**

1.  **Create New CSS File:** Create an empty file named `record-payment-modal.css` within the `BC COIA calculator/styles/components/` directory.
2.  **Import New CSS:** Edit the main stylesheet (`BC COIA calculator/styles/main.css`) and add an `@import` rule to include the newly created `record-payment-modal.css`.
3.  **Define Basic CSS:** In the new `record-payment-modal.css`, add fundamental styles for the modal overlay (fixed position, background color, z-index) and the main modal container (background, border-radius, basic dimensions, centering). Also, add basic styles for the header, body, and footer sections (padding, borders).
4.  **Create JS Function Skeleton:** In `BC COIA calculator/dom/modal.js`, create a new exported function named `promptForPaymentDetails`. This function should accept `prejudgmentDate` and `postjudgmentDate` as arguments and return a `Promise`. Leave the function body mostly empty for now, perhaps just logging that it was called.
5.  **Implement Basic DOM Creation:** Within the `promptForPaymentDetails` function, add JavaScript code to dynamically create the core HTML elements for the modal using `document.createElement`:
    *   An outer `div` with class `modal-overlay`.
    *   An inner `div` with class `modal`.
    *   Inside the `modal` div, create divs for `modal-header`, `modal-body`, and `modal-footer`.
    *   Add a heading (e.g., `h3`) with the text "Record Payment" inside the `modal-header`.
    *   Create two buttons ("Cancel", "Confirm") and place them inside the `modal-footer`. Assign appropriate classes (e.g., `modal-btn`, `modal-btn-cancel`, `modal-btn-confirm`).
    *   Create the basic form structure within the `modal-body`: two `div` elements with class `form-group`. Inside each, add a `label` element ("Date of Payment", "Amount of Payment") and an `input` element (type text). Also include an empty `div` with class `validation-message` after each input.
6.  **Assemble and Display:** Append the created elements to form the correct structure (header, body, footer inside modal; modal inside overlay). Finally, append the `modal-overlay` element to the `document.body` to make it visible.
7.  **Update Button Handler:** Modify `handleRecordPaymentClick` in `record-payment.js` to call the new `promptForPaymentDetails` function (passing placeholder dates for now if needed).

**Acceptance Criteria:**

*   A new `record-payment-modal.css` file exists and is imported by `main.css`.
*   Clicking the "Record Payment" button now displays a basic, unstyled or minimally styled modal dialog on the screen.
*   The modal contains the title "Record Payment", labels for "Date of Payment" and "Amount of Payment", two text input fields, and "Cancel" and "Confirm" buttons.
*   The modal overlay covers the screen.
*   The modal does not yet have any functionality (no date picker, no validation, buttons don't close it).
*   The application runs without errors related to this new structure.
