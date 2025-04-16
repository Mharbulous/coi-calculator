import { formatCurrencyForDisplay, formatCurrencyForInput, formatCurrencyForInputWithCommas, formatDateLong, parseCurrency, parseDateInput, formatDateForInput, formatDateForDisplay, validateDateFormat } from '../utils.js';
import elements from './elements.js';
import useStore from '../store.js';

/**
 * Sets up event listeners for custom date input fields.
 * @param {HTMLInputElement} inputElement - The date input element.
 * @param {function} changeCallback - The function to call after validation.
 */
export function setupCustomDateInputListeners(inputElement, changeCallback) {
    if (!inputElement) return;

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

    // Handle Enter key
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
