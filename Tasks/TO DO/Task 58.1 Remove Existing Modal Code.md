# Task 58.1: Remove Existing Modal Code

**Objective:** Clean up the codebase by removing all traces of the previous, problematic "Record Payment" modal implementation. This sets the stage for a fresh rebuild.

**Steps:**

1.  **Delete JavaScript Function:** Locate the `showRecordPaymentModal` function within the `BC COIA calculator/dom/modal.js` file and delete it entirely.
2.  **Delete CSS File:** Find and delete the CSS file specifically created for the old modal: `BC COIA calculator/styles/components/record-payment-modal.css`.
3.  **Update Main CSS:** Edit the main stylesheet (`BC COIA calculator/styles/main.css`) and remove the `@import` rule that references the deleted `record-payment-modal.css` file.
4.  **Revert Button Handler:** Modify the `handleRecordPaymentClick` function in `BC COIA calculator/record-payment.js`. Remove the line that called the now-deleted `showRecordPaymentModal`. For now, this function should only perform basic actions like logging a message to the console indicating the button was clicked, or retrieving the necessary dates from the application's state store without attempting to display a modal.

**Acceptance Criteria:**

*   The `showRecordPaymentModal` function no longer exists in `modal.js`.
*   The `record-payment-modal.css` file is deleted from the project.
*   The `main.css` file no longer attempts to import the deleted CSS file.
*   Clicking the "Record Payment" button in the application no longer attempts to open a modal and does not cause errors (it might log a message or do nothing visible).
*   The application builds and runs without errors related to the removed code.
