/**
 * Simple test script to verify the datepicker functionality.
 * This script can be run in the browser console to test the datepicker implementation.
 */

// Test function to verify datepicker initialization
function testDatepickerInitialization() {
    console.log('Testing datepicker initialization...');
    
    // Import the datepickers module
    import('./dom/datepickers.js').then(module => {
        // Initialize the datepickers with a test callback
        const pickers = module.initializeDatePickers(() => {
            console.log('Recalculate callback called');
        });
        
        // Verify the pickers were created
        console.log('Judgment Date Picker:', pickers.judgmentDatePicker ? 'Created' : 'Failed');
        console.log('Prejudgment Date Picker:', pickers.prejudgmentDatePicker ? 'Created' : 'Failed');
        console.log('Postjudgment Date Picker:', pickers.postjudgmentDatePicker ? 'Created' : 'Failed');
        
        // Check if the elements exist in the DOM
        console.log('Judgment Date Input Element:', document.querySelector('[data-input="judgmentDate"]') ? 'Found' : 'Not Found');
        console.log('Prejudgment Date Input Element:', document.querySelector('[data-input="dateValue"]') ? 'Found' : 'Not Found (expected if summary table not yet populated)');
        
        console.log('Datepicker initialization test complete');
    }).catch(error => {
        console.error('Error testing datepicker initialization:', error);
    });
}

// Test function to verify date constraints
function testDateConstraints() {
    console.log('Testing date constraints...');
    
    // Import the datepickers module
    import('./dom/datepickers.js').then(module => {
        // Initialize the datepickers with a test callback
        const pickers = module.initializeDatePickers(() => {
            console.log('Recalculate callback called');
        });
        
        // Check if all pickers exist before proceeding
        if (!pickers.judgmentDatePicker) {
            console.error('Judgment Date Picker not found. Make sure the element exists in the DOM.');
            return;
        }
        
        if (!pickers.prejudgmentDatePicker) {
            console.error('Prejudgment Date Picker not found. Make sure the element exists in the DOM and the summary table is populated.');
            return;
        }
        
        if (!pickers.postjudgmentDatePicker) {
            console.error('Postjudgment Date Picker not found. Make sure the element exists in the DOM and the summary table is populated.');
            return;
        }
        
        // Test setting judgment date
        console.log('Setting judgment date to 2023-06-15...');
        pickers.judgmentDatePicker.setDate('2023-06-15');
        
        // Test setting prejudgment date before judgment date (should work)
        console.log('Setting prejudgment date to 2023-01-01 (before judgment date)...');
        pickers.prejudgmentDatePicker.setDate('2023-01-01');
        
        // Test setting prejudgment date after judgment date (should clear judgment date)
        console.log('Setting prejudgment date to 2023-12-31 (after judgment date)...');
        pickers.prejudgmentDatePicker.setDate('2023-12-31');
        
        // Check if judgment date was cleared
        console.log('Judgment date after setting prejudgment date after it:', 
            pickers.judgmentDatePicker.selectedDates.length > 0 ? 
            pickers.judgmentDatePicker.selectedDates[0].toISOString() : 'Cleared (expected)');
        
        // Reset judgment date
        console.log('Resetting judgment date to 2023-06-15...');
        pickers.judgmentDatePicker.setDate('2023-06-15');
        
        // Test setting postjudgment date after judgment date (should work)
        console.log('Setting postjudgment date to 2023-12-31 (after judgment date)...');
        pickers.postjudgmentDatePicker.setDate('2023-12-31');
        
        // Test setting postjudgment date before judgment date (should clear judgment date)
        console.log('Setting postjudgment date to 2023-01-01 (before judgment date)...');
        pickers.postjudgmentDatePicker.setDate('2023-01-01');
        
        // Check if judgment date was cleared
        console.log('Judgment date after setting postjudgment date before it:', 
            pickers.judgmentDatePicker.selectedDates.length > 0 ? 
            pickers.judgmentDatePicker.selectedDates[0].toISOString() : 'Cleared (expected)');
        
        console.log('Date constraints test complete');
    }).catch(error => {
        console.error('Error testing date constraints:', error);
    });
}

/**
 * Test function to verify that all three datepickers are working.
 * This function should be run after the summary table is populated.
 */
function testAllDatepickers() {
    console.log('Testing all datepickers...');
    
    // First, check if the elements exist in the DOM
    const judgmentDateInput = document.querySelector('[data-input="judgmentDate"]');
    const prejudgmentDateInputs = document.querySelectorAll('[data-input="dateValue"]');
    
    console.log('Judgment Date Input Element:', judgmentDateInput ? 'Found' : 'Not Found');
    console.log('Date Value Input Elements (should include prejudgment and postjudgment):', prejudgmentDateInputs.length);
    
    // Now check if the elements have Flatpickr instances attached
    if (judgmentDateInput && judgmentDateInput._flatpickr) {
        console.log('Judgment Date Flatpickr instance:', 'Found');
    } else {
        console.log('Judgment Date Flatpickr instance:', 'Not Found');
    }
    
    let prejudgmentFound = false;
    let postjudgmentFound = false;
    
    prejudgmentDateInputs.forEach(input => {
        const row = input.closest('tr');
        if (row) {
            const itemText = row.querySelector('[data-display="itemText"]')?.textContent;
            if (itemText === 'Prejudgment Interest' && input._flatpickr) {
                prejudgmentFound = true;
                console.log('Prejudgment Date Flatpickr instance:', 'Found');
            } else if (itemText === 'Postjudgment Interest' && input._flatpickr) {
                postjudgmentFound = true;
                console.log('Postjudgment Date Flatpickr instance:', 'Found');
            }
        }
    });
    
    if (!prejudgmentFound) {
        console.log('Prejudgment Date Flatpickr instance:', 'Not Found');
    }
    
    if (!postjudgmentFound) {
        console.log('Postjudgment Date Flatpickr instance:', 'Not Found');
    }
    
    console.log('All datepickers test complete');
}

