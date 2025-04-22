# Task 24: Simplified Datepicker Implementation Plan

This document outlines the plan to refactor the datepicker functionality using a simplified approach leveraging Flatpickr's capabilities and reducing custom code complexity.

## Background

The current datepicker implementation involves multiple event listeners (`onChange`, `onClose`, `blur`, `input`, `keyup`), dual validation systems (Flatpickr + custom), complex constraint management, and custom notification/formatting logic. This complexity makes it harder to maintain and prone to errors.

## Goal

Refactor the datepicker logic for the Judgment Date, Prejudgment Start Date, and Postjudgment End Date fields to use a simpler, more robust implementation based on the following principles:

1.  **Leverage Flatpickr**: Utilize Flatpickr's built-in features (`allowInput`, `onChange`, `minDate`, `maxDate`) as much as possible.
2.  **Centralize Logic**: Use the `onChange` handler as the primary point for state updates, constraint enforcement, and triggering recalculations.
3.  **Automatic Clearing**: When a date change violates constraints (e.g., Judgment Date becomes earlier than Prejudgment Start Date), automatically clear the dependent field's value instead of showing error notifications.
4.  **Remove Redundancy**: Eliminate custom `blur`, `input`, `keyup` listeners, custom formatting logic, and the custom notification system for these specific date fields.

## Implementation Steps

### 1. Create New Module (`datepickers.js`)

-   Create a new file: `BC COIA calculator/dom/datepickers.js`.
-   This module will encapsulate the new datepicker initialization and handling logic.

### 2. Implement Core Datepicker Logic in `datepickers.js`

-   **Initialization Function (`initializeDatePickers`)**:
    -   Accepts the `recalculateCallback` function as an argument.
    -   Initializes three Flatpickr instances (Judgment, Prejudgment, Postjudgment) using `elements` for the input fields.
    -   Configuration for each instance:
        -   `dateFormat: "Y-m-d"`
        -   `allowInput: true` (relies on Flatpickr's parsing)
        -   `onChange`: Link to the respective handler function (e.g., `onJudgmentDateChange`).
    -   Store references to the Flatpickr instances locally within the module.
    -   Call `updateDatePickerConstraints` initially to set constraints based on any existing values.
    -   Return the Flatpickr instances.
-   **`onChange` Handlers (`onJudgmentDateChange`, `onPrejudgmentDateChange`, `onPostjudgmentDateChange`)**:
    -   Accept `selectedDates` and `recalculateCallback` as arguments.
    -   Get the newly selected date.
    -   Get the current selected dates from the *other* related pickers.
    -   Update the corresponding date value in the Zustand store (`useStore.getState().setInput(...)`).
    -   **Constraint Logic**:
        -   Check if the new date violates constraints with the other dates.
        -   If a constraint is violated:
            -   Clear the *dependent* datepicker instance (`dependentPicker.clear()`).
            -   Update the corresponding state value in Zustand to `null`.
    -   Call `updateDatePickerConstraints()` to refresh min/max dates on related pickers.
    -   Call `recalculateCallback()` if it's a valid function.
-   **Constraint Update Function (`updateDatePickerConstraints`)**:
    -   Get the current selected dates from all three pickers.
    -   Use the `.set()` method on the Flatpickr instances to update `minDate` and `maxDate` options based on the current valid dates:
        -   Judgment Date picker: `minDate` = Prejudgment Date, `maxDate` = Postjudgment Date.
        -   Prejudgment Date picker: `maxDate` = Judgment Date.
        -   Postjudgment Date picker: `minDate` = Judgment Date.
    -   Handle cases where dates might be null (don't set constraints if the dependent date is missing).

### 3. Update DOM Setup Module (`setup.js`)

-   Import `initializeDatePickers` from the new `datepickers.js` module.
-   **Remove** the old `initializeDatePickers` function and its associated helper functions (`updateDateConstraints`, `showDateConstraintNotification`, `positionCalendar`).
-   **Modify/Remove `setupCustomDateInputListeners`**:
    -   Remove the logic that handles the three main datepicker fields (Judgment, Prejudgment, Postjudgment) as their setup is now handled entirely by `datepickers.js`.
    -   Keep the logic for other date inputs if necessary (e.g., special damages), including auto-formatting and basic blur validation *if* they don't use Flatpickr.
-   **Remove `setupAutoFormattingDateInputListeners`** if it's no longer used after modifying `setupCustomDateInputListeners`.
-   Ensure `setup.js` exports the *new* `initializeDatePickers` function from `datepickers.js`.

### 4. Update UI Initialization (`calculator.ui.js`)

-   Ensure it imports `initializeDatePickers` from `dom/setup.js` (which now re-exports the function from `datepickers.js`).
-   The call `module.initializeDatePickers(recalculate);` within `setupEventListeners` should now correctly use the new implementation.

### 5. Testing

-   Manually test the date interactions thoroughly:
    -   Selecting dates from the calendar.
    -   Typing dates manually (valid and invalid formats).
    -   Changing Judgment Date and observing constraints/clearing on Pre/Postjudgment dates.
    -   Changing Prejudgment Date and observing constraints/clearing on Judgment Date.
    -   Changing Postjudgment Date and observing constraints/clearing on Judgment Date.
    -   Initial page load state and default constraints.
    -   Clearing dates manually.

### 6. Cleanup

-   Remove any unused helper functions from `utils.date.js` if they were only used by the old datepicker logic.
-   Remove the `.date-constraint-notification` CSS styles from `index.html`.
-   Verify no console errors related to the old implementation remain.

## Expected Outcome

A cleaner, more maintainable datepicker system that relies heavily on Flatpickr's core features, with simplified event handling and constraint management, leading to improved robustness and developer experience.
