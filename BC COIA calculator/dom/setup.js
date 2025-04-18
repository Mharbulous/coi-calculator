import { formatDateLong, parseDateInput, formatDateForInput, formatDateForDisplay, validateDateFormat, dateBefore, dateAfter } from '../utils.date.js';
import { formatCurrencyForDisplay, formatCurrencyForInput, formatCurrencyForInputWithCommas, parseCurrency } from '../utils.currency.js';
import elements from './elements.js';
import useStore from '../store.js';

// Track the date picker instances
let judgmentDatePicker = null;
let prejudgmentDatePicker = null;
let postjudgmentDatePicker = null;

/**
 * Sets up auto-formatting for date input fields that will automatically insert hyphens.
 * @param {HTMLInputElement} inputElement - The date input element.
 */
export function setupAutoFormattingDateInputListeners(inputElement) {
    if (!inputElement) return;

    inputElement.addEventListener('input', (event) => {
        // Store current cursor position
        const cursorPos = event.target.selectionStart;
        
        // Get input value and strip non-digit characters
        let value = event.target.value.replace(/\D/g, '');
        
        // Limit to 8 digits
        value = value.substring(0, 8);
        
        // Format with hyphens
        let formattedValue = '';
        if (value.length > 0) {
            // Add first part (YYYY)
            formattedValue = value.substring(0, Math.min(4, value.length));
            
            // Add hyphen and second part (MM) if applicable
            if (value.length > 4) {
                formattedValue += '-' + value.substring(4, Math.min(6, value.length));
            }
            
            // Add hyphen and third part (DD) if applicable
            if (value.length > 6) {
                formattedValue += '-' + value.substring(6, 8);
            }
        }
        
        // Calculate new cursor position
        let newCursorPos = cursorPos;
        const oldValue = event.target.value;
        
        // Adjust cursor position based on added/removed hyphens
        if (cursorPos > 4) {
            // If we're past the first hyphen position
            if (oldValue.charAt(4) !== '-' && formattedValue.charAt(4) === '-') {
                // A hyphen was added at position 4, adjust cursor
                newCursorPos += 1;
            }
        }
        
        if (cursorPos > 7) {
            // If we're past the second hyphen position
            if (oldValue.charAt(7) !== '-' && formattedValue.charAt(7) === '-') {
                // A hyphen was added at position 7, adjust cursor
                newCursorPos += 1;
            }
        }
        
        // Update input value
        event.target.value = formattedValue;
        
        // Restore cursor position
        event.target.setSelectionRange(newCursorPos, newCursorPos);
    });
}

/**
 * Initialize date pickers with constraints based on judgment date
 * @returns {Object} Object containing the date picker instances
 */
export function initializeDatePickers(recalculateCallback) {
    // Initialize Judgment Date picker first (no constraints initially)
    judgmentDatePicker = flatpickr(elements.judgmentDateInput, {
        dateFormat: "Y-m-d",
        allowInput: true,
        clickOpens: true,
        disableMobile: true,
        monthSelectorType: "dropdown",
        enableTime: false,
        minDate: "1993-01-01",
        maxDate: "2030-12-31",
        onChange: function(selectedDates, dateStr) {
            // When judgment date changes, update constraints for other pickers
            updateDateConstraints(dateStr);
            // Trigger recalculation
            if (typeof recalculateCallback === 'function') {
                recalculateCallback();
            }
        },
        onOpen: positionCalendar
    });
    
    // Initialize Prejudgment Date picker with max date = judgment date
    prejudgmentDatePicker = flatpickr(elements.prejudgmentInterestDateInput, {
        dateFormat: "Y-m-d",
        allowInput: true,
        clickOpens: true,
        disableMobile: true,
        monthSelectorType: "dropdown",
        enableTime: false,
        minDate: "1993-01-01",
        // Initially constrain to dates before judgment date (if available)
        maxDate: elements.judgmentDateInput.value || "2030-12-31",
        onChange: function() {
            if (typeof recalculateCallback === 'function') {
                recalculateCallback();
            }
        },
        onOpen: positionCalendar
    });
    
    // Initialize Postjudgment Date picker with min date = judgment date
    postjudgmentDatePicker = flatpickr(elements.postjudgmentInterestDateInput, {
        dateFormat: "Y-m-d",
        allowInput: true,
        clickOpens: true,
        disableMobile: true,
        monthSelectorType: "dropdown",
        enableTime: false,
        // Initially constrain to dates after judgment date (if available)
        minDate: elements.judgmentDateInput.value || "1993-01-01",
        maxDate: "2030-12-31",
        onChange: function() {
            if (typeof recalculateCallback === 'function') {
                recalculateCallback();
            }
        },
        onOpen: positionCalendar
    });
    
    // Update constraints based on initial judgment date
    if (elements.judgmentDateInput.value) {
        updateDateConstraints(elements.judgmentDateInput.value);
    }
    
    return {
        judgmentDatePicker,
        prejudgmentDatePicker,
        postjudgmentDatePicker
    };
}

