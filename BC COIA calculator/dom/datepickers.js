/**
 * Datepicker initialization and handling logic.
 * This module encapsulates the simplified datepicker implementation
 * for the Judgment Date, Prejudgment Start Date, and Postjudgment End Date fields.
 */

import elements from './elements.js';
import useStore from '../store.js';

// Store references to the Flatpickr instances
let judgmentDatePicker = null;
let prejudgmentDatePicker = null;
let postjudgmentDatePicker = null;

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
    
    // Initialize Judgment Date picker
    if (elements.judgmentDateInput) {
        judgmentDatePicker = flatpickr(elements.judgmentDateInput, {
            dateFormat: "Y-m-d",
            allowInput: true,
            clickOpens: true,
            disableMobile: true,
            monthSelectorType: "dropdown",
            enableTime: false,
            minDate: "1993-01-01",
            maxDate: "2030-12-31",
            onChange: (selectedDates) => onJudgmentDateChange(selectedDates, recalculateCallback),
            onOpen: positionCalendar
        });
    }
    
    // Initialize Prejudgment Date picker if the element exists
    if (elements.prejudgmentInterestDateInput) {
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
    
    // Initialize Postjudgment Date picker if the element exists
    if (elements.postjudgmentInterestDateInput) {
        postjudgmentDatePicker = flatpickr(elements.postjudgmentInterestDateInput, {
            dateFormat: "Y-m-d",
            allowInput: true,
            clickOpens: true,
            disableMobile: true,
            monthSelectorType: "dropdown",
            enableTime: false,
            minDate: "1993-01-01",
            maxDate: "2030-12-31",
            onChange: (selectedDates) => onPostjudgmentDateChange(selectedDates, recalculateCallback),
            onOpen: positionCalendar
        });
    }
    
    // Set initial constraints based on any existing values
    updateDatePickerConstraints();
    
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
    
    // Get current values from other pickers
    const prejudgmentDate = prejudgmentDatePicker && prejudgmentDatePicker.selectedDates.length > 0 ? 
        prejudgmentDatePicker.selectedDates[0] : null;
    const postjudgmentDate = postjudgmentDatePicker && postjudgmentDatePicker.selectedDates.length > 0 ? 
        postjudgmentDatePicker.selectedDates[0] : null;
    
    // Check constraints and clear dependent fields if needed
    if (newDate && prejudgmentDate && prejudgmentDate > newDate) {
        // Prejudgment date violates constraint, clear it
        prejudgmentDatePicker.clear();
        useStore.getState().setInput('prejudgmentStartDate', null);
    }
    
    if (newDate && postjudgmentDate && postjudgmentDate < newDate) {
        // Postjudgment date violates constraint, clear it
        postjudgmentDatePicker.clear();
        useStore.getState().setInput('postjudgmentEndDate', null);
    }
    
    // Update constraints on all pickers
    updateDatePickerConstraints();
    
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
    
    // Update the Zustand store with the new prejudgment date
    useStore.getState().setInput('prejudgmentStartDate', newDate);
    
    // Get current judgment date
    const judgmentDate = judgmentDatePicker && judgmentDatePicker.selectedDates.length > 0 ? 
        judgmentDatePicker.selectedDates[0] : null;
    
    // Check constraints and clear dependent fields if needed
    if (newDate && judgmentDate && newDate > judgmentDate) {
        // New prejudgment date is after judgment date, clear judgment date
        judgmentDatePicker.clear();
        useStore.getState().setInput('dateOfJudgment', null);
    }
    
    // Update constraints on all pickers
    updateDatePickerConstraints();
    
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
    
    // Update the Zustand store with the new postjudgment date
    useStore.getState().setInput('postjudgmentEndDate', newDate);
    
    // Get current judgment date
    const judgmentDate = judgmentDatePicker && judgmentDatePicker.selectedDates.length > 0 ? 
        judgmentDatePicker.selectedDates[0] : null;
    
    // Check constraints and clear dependent fields if needed
    if (newDate && judgmentDate && newDate < judgmentDate) {
        // New postjudgment date is before judgment date, clear judgment date
        judgmentDatePicker.clear();
        useStore.getState().setInput('dateOfJudgment', null);
    }
    
    // Update constraints on all pickers
    updateDatePickerConstraints();
    
    // Trigger recalculation
    if (typeof recalculateCallback === 'function') {
        recalculateCallback();
    }
}

/**
 * Updates the min/max date constraints on all date pickers based on current values.
 */
function updateDatePickerConstraints() {
    // Get current selected dates from all pickers
    const judgmentDate = judgmentDatePicker && judgmentDatePicker.selectedDates.length > 0 ? 
        judgmentDatePicker.selectedDates[0] : null;
    const prejudgmentDate = prejudgmentDatePicker && prejudgmentDatePicker.selectedDates.length > 0 ? 
        prejudgmentDatePicker.selectedDates[0] : null;
    const postjudgmentDate = postjudgmentDatePicker && postjudgmentDatePicker.selectedDates.length > 0 ? 
        postjudgmentDatePicker.selectedDates[0] : null;
    
    // Update Judgment Date picker constraints
    if (judgmentDatePicker) {
        // Set minDate to prejudgment date if it exists
        if (prejudgmentDate) {
            judgmentDatePicker.set('minDate', prejudgmentDate);
        } else {
            judgmentDatePicker.set('minDate', "1993-01-01");
        }
        
        // Set maxDate to postjudgment date if it exists
        if (postjudgmentDate) {
            judgmentDatePicker.set('maxDate', postjudgmentDate);
        } else {
            judgmentDatePicker.set('maxDate', "2030-12-31");
        }
    }
    
    // Update Prejudgment Date picker constraints
    if (prejudgmentDatePicker) {
        // Set maxDate to judgment date if it exists
        if (judgmentDate) {
            prejudgmentDatePicker.set('maxDate', judgmentDate);
        } else {
            prejudgmentDatePicker.set('maxDate', "2030-12-31");
        }
    }
    
    // Update Postjudgment Date picker constraints
    if (postjudgmentDatePicker) {
        // Set minDate to judgment date if it exists
        if (judgmentDate) {
            postjudgmentDatePicker.set('minDate', judgmentDate);
        } else {
            postjudgmentDatePicker.set('minDate', "1993-01-01");
        }
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
