import { formatCurrencyForDisplay, formatCurrencyForInput, formatDateLong, parseCurrency, parseDateInput, formatDateForInput } from './utils.js';

// --- DOM Element Selectors ---
// Using data attributes for more robust selection
export const elements = {
    // Inputs
    causeOfActionDateInput: document.querySelector('[data-input="causeOfActionDate"]'),
    dateOfJudgmentInput: document.querySelector('[data-input="dateOfJudgment"]'),
    dateOfCalculationInput: document.querySelector('[data-input="dateOfCalculation"]'),
    judgmentAwardedInput: document.querySelector('[data-input="judgmentAwarded"]'),
    nonPecuniaryAwardedInput: document.querySelector('[data-input="nonPecuniaryAwarded"]'), // Added
    costsAwardedInput: document.querySelector('[data-input="costsAwarded"]'),
    jurisdictionSelect: document.querySelector('[data-input="jurisdictionSelect"]'),
    fileNoInput: document.querySelector('[data-input="fileNo"]'),
    registryInput: document.querySelector('[data-input="registry"]'),
    showPrejudgmentCheckbox: document.querySelector('[data-input="showPrejudgmentCheckbox"]'), // Added
    showPostjudgmentCheckbox: document.querySelector('[data-input="showPostjudgmentCheckbox"]'),

    // Display Sections & Containers
    accrualDateRow: document.querySelector('[data-display="accrualDateRow"]'),
    prejudgmentSection: document.querySelector('[data-display="prejudgmentSection"]'), // Added
    postjudgmentSection: document.querySelector('[data-display="postjudgmentSection"]'),

    // Table Bodies
    prejudgmentTableBody: document.querySelector('[data-display="prejudgmentTableBody"]'),
    postjudgmentTableBody: document.querySelector('[data-display="postjudgmentTableBody"]'),
    summaryTableBody: document.querySelector('[data-display="summaryTableBody"]'), // Added

    // Table Footers / Totals
    prejudgmentPrincipalTotalEl: document.querySelector('[data-display="prejudgmentPrincipalTotal"]'), // Added
    prejudgmentInterestTotalEl: document.querySelector('[data-display="prejudgmentInterestTotal"]'), // Added (replaces prejudgmentSubtotalEl)
    postjudgmentInterestTotalEl: document.querySelector('[data-display="postjudgmentInterestTotal"]'), // Added (replaces postjudgmentSubtotalEl)
    summaryTotalLabelEl: document.querySelector('[data-display="summaryTotalLabel"]'), // Keep for text part
    summaryTotalEl: document.querySelector('[data-display="summaryTotal"]'), // Keep for amount part
    summaryPerDiemEl: document.querySelector('[data-display="summaryPerDiem"]'), // Added

    // Containers (optional, if needed for broader manipulation)
    editableFieldsSection: document.querySelector('.editable-fields-section'),
    paperContainer: document.querySelector('.paper'),
};

/**
 * Retrieves the current values from the input fields.
 * @returns {object} An object containing the parsed input values and validity status.
 */
export function getInputValues() {
    // Check if all required input elements are loaded
    const requiredInputs = [
        elements.causeOfActionDateInput, elements.dateOfJudgmentInput, elements.dateOfCalculationInput,
        elements.judgmentAwardedInput, elements.nonPecuniaryAwardedInput, elements.costsAwardedInput,
        elements.jurisdictionSelect, elements.showPrejudgmentCheckbox, elements.showPostjudgmentCheckbox
    ];
    if (requiredInputs.some(el => !el)) {
        console.error("One or more essential input elements not found in DOM.");
        return { isValid: false, validationMessage: "Initialization error: Missing input elements." };
    }

    const causeOfActionDateStr = elements.causeOfActionDateInput.value;
    const dateOfJudgmentStr = elements.dateOfJudgmentInput.value;
    const dateOfCalculationStr = elements.dateOfCalculationInput.value;
    const judgmentAwardedStr = elements.judgmentAwardedInput.value;
    const nonPecuniaryAwardedStr = elements.nonPecuniaryAwardedInput.value; // Added
    const costsAwardedStr = elements.costsAwardedInput.value;

    const causeOfActionDate = parseDateInput(causeOfActionDateStr);
    const dateOfJudgment = parseDateInput(dateOfJudgmentStr);
    const dateOfCalculation = parseDateInput(dateOfCalculationStr);
    const judgmentAwarded = parseCurrency(judgmentAwardedStr);
    const nonPecuniaryAwarded = parseCurrency(nonPecuniaryAwardedStr); // Added
    const costsAwarded = parseCurrency(costsAwardedStr);
    const jurisdiction = elements.jurisdictionSelect.value;
    const showPrejudgment = elements.showPrejudgmentCheckbox.checked; // Added
    const showPostjudgment = elements.showPostjudgmentCheckbox.checked;

    // --- Input Validation ---
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
        // Use the *actual* calculation date for this check, but only if postjudgment is shown
        if (showPostjudgment && dateOfCalculation < dateOfJudgment) {
            validationMessage = "Date of Calculation cannot be before Date of Judgment when showing Postjudgment Interest.";
            isValid = false;
        }
    }
     // Check all currency amounts
     if (judgmentAwarded < 0 || nonPecuniaryAwarded < 0 || costsAwarded < 0) {
         validationMessage = "Judgment, Non-pecuniary, and Costs amounts cannot be negative.";
         isValid = false;
     }

    return {
        causeOfActionDate,
        dateOfJudgment,
        dateOfCalculation,
        judgmentAwarded,
        nonPecuniaryAwarded, // Added
        costsAwarded,
        jurisdiction,
        showPrejudgment, // Added
        showPostjudgment,
        isValid,
        validationMessage
    };
}

