# Task 58.6: Add Event Listeners and Close Logic

**Objective:** Implement the core interaction logic for the modal, including handling button clicks, closing the modal via various methods (Cancel button, overlay click, Escape key), and ensuring proper cleanup. Also, implement currency formatting for the amount input and manage initial focus.

**Prerequisites:** Task 58.5 completed (modal structure, styling, Flatpickr, and validation are in place).

**Steps:**

1.  **Modify JS Function:** Open `BC COIA calculator/dom/modal.js` and locate the `promptForPaymentDetails` function.
2.  **Implement Close Function:** Define an internal helper function named `closeModal` within the scope of `promptForPaymentDetails`. This function should accept one argument, `result` (which will be `null` for cancellation or an object `{ date, amount }` for confirmation).
    *   Inside `closeModal`:
        *   Destroy the Flatpickr instance (using the stored instance variable and calling `.destroy()`).
        *   Remove the 'Escape' keydown event listener from the `document` (this listener will be added in step 4).
        *   Remove the entire `modal-overlay` element from the `document.body`.
        *   Resolve the `Promise` returned by `promptForPaymentDetails` with the `result` value passed to `closeModal`.
3.  **Add Button Listeners:**
    *   Get references to the "Cancel" and "Confirm" buttons.
    *   Add a `click` event listener to the "Cancel" button. This listener should simply call `closeModal(null)`.
    *   Add a `click` event listener to the "Confirm" button. This listener should:
        *   Retrieve the selected date from the Flatpickr instance.
        *   Retrieve the value from the amount input.
        *   Parse the amount value (remove '$', ',', etc., convert to float).
        *   Call `closeModal({ date: selectedDate, amount: parsedAmount })`. (Validation should already prevent this being called if data is invalid, but a final check could be added).
4.  **Add Overlay/Escape Listeners:**
    *   Get a reference to the `modal-overlay` element.
    *   Add a `click` event listener to the `modal-overlay`. Inside the listener, check if `event.target` is strictly equal to the `modal-overlay` element itself (to prevent closing when clicking inside the modal content). If it is, call `closeModal(null)`.
    *   Define a named function (e.g., `escapeKeyHandler`) that checks if `event.key === 'Escape'`. If it is, it calls `closeModal(null)` and crucially, removes itself as a listener using `document.removeEventListener('keydown', escapeKeyHandler)`.
    *   Add this `escapeKeyHandler` as a `keydown` event listener to the `document` right after the modal is added to the DOM.
5.  **Implement Currency Formatting:** Modify the `input` event listener on the amount field (created in Task 58.5). Before calling `validateForm`, add logic to reformat the input's `value` as a currency string (e.g., "$1,234.56") whenever the user types. Be careful to handle the cursor position and parsing correctly.
6.  **Manage Initial Focus:** After all elements are created and listeners are attached, add the code to set the initial focus on the amount input field. Use `requestAnimationFrame` to wrap the `.focus()` call, ensuring the layout is stable before focus is applied: `requestAnimationFrame(() => { amountInput.focus(); });`.

**Acceptance Criteria:**

*   Clicking the "Cancel" button closes the modal and resolves the promise with `null`.
*   Clicking outside the modal content area (on the semi-transparent overlay) closes the modal and resolves the promise with `null`.
*   Pressing the 'Escape' key closes the modal and resolves the promise with `null`.
*   When the form is valid and the "Confirm" button is clicked, the modal closes and resolves the promise with an object containing the selected `date` (Date object) and `amount` (number).
*   As the user types in the amount field, the value is automatically formatted as currency (e.g., "$1,234.56").
*   When the modal opens, the amount input field receives focus automatically.
*   All event listeners (especially the document-level keydown listener) and the Flatpickr instance are correctly removed/destroyed when the modal closes, preventing memory leaks.
