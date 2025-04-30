# Task 33: Implement Lifecycle-Aware Datepickers

## Current Issue

When toggling the "Show prejudgment interest" checkbox, several console errors appear:

```
flatpickr:2  Uncaught TypeError: Cannot set properties of undefined (setting 'maxDate')
    at w.set (flatpickr:2:33474)
    at updatePrejudgmentPostjudgmentConstraints (datepickers.js:271:35)
    at initializeDatePickers (datepickers.js:91:5)
    at updateSummaryTable (tables.summary.js:331:5)
    at recalculate (calculator.core.js:438:5)
    at togglePrejudgmentVisibility (visibility.js:116:9)
    at HTMLInputElement.<anonymous> (calculator.ui.js:95:9)
```

Additionally, validation errors appear in the console:

```
calculator.core.js:79  Recalculation skipped due to invalid inputs: One or more required dates are missing or invalid.
calculator.core.js:70  Validation error: One or more required dates are missing or invalid.
```

## Root Cause Analysis

The errors occur because:

1. When the prejudgment interest checkbox is unchecked, `togglePrejudgmentVisibility()` hides the date input elements from the DOM
2. Later, `updateSummaryTable()` calls `initializeDatePickers()` which reinitializes all datepickers
3. Then `updatePrejudgmentPostjudgmentConstraints()` tries to set constraints on potentially non-existent datepickers without properly checking if they exist
4. The validation logic in `calculator.core.js` isn't fully aware of the visibility state of UI elements

The current implementation has a mix of approaches:
- Reinitializes datepickers on every recalculation
- Has some basic element existence checks
- Lacks proper visibility awareness when updating datepicker constraints

## Proposed Solution: Lifecycle-Aware Implementation

Instead of simply adding null checks (as proposed in Task 32.4), we'll implement a more robust lifecycle-aware approach that:

1. Only initializes datepickers for elements that are both present in the DOM and visible
2. Properly handles visibility changes by creating/destroying datepicker instances as needed
3. Updates constraints only for active datepickers
4. Ensures validation logic respects the visibility state of UI elements

## Implementation Details

### 1. Update `initializeDatePickers` in `datepickers.js`

```javascript
/**
 * Initializes the date pickers with appropriate configurations and constraints.
 * @param {Function} recalculateCallback - Function to call when dates change to trigger recalculation.
 * @returns {Object} Object containing the date picker instances.
 */
export function initializeDatePickers(recalculateCallback) {
    // Destroy existing instances if they exist
    if (judgmentDatePicker) judgmentDatePicker.destroy();
    if (prejudgmentDatePicker) prejudgmentDatePicker.destroy();
    if (postjudgmentDatePicker) postjudgmentDatePicker.destroy();
    
    // Reset references
    judgmentDatePicker = null;
    prejudgmentDatePicker = null;
    postjudgmentDatePicker = null;
    
    // Get visibility state from store
    const showPrejudgment = useStore.getState().inputs.showPrejudgment;
    const showPostjudgment = useStore.getState().inputs.showPostjudgment;
    
    // Reset background colors to default
    if (elements.judgmentDateInput) {
        elements.judgmentDateInput.style.backgroundColor = NORMAL_BACKGROUND_COLOR;
    }
    
    // Only reset prejudgment input if it exists AND is visible
    if (elements.prejudgmentInterestDateInput && showPrejudgment) {
        elements.prejudgmentInterestDateInput.style.backgroundColor = NORMAL_BACKGROUND_COLOR;
    }
    
    // Only reset postjudgment input if it exists AND is visible
    if (elements.postjudgmentInterestDateInput && showPostjudgment) {
        elements.postjudgmentInterestDateInput.style.backgroundColor = NORMAL_BACKGROUND_COLOR;
    }
    
    // Initialize Judgment Date picker with fixed constraints
    if (elements.judgmentDateInput) {
        judgmentDatePicker = flatpickr(elements.judgmentDateInput, {
            dateFormat: "Y-m-d",
            allowInput: true,
            clickOpens: true,
            disableMobile: true,
            monthSelectorType: "dropdown",
            enableTime: false,
            minDate: "1993-01-01",
            maxDate: "2025-06-30", // Fixed maximum date as requested
            onChange: (selectedDates) => onJudgmentDateChange(selectedDates, recalculateCallback),
            onOpen: positionCalendar
        });
    }
    
    // Initialize Prejudgment Date picker ONLY if the element exists AND section is visible
    if (elements.prejudgmentInterestDateInput && showPrejudgment) {
        prejudgmentDatePicker = flatpickr(elements.prejudgmentInterestDateInput, {
            dateFormat: "Y-m-d",
            allowInput: true,
            clickOpens: true,
            disableMobile: true,
            monthSelectorType: "dropdown",
            enableTime: false,
            minDate: "1993-01-01",
            maxDate: "2030-12-31",
            onChange: (selectedDates) => onPrejudgmentDateChange(selectedDates, recalculateCallback),
            onOpen: positionCalendar
        });
    }
    
    // Initialize Postjudgment Date picker ONLY if the element exists AND section is visible
    if (elements.postjudgmentInterestDateInput && showPostjudgment) {
        postjudgmentDatePicker = flatpickr(elements.postjudgmentInterestDateInput, {
            dateFormat: "Y-m-d",
            allowInput: true,
            clickOpens: true,
            disableMobile: true,
            monthSelectorType: "dropdown",
            enableTime: false,
            minDate: "1993-01-01",
            maxDate: "2025-06-30", // Fixed maximum date as requested
            onChange: (selectedDates) => onPostjudgmentDateChange(selectedDates, recalculateCallback),
            onOpen: positionCalendar
        });
    }
    
    // Set initial constraints based on any existing values
    updatePrejudgmentPostjudgmentConstraints();
    
    return {
        judgmentDatePicker,
        prejudgmentDatePicker,
        postjudgmentDatePicker
    };
}
```