/**
 * Updates an interest table (prejudgment or postjudgment) with calculated details.
 * Handles the new 5-column structure and separate total elements.
 * @param {HTMLTableSectionElement} tableBody - The tbody element of the table.
 * @param {HTMLElement|null} principalTotalElement - Element for principal total (null if not applicable).
 * @param {HTMLElement} interestTotalElement - Element for interest total.
 * @param {Array<object>} details - Array of interest period details (expects properties like start, description, rate, principal, interest).
 * @param {number|null} principalTotal - Total principal (null if not applicable).
 * @param {number} interestTotal - The total calculated interest for the table.
 */
export function updateInterestTable(tableBody, principalTotalElement, interestTotalElement, details, principalTotal, interestTotal) {
    if (!tableBody || !interestTotalElement) {
        console.error("Missing required table elements for updateInterestTable");
        return;
    }
    // Clear previous rows
    tableBody.innerHTML = '';

    // Populate new rows (assuming 5 columns: Date/Period, Description, Rate, Principal, Interest)
    details.forEach(item => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = item.start; // Expect formatted date/period start
        row.insertCell().textContent = item.description; // Expect description (e.g., days, period end)
        row.insertCell().textContent = item.rate.toFixed(2) + '%';
        row.insertCell().innerHTML = formatCurrencyForDisplay(item.principal); // Principal for the period
        row.insertCell().innerHTML = formatCurrencyForDisplay(item.interest); // Interest for the period

        // Apply text alignment via CSS classes (adjust indices if needed)
        row.cells[0].classList.add('text-left');   // Date/Period
        row.cells[1].classList.add('text-left');   // Description
        row.cells[2].classList.add('text-center'); // Rate
        row.cells[3].classList.add('text-right');  // Principal
        row.cells[4].classList.add('text-right');  // Interest
    });

    // Update totals in the footer
    if (principalTotalElement && principalTotal !== null) {
        principalTotalElement.innerHTML = formatCurrencyForDisplay(principalTotal);
    }
    interestTotalElement.innerHTML = formatCurrencyForDisplay(interestTotal);
}


/**
 * Updates the Summary table.
 * @param {Array<object>} items - Array of objects { item: string, dateValue: string, amount: number }.
 * @param {number} totalOwing - The final calculated total amount.
 * @param {number} perDiem - The calculated per diem rate.
 * @param {Date} finalCalculationDate - The date up to which the calculation runs.
 */
export function updateSummaryTable(items, totalOwing, perDiem, finalCalculationDate) {
    if (!elements.summaryTableBody || !elements.summaryTotalLabelEl || !elements.summaryTotalEl || !elements.summaryPerDiemEl) {
        console.error("Missing Summary table elements for updateSummaryTable");
        return;
    }
    elements.summaryTableBody.innerHTML = ''; // Clear previous rows

    items.forEach(item => {
        const row = elements.summaryTableBody.insertRow();
        row.insertCell().textContent = item.item;
        row.insertCell().textContent = item.dateValue; // Expect formatted date or value string
        row.insertCell().innerHTML = formatCurrencyForDisplay(item.amount);

        // Apply alignment (based on CSS)
        row.cells[0].classList.add('text-left');
        row.cells[1].classList.add('text-center');
        row.cells[2].classList.add('text-right');
    });

    // Update footer
    const formattedAccrualDate = formatDateLong(finalCalculationDate); // Use long date format
    elements.summaryTotalLabelEl.textContent = `TOTAL AS OF ${formattedAccrualDate}`;
    elements.summaryTotalEl.innerHTML = formatCurrencyForDisplay(totalOwing);
    elements.summaryPerDiemEl.innerHTML = formatCurrencyForDisplay(perDiem);
}