/**
 * Test function to verify the date constraints on the Judgment Date and Postjudgment Date pickers.
 * This tests that:
 * - Judgment Date cannot be set before 1993-01-01 or after 2025-06-30
 * - Postjudgment Date cannot be set before Judgment Date or after 2025-06-30
 */
function testJudgmentDateConstraints() {
    console.log('Testing Judgment and Postjudgment Date constraints...');
    
    // Import the datepickers module
    import('./dom/datepickers.js').then(module => {
        // Initialize the datepickers with a test callback
        const pickers = module.initializeDatePickers(() => {
            console.log('Recalculate callback called');
        });
        
        // Check if judgment date picker exists
        if (!pickers.judgmentDatePicker) {
            console.error('Judgment Date Picker not found. Make sure the element exists in the DOM.');
            return;
        }
        
        // Test setting judgment date to before 1993-01-01 (should not work)
        console.log('Attempting to set judgment date to 1992-12-31 (before min date)...');
        pickers.judgmentDatePicker.setDate('1992-12-31');
        
        // Check if date was set or rejected
        console.log('Judgment date after attempting to set before min date:', 
            pickers.judgmentDatePicker.selectedDates.length > 0 ? 
            pickers.judgmentDatePicker.selectedDates[0].toISOString() : 'Rejected (expected)');
        
        // Test setting judgment date to after 2025-06-30 (should not work)
        console.log('Attempting to set judgment date to 2025-07-01 (after max date)...');
        pickers.judgmentDatePicker.setDate('2025-07-01');
        
        // Check if date was set or rejected
        console.log('Judgment date after attempting to set after max date:', 
            pickers.judgmentDatePicker.selectedDates.length > 0 ? 
            pickers.judgmentDatePicker.selectedDates[0].toISOString() : 'Rejected (expected)');
        
        // Test setting judgment date to a valid date
        console.log('Setting judgment date to 2023-06-15 (valid date)...');
        pickers.judgmentDatePicker.setDate('2023-06-15');
        
        // Check if date was set
        console.log('Judgment date after setting to valid date:', 
            pickers.judgmentDatePicker.selectedDates.length > 0 ? 
            pickers.judgmentDatePicker.selectedDates[0].toISOString() : 'Failed to set (unexpected)');
        
        // Check if postjudgment date picker exists
        if (!pickers.postjudgmentDatePicker) {
            console.log('Postjudgment Date Picker not found. Skipping postjudgment date tests.');
            console.log('Judgment Date constraints test complete');
            return;
        }
        
        // Test setting postjudgment date to before judgment date (should not work)
        console.log('Attempting to set postjudgment date to 2023-06-14 (before judgment date)...');
        pickers.postjudgmentDatePicker.setDate('2023-06-14');
        
        // Check if date was set or rejected
        console.log('Postjudgment date after attempting to set before judgment date:', 
            pickers.postjudgmentDatePicker.selectedDates.length > 0 ? 
            pickers.postjudgmentDatePicker.selectedDates[0].toISOString() : 'Rejected (expected)');
        
        // Test setting postjudgment date to after 2025-06-30 (should not work)
        console.log('Attempting to set postjudgment date to 2025-07-01 (after max date)...');
        pickers.postjudgmentDatePicker.setDate('2025-07-01');
        
        // Check if date was set or rejected
        console.log('Postjudgment date after attempting to set after max date:', 
            pickers.postjudgmentDatePicker.selectedDates.length > 0 ? 
            pickers.postjudgmentDatePicker.selectedDates[0].toISOString() : 'Rejected (expected)');
        
        // Test setting postjudgment date to a valid date
        console.log('Setting postjudgment date to 2023-12-31 (valid date)...');
        pickers.postjudgmentDatePicker.setDate('2023-12-31');
        
        // Check if date was set
        console.log('Postjudgment date after setting to valid date:', 
            pickers.postjudgmentDatePicker.selectedDates.length > 0 ? 
            pickers.postjudgmentDatePicker.selectedDates[0].toISOString() : 'Failed to set (unexpected)');
        
        console.log('Judgment and Postjudgment Date constraints test complete');
    }).catch(error => {
        console.error('Error testing date constraints:', error);
    });
}

// Export the test functions
export { testDatepickerInitialization, testDateConstraints, testAllDatepickers, testJudgmentDateConstraints };

// Log a message to indicate the test script is loaded
console.log('Datepicker test script loaded. Run testDatepickerInitialization(), testDateConstraints(), testAllDatepickers(), or testJudgmentDateConstraints() to test.');
