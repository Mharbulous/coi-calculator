/**
 * Datepicker initialization and handling logic.
 * This module encapsulates the simplified datepicker implementation
 * for the Judgment Date, Prejudgment Start Date, and Postjudgment End Date fields.
 */

import elements from './elements.js';
import useStore from '../store.js';
import { formatDateForDisplay } from '../utils.date.js';
import { parseCurrency } from '../utils.currency.js'; // Added for parseCurrency

// Define the error background color to match the error message background
const ERROR_BACKGROUND_COLOR = '#f8d7da';
// Define the normal background color for date inputs
const NORMAL_BACKGROUND_COLOR = '#e0f2f7';

// Store references to the Flatpickr instances
let judgmentDatePicker = null;
let prejudgmentDatePicker = null;
let postjudgmentDatePicker = null;

// Store references to special damages and payment flatpickr instances
// Using Maps with input element as key for each instance
const specialDamagesDatePickers = new Map();
const paymentDatePickers = new Map();

/**
 * Initializes the date pickers with appropriate configurations and constraints.
 * This function is lifecycle-aware and only initializes datepickers for elements
 * that are both present in the DOM and visible based on the application state.
 * 
 * @param {Function} recalculateCallback - Function to call when dates change to trigger recalculation.
 * @returns {Object} Object containing the date picker instances.
 */
