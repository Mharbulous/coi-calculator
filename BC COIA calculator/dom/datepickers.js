/**
 * Datepicker initialization and handling logic.
 * This module encapsulates the simplified datepicker implementation
 * for the Judgment Date, Prejudgment Start Date, and Postjudgment End Date fields.
 */

import elements from './elements.js';
import useStore from '../store.js';

// Define the error background color to match the error message background
const ERROR_BACKGROUND_COLOR = '#f8d7da';
// Define the normal background color for date inputs
const NORMAL_BACKGROUND_COLOR = '#e0f2f7';

// Store references to the Flatpickr instances
let judgmentDatePicker = null;
let prejudgmentDatePicker = null;
let postjudgmentDatePicker = null;

/**
 * Initializes the date pickers with appropriate configurations and constraints.
 * This function is lifecycle-aware and only initializes datepickers for elements
 * that are both present in the DOM and visible based on the application state.
 * 
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
    
    // Datepickers are now initialized with visibility awareness
    
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

/**
 * Handler for when the Judgment Date changes.
 * @param {Array} selectedDates - Array of selected dates from Flatpickr.
 * @param {Function} recalculateCallback - Function to call to trigger recalculation.
 */
function onJudgmentDateChange(selectedDates, recalculateCallback) {
    const newDate = selectedDates.length > 0 ? selectedDates[0] : null;
    
    // Update the Zustand store with the new judgment date
    useStore.getState().setInput('dateOfJudgment', newDate);
    
    // Get visibility state from store
    const showPrejudgment = useStore.getState().inputs.showPrejudgment;
    const showPostjudgment = useStore.getState().inputs.showPostjudgment;
    
    // Get current values from other pickers
    const prejudgmentDate = prejudgmentDatePicker && prejudgmentDatePicker.selectedDates?.length > 0 ? 
        prejudgmentDatePicker.selectedDates[0] : null;
    const postjudgmentDate = postjudgmentDatePicker && postjudgmentDatePicker.selectedDates?.length > 0 ? 
        postjudgmentDatePicker.selectedDates[0] : null;
    
    // Check constraints and clear dependent fields if needed
    if (newDate && prejudgmentDate && prejudgmentDate > newDate && showPrejudgment && prejudgmentDatePicker) {
        // Prejudgment date violates constraint, clear it
        prejudgmentDatePicker.clear();
        useStore.getState().setInput('prejudgmentStartDate', null);
        
        // Update background color to indicate error
        if (elements.prejudgmentInterestDateInput) {
            elements.prejudgmentInterestDateInput.style.backgroundColor = ERROR_BACKGROUND_COLOR;
        }
    }
    
    if (newDate && postjudgmentDate && postjudgmentDate < newDate && showPostjudgment && postjudgmentDatePicker) {
        // Postjudgment date violates constraint, clear it
        postjudgmentDatePicker.clear();
        useStore.getState().setInput('postjudgmentEndDate', null);
        
        // Update background color to indicate error
        if (elements.postjudgmentInterestDateInput) {
            elements.postjudgmentInterestDateInput.style.backgroundColor = ERROR_BACKGROUND_COLOR;
        }
    }
    
    // Update constraints on prejudgment and postjudgment pickers only
    updatePrejudgmentPostjudgmentConstraints();
    
    // Trigger recalculation
    if (typeof recalculateCallback === 'function') {
        recalculateCallback();
    }
}

/**
 * Handler for when the Prejudgment Start Date changes.
 * @param {Array} selectedDates - Array of selected dates from Flatpickr.
 * @param {Function} recalculateCallback - Function to call to trigger recalculation.
 */
function onPrejudgmentDateChange(selectedDates, recalculateCallback) {
    const newDate = selectedDates.length > 0 ? selectedDates[0] : null;
    
    // Get current judgment date
    const judgmentDate = judgmentDatePicker && judgmentDatePicker.selectedDates?.length > 0 ? 
        judgmentDatePicker.selectedDates[0] : null;
    
    // Check constraints - if the new date is after judgment date, reject it
    if (newDate && judgmentDate && newDate > judgmentDate) {
        // New prejudgment date is after judgment date, reject it by clearing the picker
        // and not updating the store
        prejudgmentDatePicker.clear();
        
        // Update background color to indicate error
        if (elements.prejudgmentInterestDateInput) {
            elements.prejudgmentInterestDateInput.style.backgroundColor = ERROR_BACKGROUND_COLOR;
        }
        
        return; // Exit early without updating store or recalculating
    }
    
    // If we get here, the date is valid, so update the store
    useStore.getState().setInput('prejudgmentStartDate', newDate);
    
    // Update constraints on prejudgment and postjudgment pickers
    updatePrejudgmentPostjudgmentConstraints();
    
    // Trigger recalculation
    if (typeof recalculateCallback === 'function') {
        recalculateCallback();
    }
}