/**
 * Update date constraints when judgment date changes
 * @param {string} judgmentDateStr - The judgment date string in YYYY-MM-DD format
 */
function updateDateConstraints(judgmentDateStr) {
    if (!judgmentDateStr) return;
    
    // Update Prejudgment Date picker to only allow dates before judgment date
    if (prejudgmentDatePicker && elements.prejudgmentInterestDateInput) {
        prejudgmentDatePicker.set('maxDate', judgmentDateStr);
        
        // If current prejudgment date is now invalid, reset it
        const currentPrejudgmentDate = elements.prejudgmentInterestDateInput.value;
        if (currentPrejudgmentDate) {
            const prejudgmentDate = parseDateInput(currentPrejudgmentDate);
            const judgmentDate = parseDateInput(judgmentDateStr);
            
            if (prejudgmentDate && judgmentDate && !dateBefore(prejudgmentDate, judgmentDate)) {
                prejudgmentDatePicker.clear();
                // Show a subtle notification that the date was cleared
                showDateConstraintNotification(elements.prejudgmentInterestDateInput, "Date must be before Judgment Date");
            }
        }
    }
    
    // Update Postjudgment Date picker to only allow dates after judgment date
    if (postjudgmentDatePicker && elements.postjudgmentInterestDateInput) {
        postjudgmentDatePicker.set('minDate', judgmentDateStr);
        
        // If current postjudgment date is now invalid, reset it
        const currentPostjudgmentDate = elements.postjudgmentInterestDateInput.value;
        if (currentPostjudgmentDate) {
            const postjudgmentDate = parseDateInput(currentPostjudgmentDate);
            const judgmentDate = parseDateInput(judgmentDateStr);
            
            if (postjudgmentDate && judgmentDate && !dateAfter(postjudgmentDate, judgmentDate)) {
                postjudgmentDatePicker.clear();
                // Show a subtle notification that the date was cleared
                showDateConstraintNotification(elements.postjudgmentInterestDateInput, "Date must be after Judgment Date");
            }
        }
    }
}

// Track if a notification is currently being shown
let isNotificationVisible = false;

/**
 * Show a subtle notification when a date is cleared due to constraint violation
 * @param {HTMLElement} inputElement - The input element
 * @param {string} message - The notification message
 */
function showDateConstraintNotification(inputElement, message) {
    // Check if there's already a notification visible
    if (isNotificationVisible || document.querySelector('.date-constraint-notification, .error-notification')) {
        return; // Don't show multiple notifications at once
    }
    
    isNotificationVisible = true;
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'date-constraint-notification';
    notification.textContent = message;
    notification.style.position = 'absolute';
    notification.style.backgroundColor = '#fff3cd';
    notification.style.color = '#856404';
    notification.style.padding = '5px 10px';
    notification.style.borderRadius = '4px';
    notification.style.fontSize = '12px';
    notification.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    notification.style.zIndex = '1000';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease-in-out';
    
    // Position the notification near the input
    const rect = inputElement.getBoundingClientRect();
    notification.style.top = `${rect.bottom + window.scrollY + 5}px`;
    notification.style.left = `${rect.left + window.scrollX}px`;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Fade in
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
            isNotificationVisible = false;
        }, 300);
    }, 3000);
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
 * Sets up event listeners for custom date input fields with auto-formatting and date picker.
 * @param {HTMLInputElement} inputElement - The date input element.
 * @param {function} changeCallback - The function to call after validation.
 */