export function initializeDatePickers(recalculateCallback) {
    // We don't want to clean up all flatpickr calendars, as some belong to special damages rows
    // Instead, we'll only clean up the main date pickers (judgment, prejudgment, postjudgment)
    
    // Destroy existing instances if they exist
    if (judgmentDatePicker) {
        const calendarContainer = judgmentDatePicker.calendarContainer;
        judgmentDatePicker.destroy();
        if (calendarContainer && calendarContainer.parentNode) {
            calendarContainer.parentNode.removeChild(calendarContainer);
        }
    }
    
    if (prejudgmentDatePicker) {
        const calendarContainer = prejudgmentDatePicker.calendarContainer;
        prejudgmentDatePicker.destroy();
        if (calendarContainer && calendarContainer.parentNode) {
            calendarContainer.parentNode.removeChild(calendarContainer);
        }
    }
    
    if (postjudgmentDatePicker) {
        const calendarContainer = postjudgmentDatePicker.calendarContainer;
        postjudgmentDatePicker.destroy();
        if (calendarContainer && calendarContainer.parentNode) {
            calendarContainer.parentNode.removeChild(calendarContainer);
        }
    }
    
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
    
    // Update constraints on prejudgment and postjudgment pickers
    updatePrejudgmentPostjudgmentConstraints();
    
    // Update constraints on all special damages date pickers
    updateSpecialDamagesConstraints();
    // Update constraints on all payment date pickers
    updatePaymentDateConstraints();
    
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
    
    // Update constraints on all special damages date pickers
    updateSpecialDamagesConstraints();
    // Update constraints on all payment date pickers
    updatePaymentDateConstraints();
    
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
    // Update constraints on all payment date pickers
    updatePaymentDateConstraints();
    
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
            // Silently handle error
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
            // Silently handle error
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

/**
 * Initializes a flatpickr date picker for a special damages date input.
 * Applies date constraints based on Prejudgment Interest Date and Judgment Date.
 * 
 * @param {HTMLElement} inputElement - The special damages date input element to initialize.
 * @param {Function} onChangeCallbackProvidedByCaller - Function to call when dates change, expects (selectedDates, dateStr, instance).
 * @returns {Object} The flatpickr instance.
 */
export function initializeSpecialDamagesDatePicker(inputElement, onChangeCallbackProvidedByCaller) { // Renamed recalculateCallback
    // Check if this input already has a flatpickr instance
    if (specialDamagesDatePickers.has(inputElement)) {
        // Return the existing instance instead of destroying and recreating it
        return specialDamagesDatePickers.get(inputElement);
    }
    
    // Reset background color to default
    inputElement.style.backgroundColor = NORMAL_BACKGROUND_COLOR;
    
    // Get constraint dates from store
    const state = useStore.getState();
    const judgmentDate = state.inputs.dateOfJudgment;
    const prejudgmentDate = state.inputs.prejudgmentStartDate;
    
    
    // Calculate day after prejudgment date (if available)
    let minDate = "1993-01-01"; // Default fallback
    if (prejudgmentDate) {
        // Ensure minDate is the day AFTER prejudgment date
        // IMPORTANT: Use string format to avoid timezone issues
        const nextDay = new Date(Date.UTC(
            prejudgmentDate.getUTCFullYear(),
            prejudgmentDate.getUTCMonth(),
            prejudgmentDate.getUTCDate() + 1
        ));
        minDate = formatDateForDisplay(nextDay); // Use string for consistent timezone handling
    }
    
    // Use judgment date as max (if available) - convert to string for consistent handling
    const maxDate = judgmentDate ? formatDateForDisplay(judgmentDate) : "2025-06-30";
    
    // Create array of dates to explicitly disable
    let disabledDates = [];
    
    // Disable the prejudgment date itself
    if (prejudgmentDate) {
        // Create a date string in YYYY-MM-DD format for the prejudgment date
        // Using string format avoids timezone issues
        const dateStr = formatDateForDisplay(prejudgmentDate);
        disabledDates.push(dateStr);
    }
    
    // Disable the day after judgment date
    if (judgmentDate) {
        // IMPORTANT: Create a new date to avoid modifying the original
        // Using UTC methods to avoid timezone issues
        const dayAfterJudgment = new Date(Date.UTC(
            judgmentDate.getUTCFullYear(),
            judgmentDate.getUTCMonth(),
            judgmentDate.getUTCDate() + 1
        ));
        
        const dayAfterStr = formatDateForDisplay(dayAfterJudgment);
        disabledDates.push(dayAfterStr);
    }
    
    // Initialize flatpickr for the special damages date input
    const flatpickrInstance = flatpickr(inputElement, {
        dateFormat: "Y-m-d",
        allowInput: true,
        clickOpens: true,
        disableMobile: true,
        monthSelectorType: "dropdown",
        enableTime: false,
        minDate: minDate,
        maxDate: maxDate,
        disable: disabledDates, // Explicitly disable the prejudgment date
        onChange: onChangeCallbackProvidedByCaller, // Use the callback directly
        onOpen: positionCalendar
    });
    
    // Store the flatpickr instance with the input element as key
    specialDamagesDatePickers.set(inputElement, flatpickrInstance);
    
    return flatpickrInstance;
}

/**
 * Destroys a specific special damages flatpickr instance.
 * Ensures all DOM elements created by flatpickr are properly removed.
 * 
 * @param {HTMLElement} inputElement - The special damages date input element whose flatpickr to destroy.
 * @returns {boolean} True if the instance was found and destroyed, false otherwise.
 */
export function destroySpecialDamagesDatePicker(inputElement) {
    if (specialDamagesDatePickers.has(inputElement)) {
        const instance = specialDamagesDatePickers.get(inputElement);
        
        // Store reference to the calendar container before destroying
        const calendarContainer = instance.calendarContainer;
        
        // Call the destroy method to clean up
        instance.destroy();
        
        // Manually remove the calendar container from the DOM if it still exists
        if (calendarContainer && calendarContainer.parentNode) {
            calendarContainer.parentNode.removeChild(calendarContainer);
        }
        
        // Remove from the Map
        specialDamagesDatePickers.delete(inputElement);
        
        return true;
    }
    
    return false;
}

/**
 * Handler for when a Special Damages Date changes.
 * Validates the selected date against constraints and provides visual feedback.
 * 
 * @param {Array} selectedDates - Array of selected dates from Flatpickr.
 * @param {HTMLElement} inputElement - The input element associated with the picker.
 * @param {Function} recalculateCallback - Function to call to trigger recalculation.
 */
function onSpecialDamagesDateChange(selectedDates, inputElement, recalculateCallback) {
    // Get the new date from selectedDates
    const newDate = selectedDates.length > 0 ? selectedDates[0] : null;
    
    // Get constraint dates from store
    const state = useStore.getState();
    const judgmentDate = state.inputs.dateOfJudgment;
    const prejudgmentDate = state.inputs.prejudgmentStartDate;
    
    // Calculate day after prejudgment date (if available)
    let minDate = null;
    if (prejudgmentDate) {
        // Use UTC methods to avoid timezone issues
        minDate = new Date(Date.UTC(
            prejudgmentDate.getUTCFullYear(),
            prejudgmentDate.getUTCMonth(),
            prejudgmentDate.getUTCDate() + 1
        ));
    }
    
    // Validate the selected date
    let isValid = true;
    
    if (newDate) {
        // Check if date is at least one day after prejudgment date
        // Special damages dates must be strictly AFTER prejudgment date
        if (minDate && newDate < minDate) {
            isValid = false;
        }
        
        // Check if date is before or on judgment date
        // The judgment date itself is valid for special damages
        if (judgmentDate) {
            // Compare using formatted strings to avoid timezone issues
            const selectedDateStr = formatDateForDisplay(newDate);
            const judgmentDateStr = formatDateForDisplay(judgmentDate);
            
            if (selectedDateStr > judgmentDateStr) {
                isValid = false;
            }
        }
    }
    
    // Apply visual feedback and update the input
    if (!isValid) {
        // Invalid date - clear the picker and set error background
        const instance = specialDamagesDatePickers.get(inputElement);
        if (instance) {
            instance.clear();
        }
        inputElement.style.backgroundColor = ERROR_BACKGROUND_COLOR;
        // Do not update store or trigger recalculation for invalid dates
    } else {
        // Valid date - normal background
        inputElement.style.backgroundColor = NORMAL_BACKGROUND_COLOR;
        
        if (newDate) {
            // Format the date as YYYY-MM-DD
            const formattedDate = formatDateForDisplay(newDate);
            
            // Update the input element's value directly
            inputElement.value = formattedDate;

            // Update the store
            const specialDamageIdString = inputElement.dataset.specialDamageId;
            if (specialDamageIdString) {
                let specialDamageIndex = useStore.getState().results.specialDamages.findIndex(sd => sd.specialDamageId === specialDamageIdString);

                // Fallback for potential numeric IDs
                if (specialDamageIndex === -1) {
                    const specialDamageIdNumber = parseFloat(specialDamageIdString);
                    if (!isNaN(specialDamageIdNumber)) {
                        specialDamageIndex = useStore.getState().results.specialDamages.findIndex(sd => sd.specialDamageId === specialDamageIdNumber);
                    }
                }

                if (specialDamageIndex !== -1) {
                    const currentDamage = useStore.getState().results.specialDamages[specialDamageIndex];
                    const updatedDamage = { ...currentDamage, date: formattedDate };
                    useStore.getState().updateSpecialDamage(specialDamageIndex, updatedDamage);
                } else {
                    console.warn(`[onSpecialDamagesDateChange] Special Damage with ID ${specialDamageIdString} not found in store for date: ${formattedDate}.`);
                }
            } else {
                console.warn(`[onSpecialDamagesDateChange] specialDamageId not found on inputElement dataset for date: ${formattedDate}. Input type: ${inputElement.dataset.type}`);
            }
            
            // Dispatch a change event to ensure DOM state synchronization
            const changeEvent = new Event('change', { bubbles: true });
            inputElement.dispatchEvent(changeEvent);
        }
        
        // Trigger recalculation
        if (typeof recalculateCallback === 'function') {
            recalculateCallback();
        }
    }
}

/**
 * Updates the constraints for all special damages date pickers.
 * This should be called when judgment date or prejudgment date changes.
 */
function updateSpecialDamagesConstraints() {
    // Get constraint dates from store
    const state = useStore.getState();
    const judgmentDate = state.inputs.dateOfJudgment;
    const prejudgmentDate = state.inputs.prejudgmentStartDate;
    
    
    // Calculate day after prejudgment date (if available)
    let minDate = "1993-01-01"; // Default fallback
    if (prejudgmentDate) {
        // Ensure minDate is the day AFTER prejudgment date
        // Special damages can only be 1+ days after prejudgment interest date
        // IMPORTANT: Use string format to avoid timezone issues
        const nextDay = new Date(Date.UTC(
            prejudgmentDate.getUTCFullYear(),
            prejudgmentDate.getUTCMonth(),
            prejudgmentDate.getUTCDate() + 1
        ));
        minDate = formatDateForDisplay(nextDay); // Use string for consistent timezone handling
    }
    
    // Use judgment date as max (if available) - convert to string for consistent handling
    const maxDate = judgmentDate ? formatDateForDisplay(judgmentDate) : "2025-06-30";
    
    // Create array of dates to explicitly disable
    let disabledDates = [];
    
    // Disable the prejudgment date itself
    if (prejudgmentDate) {
        // Create a date string in YYYY-MM-DD format for the prejudgment date
        // Using string format avoids timezone issues
        const dateStr = formatDateForDisplay(prejudgmentDate);
        disabledDates.push(dateStr);
    }
    
    // Disable the day after judgment date
    if (judgmentDate) {
        // Using UTC methods to avoid timezone issues
        const dayAfterJudgment = new Date(Date.UTC(
            judgmentDate.getUTCFullYear(),
            judgmentDate.getUTCMonth(),
            judgmentDate.getUTCDate() + 1
        ));
        
        const dayAfterStr = formatDateForDisplay(dayAfterJudgment);
        disabledDates.push(dayAfterStr);
    }
    
    // Update all special damages date pickers
    specialDamagesDatePickers.forEach((instance, inputElement) => {
        try {
            
            // Update constraints
            instance.set('minDate', minDate);
            instance.set('maxDate', maxDate);
            instance.set('disable', disabledDates); // Directly disable the prejudgment date
            
            // Validate current selection
            const selectedDate = instance.selectedDates.length > 0 ? instance.selectedDates[0] : null;
            let isValid = true;
            
            if (selectedDate) {
                // Get current selection as formatted string for comparison
                const selectedDateStr = formatDateForDisplay(selectedDate);
                
                // Check if date is after one day after prejudgment date
                if (prejudgmentDate) {
                    // Use UTC methods to avoid timezone issues
                    const minDateObj = new Date(Date.UTC(
                        prejudgmentDate.getUTCFullYear(),
                        prejudgmentDate.getUTCMonth(),
                        prejudgmentDate.getUTCDate() + 1
                    ));
                    const minDateStr = formatDateForDisplay(minDateObj);
                    
                    if (selectedDateStr < minDateStr) {
                        isValid = false;
                    }
                }
                
                // Check if date is before or on judgment date
                // The judgment date itself is valid for special damages
                if (judgmentDate) {
                    const judgmentDateStr = formatDateForDisplay(judgmentDate);
                    
                    if (selectedDateStr > judgmentDateStr) {
                        isValid = false;
                    }
                }
            }
            
            // Apply visual feedback
            if (!isValid && selectedDate) {
                // Invalid date - clear the picker and set error background
                instance.clear();
                inputElement.style.backgroundColor = ERROR_BACKGROUND_COLOR;
            } else if (selectedDate) {
                // Valid date - normal background
                inputElement.style.backgroundColor = NORMAL_BACKGROUND_COLOR;
            }
        } catch (error) {
            // Silently handle error
        }
    });
}

/**
 * Destroys all special damages flatpickr instances.
 * Ensures all DOM elements created by flatpickr are properly removed.
 * This can be useful when needing to reset the entire application state.
 */
export function destroyAllSpecialDamagesDatePickers() {
    specialDamagesDatePickers.forEach((instance, inputElement) => {
        // Store reference to the calendar container before destroying
        const calendarContainer = instance.calendarContainer;
        
        // Call the destroy method to clean up
        instance.destroy();
        
        // Manually remove the calendar container from the DOM if it still exists
        if (calendarContainer && calendarContainer.parentNode) {
            calendarContainer.parentNode.removeChild(calendarContainer);
        }
    });
    
    // Clear the Map
    specialDamagesDatePickers.clear();
    
    // Additional cleanup: remove any orphaned flatpickr calendars from the DOM
    const orphanedCalendars = document.querySelectorAll('.flatpickr-calendar');
    orphanedCalendars.forEach(calendar => {
        if (calendar.parentNode) {
            calendar.parentNode.removeChild(calendar);
        }
    });
}

/**
 * Initializes a flatpickr date picker for a payment date input.
 * Applies date constraints based on the application state.
 * 
 * @param {HTMLElement} inputElement - The payment date input element to initialize.
 * @param {Function} recalculateCallback - Function to call when dates change to trigger recalculation.
 * @returns {Object} The flatpickr instance.
 */
export function initializePaymentDatePicker(inputElement, recalculateCallback) {
    // Check if this input already has a flatpickr instance
    if (paymentDatePickers.has(inputElement)) {
        // Return the existing instance instead of destroying and recreating it
        return paymentDatePickers.get(inputElement);
    }
    
    // Reset background color to default
    inputElement.style.backgroundColor = NORMAL_BACKGROUND_COLOR;
    
    // Get constraint dates from store
    const state = useStore.getState();
    const judgmentDate = state.inputs.dateOfJudgment; // Still needed for context, though not direct constraint
    const prejudgmentDate = state.inputs.prejudgmentStartDate;
    const postjudgmentEndDate = state.inputs.postjudgmentEndDate; // Use this for maxDate

    // Calculate minimum and maximum dates for payment
    let minDate = "1993-01-01"; // Default fallback
    if (prejudgmentDate) {
        // Payment can be on or after the prejudgment date
        minDate = formatDateForDisplay(prejudgmentDate); // prejudgmentDate is a Date object
    }
    
    // Maximum date is the postjudgmentEndDate from the store
    let maxDate = "2025-06-30"; // Default fallback if postjudgmentEndDate is not set
    if (postjudgmentEndDate) {
        maxDate = formatDateForDisplay(postjudgmentEndDate); // postjudgmentEndDate is a Date object
    }
    
    // Initialize flatpickr for the payment date input
    const flatpickrInstance = flatpickr(inputElement, {
        dateFormat: "Y-m-d",
        allowInput: true,
        clickOpens: true,
        disableMobile: true,
        monthSelectorType: "dropdown",
        enableTime: false,
        minDate: minDate,
        maxDate: maxDate,
        onChange: (selectedDates) => onPaymentDateChange(selectedDates, inputElement, recalculateCallback),
        onOpen: positionCalendar
    });
    
    // Store the flatpickr instance with the input element as key
    paymentDatePickers.set(inputElement, flatpickrInstance);
    
    return flatpickrInstance;
}

/**
 * Destroys a specific payment flatpickr instance.
 * Ensures all DOM elements created by flatpickr are properly removed.
 * 
 * @param {HTMLElement} inputElement - The payment date input element whose flatpickr to destroy.
 * @returns {boolean} True if the instance was found and destroyed, false otherwise.
 */
export function destroyPaymentDatePicker(inputElement) {
    if (paymentDatePickers.has(inputElement)) {
        const instance = paymentDatePickers.get(inputElement);
        
        // Store reference to the calendar container before destroying
        const calendarContainer = instance.calendarContainer;
        
        // Call the destroy method to clean up
        instance.destroy();
        
        // Manually remove the calendar container from the DOM if it still exists
        if (calendarContainer && calendarContainer.parentNode) {
            calendarContainer.parentNode.removeChild(calendarContainer);
        }
        
        // Remove from the Map
        paymentDatePickers.delete(inputElement);
        
        return true;
    }
    
    return false;
}

/**
 * Handler for when a Payment Date changes.
 * Validates the selected date against constraints and provides visual feedback.
 * 
 * @param {Array} selectedDates - Array of selected dates from Flatpickr.
 * @param {HTMLElement} inputElement - The input element associated with the picker.
 * @param {Function} recalculateCallback - Function to call to trigger recalculation.
 */
function onPaymentDateChange(selectedDates, inputElement, recalculateCallback) {
    // Get the new date from selectedDates
    const newDate = selectedDates.length > 0 ? selectedDates[0] : null;
    
    // Get constraint dates from store
    const state = useStore.getState();
    // const judgmentDate = state.inputs.dateOfJudgment; // Not directly used for validation here anymore
    const prejudgmentDate = state.inputs.prejudgmentStartDate;
    const postjudgmentEndDate = state.inputs.postjudgmentEndDate; // Use this for maxDate validation

    // Calculate min and max dates for validation
    let minDateObj = null; 
    if (prejudgmentDate) {
        minDateObj = prejudgmentDate; // This is a Date object from the store
    }
    
    let maxDateObj = null; 
    if (postjudgmentEndDate) {
        maxDateObj = postjudgmentEndDate; // This is a Date object from the store
    }
    
    // Validate the selected date
    let isValid = true;
    
    if (newDate) {
        // Check if date is on or after prejudgment date
        // Assuming minDateObj is a Date object and newDate is a Date object
        if (minDateObj && newDate < minDateObj) {
            isValid = false;
        }
        
        // Check if date is before or on max date, using string comparison
        if (maxDateObj) {
            const selectedDateStr = formatDateForDisplay(newDate);
            const maxDateStr = formatDateForDisplay(maxDateObj);
            if (selectedDateStr > maxDateStr) {
                isValid = false;
            }
        }
    }
    
    // Apply visual feedback and update the input
    if (!isValid) {
        // Invalid date - clear the picker and set error background
        const instance = paymentDatePickers.get(inputElement);
        if (instance) {
            instance.clear();
        }
        inputElement.style.backgroundColor = ERROR_BACKGROUND_COLOR;
        // Do not update store or trigger recalculation for invalid dates
    } else {
        // Valid date - normal background
        inputElement.style.backgroundColor = NORMAL_BACKGROUND_COLOR;
        
        if (newDate) {
            // Format the date as YYYY-MM-DD
            const formattedDate = formatDateForDisplay(newDate);
            // Update the input element's value directly, Flatpickr might do this but good to be explicit
            inputElement.value = formattedDate;

            // Instead of updating the store directly here with partial data,
            // we will rely on a function in payments.js to read the whole row and update.
            // However, the `recalculateCallback` is what eventually triggers `updatePaymentInStoreFromRow`
            // via the event chain if `updatePaymentInStoreFromRow` dispatches 'payment-updated'.
            // For now, to ensure the store is updated with the new date and amount from the row,
            // we need to call a function that does that.
            // The `recalculateCallback` itself doesn't update the store; it triggers processes that *read* from it.

            // The most straightforward way is to have `onPaymentDateChange` call a function
            // that reads the whole row and updates the store, similar to `updateSpecialDamageInStoreFromRow`.
            // Since `updatePaymentInStoreFromRow` is in `payments.js`, we can't directly call it here
            // without creating circular dependencies or passing it around.

            // For now, let's replicate the logic of reading the full row here for payments.
            // This is not ideal as it duplicates logic from the conceptual updatePaymentInStoreFromRow.
            // A better long-term solution would be to pass the updatePaymentInStoreFromRow function
            // or use a more event-driven approach where this function only sets the date value
            // and another listener on the input (e.g., blur) calls the consolidated updater.

            // TEMPORARY direct update logic here, to be refactored if a cleaner way is found.
            const row = inputElement.closest('tr');
            if (row) {
                const amountInput = row.querySelector('.special-damages-amount[data-type="payment-amount"]'); // Further corrected selector
                const paymentId = inputElement.dataset.paymentId;

                if (amountInput && paymentId) {
                    const newAmount = parseCurrency(amountInput.value);
                    const state = useStore.getState();
                    const paymentIndex = state.results.payments.findIndex(p => p.paymentId === paymentId);

                    if (paymentIndex !== -1) {
                        const updatedPaymentData = {
                            date: formattedDate, // new date from picker
                            amount: newAmount    // current amount from input
                        };
                        state.updatePayment(paymentIndex, updatedPaymentData);
                        // Dispatch event after successful store update
                        // The recalculateCallback will be triggered by this event via calculator.ui.js
                        const event = new CustomEvent('payment-updated', { bubbles: true, cancelable: true });
                        document.dispatchEvent(event);
                    } else {
                        console.warn(`[onPaymentDateChange] Payment ID ${paymentId} not found in store.`);
                    }
                } else {
                    console.warn('[onPaymentDateChange] Could not find amount input or paymentId for row.');
                }
            } else {
                console.warn('[onPaymentDateChange] Could not find parent row for payment date input.');
            }
            // The original recalculateCallback is effectively triggered by the 'payment-updated' event.
        } else {
             // If newDate is null (e.g., picker cleared), we might still need to trigger recalculation
             // if the expectation is that clearing a date field should update totals.
             // For now, only trigger if there was a valid newDate.
        }
        // The original `recalculateCallback()` call is removed from here because the 'payment-updated'
        // event dispatched above will trigger it via `calculator.ui.js`.
    }
}

/**
 * Destroys all payment flatpickr instances.
 * Ensures all DOM elements created by flatpickr are properly removed.
 * This can be useful when needing to reset the entire application state.
 */
export function destroyAllPaymentDatePickers() {
    paymentDatePickers.forEach((instance, inputElement) => {
        // Store reference to the calendar container before destroying
        const calendarContainer = instance.calendarContainer;
        
        // Call the destroy method to clean up
        instance.destroy();
        
        // Manually remove the calendar container from the DOM if it still exists
        if (calendarContainer && calendarContainer.parentNode) {
            calendarContainer.parentNode.removeChild(calendarContainer);
        }
    });
    
    // Clear the Map
    paymentDatePickers.clear();
}

/**
 * Updates the constraints for all payment date pickers.
 * This should be called when prejudgment start date or postjudgment end date changes.
 */
export function updatePaymentDateConstraints() {
    const state = useStore.getState();
    const prejudgmentDate = state.inputs.prejudgmentStartDate;
    const postjudgmentEndDate = state.inputs.postjudgmentEndDate;

    let minConstraint = "1993-01-01";
    if (prejudgmentDate) {
        minConstraint = formatDateForDisplay(prejudgmentDate);
    }

    let maxConstraint = "2025-06-30"; // Fallback
    if (postjudgmentEndDate) {
        maxConstraint = formatDateForDisplay(postjudgmentEndDate);
    }

    paymentDatePickers.forEach((instance, inputElement) => {
        try {
            instance.set('minDate', minConstraint);
            instance.set('maxDate', maxConstraint);

            // Re-validate current selection
            const selectedDate = instance.selectedDates.length > 0 ? instance.selectedDates[0] : null;
            let isValid = true;
            if (selectedDate) {
                const selectedDateStr = formatDateForDisplay(selectedDate);
                if (prejudgmentDate && selectedDateStr < minConstraint) {
                    isValid = false;
                }
                if (postjudgmentEndDate && selectedDateStr > maxConstraint) {
                    isValid = false;
                }
            }

            if (!isValid && selectedDate) {
                instance.clear();
                inputElement.style.backgroundColor = ERROR_BACKGROUND_COLOR;
            } else if (selectedDate) {
                inputElement.style.backgroundColor = NORMAL_BACKGROUND_COLOR;
            }
        } catch (error) {
            // Silently handle error
        }
    });
}