/**
 * Handler for when the Postjudgment End Date changes.
 * @param {Array} selectedDates - Array of selected dates from Flatpickr.
 * @param {Function} recalculateCallback - Function to call to trigger recalculation.
 */
function onPostjudgmentDateChange(selectedDates, recalculateCallback) {
    const newDate = selectedDates.length > 0 ? selectedDates[0] : null;
    
    // Get current judgment date
    const judgmentDate = judgmentDatePicker && judgmentDatePicker.selectedDates?.length > 0 ? 
        judgmentDatePicker.selectedDates[0] : null;
    
    // Check constraints - if the new date is before judgment date, reject it
    if (newDate && judgmentDate && newDate < judgmentDate) {
        // New postjudgment date is before judgment date, reject it by clearing the picker
        // and not updating the store
        postjudgmentDatePicker.clear();
        
        // Update background color to indicate error
        if (elements.postjudgmentInterestDateInput) {
            elements.postjudgmentInterestDateInput.style.backgroundColor = ERROR_BACKGROUND_COLOR;
        }
        
        return; // Exit early without updating store or recalculating
    }
    
    // Check if the date is after June 30, 2025
    const maxDate = new Date(2025, 5, 30); // June is 5 (0-indexed)
    if (newDate && newDate > maxDate) {
        // New postjudgment date is after max date, reject it
        postjudgmentDatePicker.clear();
        
        // Update background color to indicate error
        if (elements.postjudgmentInterestDateInput) {
            elements.postjudgmentInterestDateInput.style.backgroundColor = ERROR_BACKGROUND_COLOR;
        }
        
        return; // Exit early without updating store or recalculating
    }
    
    // If we get here, the date is valid, so update the store
    useStore.getState().setInput('postjudgmentEndDate', newDate);
    
    // Update constraints on prejudgment and postjudgment pickers
    updatePrejudgmentPostjudgmentConstraints();
    
    // Trigger recalculation
    if (typeof recalculateCallback === 'function') {
        recalculateCallback();
    }
}

/**
 * Updates the min/max date constraints on prejudgment and postjudgment date pickers based on judgment date.
 * Also updates the background colors of date inputs based on validation status.
 * This function is lifecycle-aware and only updates constraints for datepickers that exist and are visible.
 */
function updatePrejudgmentPostjudgmentConstraints() {
    // Get visibility state from store
    const showPrejudgment = useStore.getState().inputs.showPrejudgment;
    const showPostjudgment = useStore.getState().inputs.showPostjudgment;
    
    // Get current judgment date
    const judgmentDate = judgmentDatePicker && judgmentDatePicker.selectedDates?.length > 0 ? 
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
        try {
            // Get current prejudgment date
            const prejudgmentDate = prejudgmentDatePicker.selectedDates?.length > 0 ? 
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
        } catch (error) {
            console.error("Error updating prejudgment date constraints:", error);
        }
    }
    
    // Only update postjudgment constraints if the section is visible AND the picker exists
    if (showPostjudgment && postjudgmentDatePicker) {
        try {
            // Get current postjudgment date
            const postjudgmentDate = postjudgmentDatePicker.selectedDates?.length > 0 ? 
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
        } catch (error) {
            console.error("Error updating postjudgment date constraints:", error);
        }
    } else if (elements.postjudgmentInterestDateInput) {
        // If section is hidden, always use normal background color for the input
        elements.postjudgmentInterestDateInput.style.backgroundColor = NORMAL_BACKGROUND_COLOR;
    }
}

/**
 * Position the flatpickr calendar
 * @param {Array} selectedDates - Selected dates
 * @param {string} dateStr - Date string
 * @param {Object} instance - Flatpickr instance
 */
function positionCalendar(selectedDates, dateStr, instance) {
    // Use requestAnimationFrame to ensure the calendar is fully rendered
    requestAnimationFrame(() => {
        const inputRect = instance.input.getBoundingClientRect();
        const calendar = instance.calendarContainer;
        const calendarRect = calendar.getBoundingClientRect();
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        // Calculate desired left position: input's right edge - calendar's width
        let newLeft = scrollX + inputRect.right - calendarRect.width;

        // Calculate desired top position: below the input
        let newTop = scrollY + inputRect.bottom + 2; // +2 for a small gap

        // Adjust if calendar goes off-screen vertically
        if (newTop + calendarRect.height > window.innerHeight + scrollY) {
            newTop = scrollY + inputRect.top - calendarRect.height - 2; // Position above
        }

        // Adjust if calendar goes off-screen horizontally (left side)
        if (newLeft < scrollX) {
            newLeft = scrollX + inputRect.left; // Fallback to left alignment
        }

        // Apply the calculated position
        calendar.style.position = 'absolute'; // Ensure positioning context
        calendar.style.left = `${newLeft}px`;
        calendar.style.top = `${newTop}px`;
    });
}
