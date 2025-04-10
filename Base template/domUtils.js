import { formatCurrencyForDisplay, formatCurrencyForInput, formatDateLong, parseCurrency, parseDateInput, formatDateForInput } from './utils.js';

// --- DOM Element Selectors ---
// Using data attributes for more robust selection
export const elements = {
    // Inputs
    causeOfActionDateInput: document.querySelector('[data-input="causeOfActionDate"]'),
    dateOfJudgmentInput: document.querySelector('[data-input="dateOfJudgment"]'),
    dateOfCalculationInput: document.querySelector('[data-input="dateOfCalculation"]'),
    judgmentAwardedInput: document.querySelector('[data-input="judgmentAwarded"]'),
    costsAwardedInput: document.querySelector('[data-input="costsAwarded"]'),
    jurisdictionSelect: document.querySelector('[data-input="jurisdictionSelect"]'),
    fileNoInput: document.querySelector('[data-input="fileNo"]'),
    registryInput: document.querySelector('[data-input="registry"]'),
    showPostjudgmentCheckbox: document.querySelector('[data-input="showPostjudgmentCheckbox"]'),

    // Display Areas & Tables
    accrualDateRow: document.querySelector('[data-display="accrualDateRow"]'),
    postjudgmentSection: document.querySelector('[data-display="postjudgmentSection"]'),
    prejudgmentTableBody: document.querySelector('[data-display="prejudgmentTableBody"]'),
    prejudgmentSubtotalEl: document.querySelector('[data-display="prejudgmentSubtotal"]'),
    postjudgmentTableBody: document.querySelector('[data-display="postjudgmentTableBody"]'),
    postjudgmentSubtotalEl: document.querySelector('[data-display="postjudgmentSubtotal"]'),
    summaryTotalLabelEl: document.querySelector('[data-display="summaryTotalLabel"]'),
    summaryTotalEl: document.querySelector('[data-display="summaryTotal"]'),

    // Containers (optional, if needed for broader manipulation)
    editableFieldsSection: document.querySelector('.editable-fields-section'),
    paperContainer: document.querySelector('.paper'),
};

/**
 * Retrieves the current values from the input fields.
 * @returns {object} An object containing the parsed input values.
 */
export function getInputValues() {
    // Basic check if elements are loaded
    if (!elements.causeOfActionDateInput || !elements.dateOfJudgmentInput || !elements.dateOfCalculationInput || !elements.judgmentAwardedInput || !elements.costsAwardedInput || !elements.jurisdictionSelect || !elements.showPostjudgmentCheckbox) {
        console.error("One or more essential input elements not found in DOM.");
        // Return default/empty values or throw error
        return {
            causeOfActionDate: null,
            dateOfJudgment: null,
            dateOfCalculation: null,
            judgmentAwarded: 0,
            costsAwarded: 0,
            jurisdiction: 'BC', // Default or first option
            showPostjudgment: true, // Default state
            isValid: false // Indicate failure
        };
    }

    const causeOfActionDateStr = elements.causeOfActionDateInput.value;
    const dateOfJudgmentStr = elements.dateOfJudgmentInput.value;
    const dateOfCalculationStr = elements.dateOfCalculationInput.value;
    const judgmentAwardedStr = elements.judgmentAwardedInput.value;
    const costsAwardedStr = elements.costsAwardedInput.value;

    const causeOfActionDate = parseDateInput(causeOfActionDateStr);
    const dateOfJudgment = parseDateInput(dateOfJudgmentStr);
    const dateOfCalculation = parseDateInput(dateOfCalculationStr);
    const judgmentAwarded = parseCurrency(judgmentAwardedStr);
    const costsAwarded = parseCurrency(costsAwardedStr);
    const jurisdiction = elements.jurisdictionSelect.value;
    const showPostjudgment = elements.showPostjudgmentCheckbox.checked;

    // --- Basic Input Validation ---
    let isValid = true;
    let validationMessage = "";

    if (!causeOfActionDate || !dateOfJudgment || !dateOfCalculation) {
        validationMessage = "One or more dates are missing or invalid.";
        isValid = false;
    } else {
        if (dateOfJudgment < causeOfActionDate) {
            validationMessage = "Date of Judgment cannot be before Cause of Action Date.";
            isValid = false;
        }
        // Use the *actual* calculation date for this check
        if (dateOfCalculation < dateOfJudgment) {
            validationMessage = "Date of Calculation cannot be before Date of Judgment.";
            isValid = false;
        }
    }
     if (judgmentAwarded < 0 || costsAwarded < 0) {
         validationMessage = "Judgment and Costs amounts cannot be negative.";
         isValid = false;
     }

    return {
        causeOfActionDate,
        dateOfJudgment,
        dateOfCalculation,
        judgmentAwarded,
        costsAwarded,
        jurisdiction,
        showPostjudgment,
        isValid,
        validationMessage
    };
}