export function setupCustomDateInputListeners(inputElement, changeCallback) {
    if (!inputElement) return;

    // Check if this is one of the three specific date fields that should have a date picker
    const isJudgmentDate = inputElement.dataset.input === 'judgmentDate';
    const isPrejudgmentFromDate = inputElement.closest('tr')?.querySelector('[data-display="itemText"]')?.textContent === 'Prejudgment Interest';
    const isPostjudgmentUntilDate = inputElement.closest('tr')?.querySelector('[data-display="itemText"]')?.textContent === 'Postjudgment Interest';

    // For date picker fields, initialize Flatpickr
    if (isJudgmentDate || isPrejudgmentFromDate || isPostjudgmentUntilDate) {
        // Date pickers are now initialized in initializeDatePickers function
        // This function is kept for backward compatibility and for non-main date fields
        
        // For manual input validation
        inputElement.addEventListener('blur', (event) => {
            const value = event.target.value.trim();
            if (value === '') {
                // Allow empty value
                if (typeof changeCallback === 'function') {
                    changeCallback();
                }
                return;
            }

            // Validate the date format
            if (validateDateFormat(value)) {
                // Format is valid, check constraints
                if (isJudgmentDate) {
                    // If judgment date, update constraints for other pickers
                    updateDateConstraints(value);
                } else if (isPrejudgmentFromDate) {
                    // Check if date is before judgment date
                    const judgmentDateValue = elements.judgmentDateInput.value;
                    if (judgmentDateValue) {
                        const prejudgmentDate = parseDateInput(value);
                        const judgmentDate = parseDateInput(judgmentDateValue);
                        
                        if (prejudgmentDate && judgmentDate && !dateBefore(prejudgmentDate, judgmentDate)) {
                            // Invalid constraint, clear the field
                            event.target.value = '';
                            showDateConstraintNotification(inputElement, "Date must be before Judgment Date");
                        }
                    }
                } else if (isPostjudgmentUntilDate) {
                    // Check if date is after judgment date
                    const judgmentDateValue = elements.judgmentDateInput.value;
                    if (judgmentDateValue) {
                        const postjudgmentDate = parseDateInput(value);
                        const judgmentDate = parseDateInput(judgmentDateValue);
                        
                        if (postjudgmentDate && judgmentDate && !dateAfter(postjudgmentDate, judgmentDate)) {
                            // Invalid constraint, clear the field
                            event.target.value = '';
                            showDateConstraintNotification(inputElement, "Date must be after Judgment Date");
                        }
                    }
                }
                
                if (typeof changeCallback === 'function') {
                    changeCallback();
                }
            } else {
                // Try to parse and reformat the date
                const dateObj = parseDateInput(value);
                if (dateObj) {
                    // If we could parse it, format it correctly
                    event.target.value = formatDateForInput(dateObj);
                    
                    // Check constraints after formatting
                    if (isJudgmentDate) {
                        updateDateConstraints(event.target.value);
                    } else if (isPrejudgmentFromDate || isPostjudgmentUntilDate) {
                        // Trigger blur event again to check constraints
                        setTimeout(() => event.target.blur(), 10);
                    }
                    
                    if (typeof changeCallback === 'function') {
                        changeCallback();
                    }
                } else {
                    // Invalid date, clear the field and show notification
                    event.target.value = '';
                    showDateConstraintNotification(inputElement, "Invalid date format. Use YYYY-MM-DD.");
                    // Focus back on the input for correction
                    setTimeout(() => event.target.focus(), 100);
                }
            }
        });
    } else {
        // For non-date picker fields (e.g., special damages dates), use the original auto-formatting and blur validation
        setupAutoFormattingDateInputListeners(inputElement);

        // Format on blur
        inputElement.addEventListener('blur', (event) => {
            const value = event.target.value.trim();
            if (value === '') {
                // Allow empty value
                if (typeof changeCallback === 'function') {
                    changeCallback();
                }
                return;
            }

            // Validate the date format
            if (validateDateFormat(value)) {
                // Format is valid, keep as is
                if (typeof changeCallback === 'function') {
                    changeCallback();
                }
            } else {
                // Try to parse and reformat the date
                const dateObj = parseDateInput(value);
                if (dateObj) {
                    // If we could parse it, format it correctly
                    event.target.value = formatDateForInput(dateObj);
                    if (typeof changeCallback === 'function') {
                        changeCallback();
                    }
                } else {
                    // Invalid date, clear the field and show notification
                    event.target.value = '';
                    showDateConstraintNotification(inputElement, "Invalid date format. Use YYYY-MM-DD.");
                    // Focus back on the input for correction
                    setTimeout(() => event.target.focus(), 100);
                }
            }
        });
    }

    // Handle Enter key for all date inputs
    inputElement.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            event.target.blur(); // Trigger blur event which handles validation
        }
    });
}

