# Task 58.4: Implement Flatpickr Integration

**Objective:** Integrate the Flatpickr library with the "Date of Payment" input field within the modal to provide a user-friendly date selection calendar.

**Prerequisites:** Task 58.3 completed (modal structure exists and is styled).

**Steps:**

1.  **Modify JS Function:** Open `BC COIA calculator/dom/modal.js` and locate the `promptForPaymentDetails` function.
2.  **Initialize Flatpickr:** After the date input element is created and added to the DOM within the modal, add JavaScript code to initialize Flatpickr on this input.
3.  **Configure Flatpickr:** Pass a configuration object to the Flatpickr initialization:
    *   Set the desired `dateFormat` (e.g., "Y-m-d").
    *   Enable `allowInput` if users should be able to type the date directly.
    *   Set `disableMobile` to `true` to use the custom calendar on all devices.
    *   Use the `prejudgmentDate` argument passed into `promptForPaymentDetails` to set the `minDate` option, preventing users from selecting dates before the prejudgment interest period starts. Provide a reasonable fallback if `prejudgmentDate` is not available (e.g., "1993-01-01").
    *   Set the `maxDate` option to the current date ("today") to prevent users from selecting future dates.
    *   Set the `defaultDate` option to the current date ("today") so the calendar opens with today pre-selected.
    *   Add an `onChange` handler. For now, this handler can simply log the selected date(s) to the console. It will be used for validation in a later task.
    *   Consider setting a high `z-index` directly in the Flatpickr configuration if necessary to ensure the calendar appears above the modal overlay, although CSS might also handle this.
4.  **Store Instance:** Store the returned Flatpickr instance in a variable accessible within the `promptForPaymentDetails` scope (e.g., `const datePickerInstance = flatpickr(...)`). This instance is needed for cleanup.
5.  **Implement Cleanup:** Add logic (which will eventually go into the `closeModal` function defined in a later task) to destroy the Flatpickr instance when the modal is closed (using `datePickerInstance.destroy()`). This prevents memory leaks and ensures the calendar is removed correctly. For this task, you might temporarily add a basic close mechanism (like making the Cancel button remove the overlay) just to test the destroy logic.

**Acceptance Criteria:**

*   When the "Record Payment" modal opens, the "Date of Payment" input field is enhanced with Flatpickr.
*   Clicking or focusing the date input opens a calendar widget.
*   The calendar correctly restricts selectable dates based on the prejudgment start date and the current date.
*   The calendar defaults to showing the current date.
*   Selecting a date in the calendar updates the input field's value and logs the selection to the console.
*   When the modal is closed (using a temporary mechanism for now), the Flatpickr instance is destroyed without errors.
