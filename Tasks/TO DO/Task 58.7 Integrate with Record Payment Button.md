# Task 58.7: Integrate with Record Payment Button

**Objective:** Connect the fully functional `promptForPaymentDetails` modal to the "Record Payment" button in the main application UI, ensuring data flows correctly from the application state to the modal and back.

**Prerequisites:** Task 58.6 completed (modal is fully functional with validation, listeners, and close logic).

**Steps:**

1.  **Modify Button Handler File:** Open `BC COIA calculator/record-payment.js`.
2.  **Import Modal Function:** Ensure the `promptForPaymentDetails` function is correctly imported from `dom/modal.js`.
3.  **Update Handler Logic:** Locate the `handleRecordPaymentClick` function.
    *   Mark the function as `async` since it will now `await` the promise returned by the modal.
    *   Add code to retrieve the current `prejudgmentStartDate` and `postjudgmentEndDate` from the application's state store (using `useStore.getState()`).
    *   Replace the placeholder call (or simple logging) with a call to `await promptForPaymentDetails(prejudgmentDate, postjudgmentDate)`, passing the actual dates retrieved from the store.
    *   Store the returned value (which will be `null` if cancelled, or an object `{ date, amount }` if confirmed) in a variable (e.g., `const paymentData = await ...`).
    *   Add conditional logic: If `paymentData` is not `null`, log the received payment details (date and amount) to the console. This confirms the data is being returned correctly. (Actually updating the application state or triggering recalculations based on this data is deferred to future tasks).

**Acceptance Criteria:**

*   Clicking the "Record Payment" button in the application UI opens the newly built payment modal.
*   The modal's date picker correctly uses the `prejudgmentStartDate` from the application state as its minimum selectable date.
*   Completing the modal form (entering a valid date and amount) and clicking "Confirm" closes the modal and logs an object containing the correct date and amount to the browser's console.
*   Cancelling the modal (clicking "Cancel", clicking the overlay, or pressing Escape) closes the modal and logs nothing (or logs an indication of cancellation, depending on implementation choice).
*   The integration works correctly without causing errors in the application.