/**
 * Sets up event listeners for currency input fields (blur, focus, Enter key).
 * @param {HTMLInputElement} inputElement - The currency input element.
 * @param {function} recalculateCallback - The function to call after formatting.
 */
export function setupCurrencyInputListeners(inputElement, recalculateCallback) {
    if (!inputElement) return;

    inputElement.addEventListener('blur', (event) => {
        // On blur, parse and format with commas for display
        let value = parseCurrency(event.target.value);
        event.target.value = formatCurrencyForInputWithCommas(value);
        if (typeof recalculateCallback === 'function') {
            recalculateCallback(); // Recalculate after formatting
        }
    });

    inputElement.addEventListener('focus', (event) => {
        // On focus, parse and show raw number for editing
        let value = parseCurrency(event.target.value);
        // Display as plain number with 2 decimal places, no $ or commas
        event.target.value = value.toFixed(2);
        event.target.select(); // Select contents for easy replacement
    });

    inputElement.addEventListener('keyup', (event) => {
        // Recalculate and format with commas on Enter key
        if (event.key === 'Enter') {
            let value = parseCurrency(event.target.value);
            event.target.value = formatCurrencyForInputWithCommas(value);
            if (typeof recalculateCallback === 'function') {
                recalculateCallback(); // Recalculate after formatting
            }
            event.target.blur(); // Remove focus after Enter
        }
    });
}

/**
 * Sets the default values for input fields on page load.
 * Also initializes the Zustand store with these default values.
 */
export function setDefaultInputValues() {
     // Set default jurisdiction
     if (elements.jurisdictionSelect && !elements.jurisdictionSelect.value) {
         elements.jurisdictionSelect.value = 'BC';
     }
     // Set default checkbox states (ensure they are checked by default)
     if (elements.showPrejudgmentCheckbox && !elements.showPrejudgmentCheckbox.checked) {
          elements.showPrejudgmentCheckbox.checked = true;
     }
     if (elements.showPostjudgmentCheckbox && !elements.showPostjudgmentCheckbox.checked) {
          elements.showPostjudgmentCheckbox.checked = true;
     }
     if (elements.showPerDiemCheckbox && !elements.showPerDiemCheckbox.checked) {
          elements.showPerDiemCheckbox.checked = true;
     }
     
     // Update the Zustand store with these default values
     useStore.getState().setInputs({
         jurisdiction: elements.jurisdictionSelect.value,
         showPrejudgment: elements.showPrejudgmentCheckbox.checked,
         showPostjudgment: elements.showPostjudgmentCheckbox.checked,
         showPerDiem: elements.showPerDiemCheckbox.checked
     });
}
