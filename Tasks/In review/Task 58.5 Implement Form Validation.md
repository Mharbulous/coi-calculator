# Task 58.5: Implement Form Validation

**Objective:** Implement client-side validation for the date and amount input fields within the modal, provide visual feedback to the user via validation messages, and dynamically enable/disable the "Confirm" button based on the form's validity.

**Prerequisites:** Task 58.4 completed (modal structure, styling, and Flatpickr integration are in place).

**Steps:**

1.  **Modify JS Function:** Open `BC COIA calculator/dom/modal.js` and locate the `promptForPaymentDetails` function.
2.  **Create Validation Function:** Define a new internal helper function named `validateForm` within the scope of `promptForPaymentDetails`.
3.  **Implement Validation Logic:** Inside `validateForm`:
    *   Retrieve the currently selected date from the Flatpickr instance (e.g., `datePickerInstance.selectedDates[0]`).
    *   Retrieve the current value from the amount input field.
    *   Parse the amount value: remove non-numeric characters (like '$' and ',') and convert it to a floating-point number. Handle potential parsing errors (e.g., if the input is non-numeric).
    *   Check date validity: Ensure a date object exists (i.e., a date has been selected).
    *   Check amount validity: Ensure the parsed amount is a valid number and is greater than zero.
    *   Determine overall form validity: The form is valid only if both the date is selected and the amount is a positive number.
4.  **Update Validation Messages:**
    *   Get references to the empty `div` elements with the class `validation-message` associated with the date and amount inputs.
    *   Based on the validation checks, update the `textContent` of these divs. If an input is invalid, display a specific error message (e.g., "Please select a payment date", "Amount must be greater than $0.00"). If an input is valid, set its corresponding validation message `textContent` to an empty string.
5.  **Control Confirm Button State:** Get a reference to the "Confirm" button. Set its `disabled` property based on the overall form validity calculated in step 3 (set `disabled = true` if invalid, `disabled = false` if valid).
6.  **Trigger Validation:**
    *   Modify the Flatpickr `onChange` handler (created in Task 58.4) so that it calls the `validateForm` function whenever the date changes.
    *   Add an `input` event listener to the amount input field. This listener should also call the `validateForm` function whenever the user types in the amount field.
    *   Call `validateForm` once immediately after initializing Flatpickr and adding the event listeners. This ensures the initial state of the form (likely invalid due to the empty amount) and the Confirm button (disabled) is set correctly when the modal first opens.

**Acceptance Criteria:**

*   When the modal opens, the "Confirm" button is initially disabled.
*   An error message ("Please enter a payment amount") appears below the amount field initially.
*   If the user clears the date field, an error message ("Please select a payment date") appears below it, and the Confirm button remains/becomes disabled.
*   If the user enters an amount less than or equal to zero, or non-numeric text, an appropriate error message appears below the amount field, and the Confirm button remains/becomes disabled.
*   Error messages disappear when the corresponding field becomes valid.
*   The "Confirm" button becomes enabled *only* when a valid date is selected *and* a valid positive amount is entered.