/**
 * Updates an interest table (prejudgment or postjudgment) with calculated details.
 * @param {HTMLTableSectionElement} tableBody - The tbody element of the table.
 * @param {HTMLElement} subtotalElement - The element to display the subtotal.
 * @param {Array<object>} details - Array of interest period details.
 * @param {number} totalInterest - The total calculated interest for the table.
 */
export function updateInterestTable(tableBody, subtotalElement, details, totalInterest) {
    if (!tableBody || !subtotalElement) {
        console.error("Missing table elements for updateInterestTable");
        return;
    }
    // Clear previous rows
    tableBody.innerHTML = '';

    // Populate new rows
    details.forEach(item => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = item.start; // Formatted in calculations.js
        row.insertCell().textContent = item.end;   // Formatted in calculations.js
        row.insertCell().textContent = item.rate.toFixed(2) + '%';
        row.insertCell().textContent = item.days;
        row.insertCell().innerHTML = formatCurrencyForDisplay(item.interest); // Use currency formatter

        // Apply text alignment via CSS classes for better separation of concerns
        row.cells[0].classList.add('text-left');
        row.cells[1].classList.add('text-center');
        row.cells[2].classList.add('text-center');
        row.cells[3].classList.add('text-center');
        row.cells[4].classList.add('text-right');
    });

    // Update subtotal
    subtotalElement.innerHTML = formatCurrencyForDisplay(totalInterest);
}

/**
 * Updates the summary section with the total amount owing and the relevant date.
 * @param {number} totalOwing - The final calculated total amount.
 * @param {Date} finalCalculationDate - The date up to which the calculation runs.
 */
export function updateSummary(totalOwing, finalCalculationDate) {
    if (!elements.summaryTotalEl || !elements.summaryTotalLabelEl) {
        console.error("Missing summary elements for updateSummary");
        return;
    }
    elements.summaryTotalEl.innerHTML = formatCurrencyForDisplay(totalOwing);

    const formattedAccrualDate = formatDateLong(finalCalculationDate); // Use long date format
    elements.summaryTotalLabelEl.textContent = `TOTAL OWING as of ${formattedAccrualDate}`;
}

/**
 * Clears all calculation results from the tables and summary.
 */
export function clearResults() {
    if (elements.prejudgmentTableBody) elements.prejudgmentTableBody.innerHTML = '';
    if (elements.prejudgmentSubtotalEl) elements.prejudgmentSubtotalEl.innerHTML = formatCurrencyForDisplay(0);
    if (elements.postjudgmentTableBody) elements.postjudgmentTableBody.innerHTML = '';
    if (elements.postjudgmentSubtotalEl) elements.postjudgmentSubtotalEl.innerHTML = formatCurrencyForDisplay(0);
    if (elements.summaryTotalEl) elements.summaryTotalEl.innerHTML = formatCurrencyForDisplay(0);
    if (elements.summaryTotalLabelEl) elements.summaryTotalLabelEl.textContent = 'TOTAL OWING';
}


/**
 * Toggles the visibility of the postjudgment section based on the checkbox state.
 * Also updates the calculation date input value if hiding the section.
 * @param {boolean} isInitializing - Flag to indicate if this is during initial page load.
 * @param {function} recalculateCallback - Function to call after toggling (usually recalculate).
 */
