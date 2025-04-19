# Task: Implement Preventive Date Validation

**Goal:** Improve user experience by implementing preventive date validation that makes it impossible for users to enter invalid dates, eliminating the need for disruptive error messages.

**Context:**
The application currently uses `alert()` to notify users of input validation errors, including date-related errors. This interrupts the user flow and creates a poor user experience. Instead of showing error messages after invalid data is entered, we can prevent invalid data entry in the first place.

**Target Files:**
* `BC COIA calculator/index.html`
* `BC COIA calculator/dom/setup.js`
* `BC COIA calculator/calculator.core.js`

**Requirements:**

1. **Enhance Date Picker Configuration in `dom/setup.js`:**
   * Modify the Flatpickr initialization to implement dynamic date constraints:
     * Judgment Date becomes the central reference point
     * Prejudgment Interest Date must be before Judgment Date
     * Postjudgment Interest Date must be after Judgment Date
   * Create a function to track and update date picker instances
   * Implement a function to update date constraints when Judgment Date changes
   * Add validation for manual date entry that enforces these constraints

2. **Add Visual Cues to Date Fields in `index.html`:**
   * Add helper text or tooltips to date fields indicating their relationships:
     * For Prejudgment Date: "Must be before Judgment Date"
     * For Postjudgment Date: "Must be after Judgment Date"
   * Ensure the UI clearly communicates date constraints to users

3. **Update Error Handling in `calculator.core.js`:**
   * Remove alert() calls for date validation errors
   * Implement graceful handling for cases where dates might become invalid due to changes in the Judgment Date
   * Add subtle notifications when a date field is automatically cleared due to constraint violations

**Implementation Details:**

```javascript
// Track the date picker instances
let judgmentDatePicker = null;
let prejudgmentDatePicker = null;
let postjudgmentDatePicker = null;

// Initialize date pickers with constraints
function initializeDatePickers() {
    // Initialize Judgment Date picker first (no constraints initially)
    judgmentDatePicker = flatpickr(elements.judgmentDateInput, {
        dateFormat: "Y-m-d",
        allowInput: true,
        // Other common options...
        onChange: function(selectedDates, dateStr) {
            // When judgment date changes, update constraints for other pickers
            updateDateConstraints(dateStr);
            // Trigger recalculation
            recalculate();
        }
    });
    
    // Initialize Prejudgment Date picker with max date = judgment date
    prejudgmentDatePicker = flatpickr(elements.prejudgmentInterestDateInput, {
        dateFormat: "Y-m-d",
        allowInput: true,
        // Initially constrain to dates before judgment date (if available)
        maxDate: elements.judgmentDateInput.value || null,
        // Other common options...
        onChange: function() {
            recalculate();
        }
    });
    
    // Initialize Postjudgment Date picker with min date = judgment date
    postjudgmentDatePicker = flatpickr(elements.postjudgmentInterestDateInput, {
        dateFormat: "Y-m-d",
        allowInput: true,
        // Initially constrain to dates after judgment date (if available)
        minDate: elements.judgmentDateInput.value || null,
        // Other common options...
        onChange: function() {
            recalculate();
        }
    });
}

// Update date constraints when judgment date changes
function updateDateConstraints(judgmentDateStr) {
    if (judgmentDateStr) {
        // Update Prejudgment Date picker to only allow dates before judgment date
        if (prejudgmentDatePicker) {
            prejudgmentDatePicker.set('maxDate', judgmentDateStr);
            
            // If current prejudgment date is now invalid, reset it
            const currentPrejudgmentDate = elements.prejudgmentInterestDateInput.value;
            if (currentPrejudgmentDate && dateBefore(parseDateInput(judgmentDateStr), parseDateInput(currentPrejudgmentDate))) {
                prejudgmentDatePicker.clear();
                // Optional: Show a subtle notification that the date was cleared
            }
        }
        
        // Update Postjudgment Date picker to only allow dates after judgment date
        if (postjudgmentDatePicker) {
            postjudgmentDatePicker.set('minDate', judgmentDateStr);
            
            // If current postjudgment date is now invalid, reset it
            const currentPostjudgmentDate = elements.postjudgmentInterestDateInput.value;
            if (currentPostjudgmentDate && dateBefore(parseDateInput(currentPostjudgmentDate), parseDateInput(judgmentDateStr))) {
                postjudgmentDatePicker.clear();
                // Optional: Show a subtle notification that the date was cleared
            }
        }
    }
}

// Add validation for manual input
function setupManualInputValidation() {
    // For Judgment Date
    elements.judgmentDateInput.addEventListener('blur', function() {
        const judgmentDate = this.value;
        if (validateDateFormat(judgmentDate)) {
            // Valid format, update constraints
            updateDateConstraints(judgmentDate);
        } else if (judgmentDate) {
            // Invalid format, clear and focus
            this.value = '';
            this.focus();
        }
    });
    
    // Similar handlers for other date fields...
}
```

**Desired User Experience:**

From the user's perspective, the calculator should feel intuitive and "smart":

1. **Initial Page Load:**
   * All date fields are empty or have default values
   * Subtle visual cues indicate the relationships between dates

2. **Setting Dates in Logical Order:**
   * When the user sets the Judgment Date, the date pickers for Prejudgment and Postjudgment dates automatically update their constraints
   * In the Prejudgment Date picker, dates on or after the Judgment Date are visibly disabled
   * In the Postjudgment Date picker, dates before the Judgment Date are visibly disabled
   * The user cannot select invalid dates, eliminating the possibility of errors

3. **Changing the Judgment Date:**
   * If the user changes the Judgment Date to a date that makes existing dates invalid:
     * The invalid date fields are automatically cleared
     * A subtle notification might appear briefly explaining why
   * Date pickers are updated with new constraints

4. **Manual Date Entry:**
   * If the user types a date manually, it's validated when they tab out or click away
   * Invalid dates are cleared, and focus returns to the field for correction
   * A small tooltip might appear briefly explaining the constraint

5. **Visual and Interactive Elements:**
   * Invalid dates are visibly disabled in the calendar
   * Field labels or helper text indicate the relationships between dates
   * Tooltips appear on hover to explain constraints
   * All feedback is inline and non-blocking
   * Validation happens in real-time

This approach creates a frictionless experience where:
* Users can't make date-related errors
* They don't have to remember the rules
* They're never interrupted by error messages
* The interface provides just-in-time guidance

**Acceptance Criteria:**
* Date pickers are configured with dynamic constraints based on the Judgment Date
* Users cannot select or enter dates that violate the constraints
* The UI clearly communicates the date relationships
* No alert() messages appear for date validation errors
* When a date becomes invalid due to changes in the Judgment Date, it's handled gracefully
* The calculator's core functionality remains unchanged

**Notes:**
* This approach focuses on preventing errors rather than reporting them
* For other types of errors that cannot be prevented (e.g., missing interest rates), consider implementing a non-blocking error display area as described in the original task
* The implementation leverages the existing Flatpickr date picker library
