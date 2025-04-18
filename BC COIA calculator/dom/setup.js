import { formatDateLong, parseDateInput, formatDateForInput, formatDateForDisplay, validateDateFormat } from '../utils.date.js';
import { formatCurrencyForDisplay, formatCurrencyForInput, formatCurrencyForInputWithCommas, parseCurrency } from '../utils.currency.js';
import elements from './elements.js';
import useStore from '../store.js';

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
        // Initialize Flatpickr for the specific date fields
        const fpInstance = flatpickr(inputElement, {
            dateFormat: "Y-m-d",
            allowInput: true, // Re-enable manual input
            clickOpens: true,
            disableMobile: true, // Ensures consistent behavior across devices
            // Enable month and year dropdowns for easier navigation
            monthSelectorType: "dropdown",
            enableTime: false,
            // Set a wide year range to allow selecting dates far apart
            minDate: "1993-01-01",
            maxDate: "2030-12-31",
            // Handle date selection
            onChange: function(selectedDates, dateStr, instance) {
                // When a date is selected via the picker,
                // update the input value directly and trigger the change callback.
                if (selectedDates.length > 0) {
                    // No need to manually set inputElement.value = dateStr; Flatpickr does this.
                    if (typeof changeCallback === 'function') {
                        changeCallback();
                    }
                }
            },
            // Manually position the calendar on open
            onOpen: function(selectedDates, dateStr, instance) {
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
            // Removed the onReady handler as it might interfere
        });

        // NO blur listener for Flatpickr inputs to avoid conflicts
        // Validation for manual input happens via Flatpickr's allowInput + internal parsing

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
                    // Invalid date, show error
                    alert(`Invalid date format: ${value}. Please use YYYY-MM-DD format.`);
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