### 2. Update `updatePrejudgmentPostjudgmentConstraints` in `datepickers.js`

```javascript
/**
 * Updates the min/max date constraints on prejudgment and postjudgment date pickers based on judgment date.
 * Also updates the background colors of date inputs based on validation status.
 */
function updatePrejudgmentPostjudgmentConstraints() {
    // Get visibility state from store
    const showPrejudgment = useStore.getState().inputs.showPrejudgment;
    const showPostjudgment = useStore.getState().inputs.showPostjudgment;
    
    // Get current judgment date
    const judgmentDate = judgmentDatePicker && judgmentDatePicker.selectedDates.length > 0 ? 
        judgmentDatePicker.selectedDates[0] : null;
    
    // Update Judgment Date background color based on validation status
    if (elements.judgmentDateInput) {
        // Judgment Date is invalid if it's blank
        if (!judgmentDate) {
            elements.judgmentDateInput.style.backgroundColor = ERROR_BACKGROUND_COLOR;
        } else {
            elements.judgmentDateInput.style.backgroundColor = NORMAL_BACKGROUND_COLOR;
        }
    }
    
    // Only update prejudgment constraints if the section is visible AND the picker exists
    if (showPrejudgment && prejudgmentDatePicker) {
        // Get current prejudgment date
        const prejudgmentDate = prejudgmentDatePicker.selectedDates.length > 0 ? 
            prejudgmentDatePicker.selectedDates[0] : null;
            
        // Set maxDate to judgment date if it exists
        if (judgmentDate) {
            prejudgmentDatePicker.set('maxDate', judgmentDate);
        } else {
            prejudgmentDatePicker.set('maxDate', "2030-12-31");
        }
        
        // Update background color based on validation status
        if (elements.prejudgmentInterestDateInput) {
            // Case 1: Prejudgment date is blank
            // Case 2: Prejudgment date is later than judgment date
            if (!prejudgmentDate || (prejudgmentDate && judgmentDate && prejudgmentDate > judgmentDate)) {
                elements.prejudgmentInterestDateInput.style.backgroundColor = ERROR_BACKGROUND_COLOR;
            } else {
                elements.prejudgmentInterestDateInput.style.backgroundColor = NORMAL_BACKGROUND_COLOR;
            }
        }
    }
    
    // Only update postjudgment constraints if the section is visible AND the picker exists
    if (showPostjudgment && postjudgmentDatePicker) {
        // Get current postjudgment date
        const postjudgmentDate = postjudgmentDatePicker.selectedDates.length > 0 ? 
            postjudgmentDatePicker.selectedDates[0] : null;
            
        // Set minDate to judgment date if it exists
        if (judgmentDate) {
            postjudgmentDatePicker.set('minDate', judgmentDate);
        } else {
            postjudgmentDatePicker.set('minDate', "1993-01-01");
        }
        
        // Always set maxDate to June 30, 2025
        postjudgmentDatePicker.set('maxDate', "2025-06-30");
        
        // Update background color based on validation status
        if (elements.postjudgmentInterestDateInput) {
            // Case 1: Postjudgment date is blank
            // Case 2: Postjudgment date is earlier than judgment date
            if (!postjudgmentDate || (postjudgmentDate && judgmentDate && postjudgmentDate < judgmentDate)) {
                elements.postjudgmentInterestDateInput.style.backgroundColor = ERROR_BACKGROUND_COLOR;
            } else {
                elements.postjudgmentInterestDateInput.style.backgroundColor = NORMAL_BACKGROUND_COLOR;
            }
        }
    }
}
```

### 3. Update validation logic in `calculator.core.js`

```javascript
// Check all required dates exist, but only check prejudgmentStartDate if showPrejudgment is true
// and only check postjudgmentEndDate if showPostjudgment is true
if (!inputs.dateOfJudgment || 
    !inputs.nonPecuniaryJudgmentDate || !inputs.costsAwardedDate || 
    (inputs.showPrejudgment && !inputs.prejudgmentStartDate) ||
    (inputs.showPostjudgment && !inputs.postjudgmentEndDate)) {
    validationMessage = "One or more required dates are missing or invalid.";
    isValid = false;
}
```

## Expected Outcome

After implementing these changes:

1. No console errors will appear when toggling the prejudgment interest checkbox
2. Datepickers will only be initialized for visible elements
3. Constraints will only be updated for active datepickers
4. Validation logic will properly respect the visibility state of UI elements
5. The application will be more robust when handling dynamic UI changes

This lifecycle-aware approach addresses the root cause of the issues rather than just adding defensive null checks. It ensures that datepickers are properly created, updated, and destroyed based on the current UI state, preventing errors and improving overall code quality.