export function togglePostjudgmentVisibility(isInitializing = false, recalculateCallback) {
    if (!elements.showPostjudgmentCheckbox || !elements.accrualDateRow || !elements.postjudgmentSection || !elements.dateOfCalculationInput || !elements.dateOfJudgmentInput) {
        console.error("Required elements for toggling postjudgment visibility not found.");
        return;
    }
    const isChecked = elements.showPostjudgmentCheckbox.checked;

    elements.accrualDateRow.style.display = isChecked ? '' : 'none';
    elements.postjudgmentSection.style.display = isChecked ? '' : 'none';

    // If hiding postjudgment, set calculation date to judgment date
    if (!isChecked) {
        elements.dateOfCalculationInput.value = elements.dateOfJudgmentInput.value;
    }

    // Trigger recalculation unless it's the initial setup phase
    if (!isInitializing && typeof recalculateCallback === 'function') {
        recalculateCallback();
    }
}

/**
 * Sets the default values for input fields on page load.
 */
export function setDefaultInputValues() {
    // Example defaults (can be adjusted or made dynamic)
    const today = new Date(); // Use local time to get today's date correctly for the input format
    const todayStr = formatDateForInput(today); // Format as YYYY-MM-DD

    // Set default dates only if elements exist and are empty
    if (elements.causeOfActionDateInput && !elements.causeOfActionDateInput.value) {
        // Example: Default cause of action 2 years before today
        const defaultCauseDate = new Date(today);
        defaultCauseDate.setFullYear(today.getFullYear() - 2);
        elements.causeOfActionDateInput.value = formatDateForInput(defaultCauseDate);
    }
    if (elements.dateOfJudgmentInput && !elements.dateOfJudgmentInput.value) {
         // Example: Default judgment date 1 month before today
         const defaultJudgmentDate = new Date(today);
         defaultJudgmentDate.setMonth(today.getMonth() - 1);
         elements.dateOfJudgmentInput.value = formatDateForInput(defaultJudgmentDate);
    }
    if (elements.dateOfCalculationInput && !elements.dateOfCalculationInput.value) {
        elements.dateOfCalculationInput.value = todayStr; // Default to today
    }

    // Format initial currency fields if they exist and have a value
    [elements.judgmentAwardedInput, elements.costsAwardedInput].forEach(input => {
        if (input && input.value) {
            const value = parseCurrency(input.value);
            input.value = formatCurrencyForInput(value); // Use input-specific format
        } else if (input && !input.value) {
             // Optionally set default 0 value
             // input.value = formatCurrencyForInput(0);
        }
    });

     // Set default jurisdiction if needed
     if (elements.jurisdictionSelect && !elements.jurisdictionSelect.value) {
         elements.jurisdictionSelect.value = 'BC'; // Or the first option
     }
     // Set default checkbox state if needed
     if (elements.showPostjudgmentCheckbox && !elements.showPostjudgmentCheckbox.checked) {
         // elements.showPostjudgmentCheckbox.checked = true; // Default to showing postjudgment
     }
}

/**
 * Sets up event listeners for currency input fields (blur, focus, Enter key).
 * @param {HTMLInputElement} inputElement - The currency input element.
 * @param {function} recalculateCallback - The function to call after formatting.
 */
export function setupCurrencyInputListeners(inputElement, recalculateCallback) {
    if (!inputElement) return;

    inputElement.addEventListener('blur', (event) => {
        let value = parseCurrency(event.target.value);
        event.target.value = formatCurrencyForInput(value); // Format on blur
        if (typeof recalculateCallback === 'function') {
            recalculateCallback();
        }
    });

    inputElement.addEventListener('focus', (event) => {
        // Select contents on focus for easy replacement
        event.target.select();
    });

    inputElement.addEventListener('keyup', (event) => {
        // Recalculate and format on Enter key
        if (event.key === 'Enter') {
            let value = parseCurrency(event.target.value);
            event.target.value = formatCurrencyForInput(value);
            if (typeof recalculateCallback === 'function') {
                recalculateCallback();
            }
            event.target.blur(); // Remove focus after Enter
        }
    });
}