/**
 * Clears all calculation results from the tables and summary.
 */
export function clearResults() {
    const zeroCurrency = formatCurrencyForDisplay(0);

    // Clear table bodies
    if (elements.prejudgmentTableBody) elements.prejudgmentTableBody.innerHTML = '';
    // if (elements.judgmentTableBody) elements.judgmentTableBody.innerHTML = ''; // Removed
    if (elements.postjudgmentTableBody) elements.postjudgmentTableBody.innerHTML = '';
    if (elements.summaryTableBody) elements.summaryTableBody.innerHTML = '';

    // Clear table footers/totals
    if (elements.prejudgmentPrincipalTotalEl) elements.prejudgmentPrincipalTotalEl.innerHTML = zeroCurrency;
    if (elements.prejudgmentInterestTotalEl) elements.prejudgmentInterestTotalEl.innerHTML = zeroCurrency;
    // if (elements.judgmentTotalEl) elements.judgmentTotalEl.innerHTML = zeroCurrency; // Removed
    if (elements.postjudgmentInterestTotalEl) elements.postjudgmentInterestTotalEl.innerHTML = zeroCurrency;
    if (elements.summaryTotalEl) elements.summaryTotalEl.innerHTML = zeroCurrency;
    if (elements.summaryPerDiemEl) elements.summaryPerDiemEl.innerHTML = zeroCurrency;

    // Reset summary label
    if (elements.summaryTotalLabelEl) elements.summaryTotalLabelEl.textContent = 'TOTAL AS OF';
}

/**
 * Toggles the visibility of the prejudgment section based on the checkbox state.
 * @param {boolean} isInitializing - Flag to indicate if this is during initial page load.
 * @param {function|null} recalculateCallback - Function to call after toggling (usually recalculate).
 */
export function togglePrejudgmentVisibility(isInitializing = false, recalculateCallback) {
    if (!elements.showPrejudgmentCheckbox || !elements.prejudgmentSection) {
        console.error("Required elements for toggling prejudgment visibility not found.");
        return;
    }
    const isChecked = elements.showPrejudgmentCheckbox.checked;
    elements.prejudgmentSection.style.display = isChecked ? '' : 'none';

    // Trigger recalculation unless it's the initial setup phase
    if (!isInitializing && typeof recalculateCallback === 'function') {
        recalculateCallback();
    }
}


/**
 * Toggles the visibility of the postjudgment section based on the checkbox state.
 * Also updates the calculation date input value if hiding the section.
 * @param {boolean} isInitializing - Flag to indicate if this is during initial page load.
 * @param {function|null} recalculateCallback - Function to call after toggling (usually recalculate).
 */
export function togglePostjudgmentVisibility(isInitializing = false, recalculateCallback) {
    if (!elements.showPostjudgmentCheckbox || !elements.accrualDateRow || !elements.postjudgmentSection || !elements.dateOfCalculationInput || !elements.dateOfJudgmentInput) {
        console.error("Required elements for toggling postjudgment visibility not found.");
        return;
    }
    const isChecked = elements.showPostjudgmentCheckbox.checked;

    // Toggle visibility of the date row AND the section
    elements.accrualDateRow.style.display = isChecked ? '' : 'none';
    elements.postjudgmentSection.style.display = isChecked ? '' : 'none';

    // If hiding postjudgment, set calculation date to judgment date visually
    // Check if judgment date input exists before accessing its value
    if (!isChecked && elements.dateOfJudgmentInput.value) {
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
    const today = new Date();
    const todayStr = formatDateForInput(today);

    // Set default dates
    if (elements.causeOfActionDateInput && !elements.causeOfActionDateInput.value) {
        const defaultCauseDate = new Date(today);
        defaultCauseDate.setFullYear(today.getFullYear() - 2);
        elements.causeOfActionDateInput.value = formatDateForInput(defaultCauseDate);
    }
    if (elements.dateOfJudgmentInput && !elements.dateOfJudgmentInput.value) {
         const defaultJudgmentDate = new Date(today);
         defaultJudgmentDate.setMonth(today.getMonth() - 1);
         elements.dateOfJudgmentInput.value = formatDateForInput(defaultJudgmentDate);
    }
    if (elements.dateOfCalculationInput && !elements.dateOfCalculationInput.value) {
        elements.dateOfCalculationInput.value = todayStr;
    }

    // Format initial currency fields
    [elements.judgmentAwardedInput, elements.nonPecuniaryAwardedInput, elements.costsAwardedInput].forEach(input => { // Added nonPecuniary
        if (input) {
            const value = parseCurrency(input.value || '0'); // Default to 0 if empty
            input.value = formatCurrencyForInput(value);
        }
    });

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
