import { formatCurrencyForDisplay, formatCurrencyForInput, formatDateLong, parseCurrency, parseDateInput, formatDateForInput, formatDateForDisplay } from './utils.js';

// --- DOM Element Selectors ---
// Using data attributes for more robust selection
export const elements = {
    // Inputs
    // causeOfActionDateInput: document.querySelector('[data-input="causeOfActionDate"]'), // Removed - Moved to summary table (Prejudgment Interest Date)
    // dateOfJudgmentInput: document.querySelector('[data-input="dateOfJudgment"]'), // Removed - Moved to summary table
    // dateOfCalculationInput: document.querySelector('[data-input="dateOfCalculation"]'), // Removed - Moved to summary table (Postjudgment Interest Date)
    // judgmentAwardedInput: document.querySelector('[data-input="judgmentAwarded"]'), // Removed - Moved to summary table
    // nonPecuniaryAwardedInput: document.querySelector('[data-input="nonPecuniaryAwarded"]'), // Removed - Moved to summary table
    // costsAwardedInput: document.querySelector('[data-input="costsAwarded"]'), // Removed - Moved to summary table
    jurisdictionSelect: document.querySelector('[data-input="jurisdictionSelect"]'),
    fileNoInput: document.querySelector('[data-input="fileNo"]'),
    registryInput: document.querySelector('[data-input="registry"]'),
    showPrejudgmentCheckbox: document.querySelector('[data-input="showPrejudgmentCheckbox"]'), // Added
    showPostjudgmentCheckbox: document.querySelector('[data-input="showPostjudgmentCheckbox"]'),
    showPerDiemCheckbox: document.querySelector('[data-input="showPerDiemCheckbox"]'), // Added for per diem control

    // Display Sections & Containers
    // accrualDateRow: document.querySelector('[data-display="accrualDateRow"]'), // Removed - Date moved to summary table
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

    // Dynamically created inputs in summary table (will be selected after creation)
    pecuniaryJudgmentDateInput: null,
    pecuniaryJudgmentAmountInput: null,
    nonPecuniaryJudgmentDateInput: null, // Added for editable non-pecuniary date
    nonPecuniaryJudgmentAmountInput: null, // Added for editable non-pecuniary amount
    costsAwardedDateInput: null, // Added for editable costs date
    costsAwardedAmountInput: null, // Added for editable costs amount
    prejudgmentInterestDateInput: null, // Added for editable prejudgment start date
    postjudgmentInterestDateInput: null, // Added for editable postjudgment end date
};


/**
 * Retrieves the current values from the input fields, including those dynamically added to the summary table.
 * @returns {object} An object containing the parsed input values and validity status.
 */
export function getInputValues() {
    // Check if all required input elements are loaded (including dynamically created ones)
    const requiredStaticInputs = [
        // elements.causeOfActionDateInput, // Removed - Now dynamic (prejudgmentInterestDateInput)
        // elements.dateOfCalculationInput, // Removed - Now dynamic (postjudgmentInterestDateInput)
        // elements.nonPecuniaryAwardedInput, elements.costsAwardedInput, // Removed - Now dynamic
        elements.jurisdictionSelect, elements.showPrejudgmentCheckbox, elements.showPostjudgmentCheckbox
        // Note: fileNoInput and registryInput are not strictly required for calculation
    ];
     // Check dynamic inputs separately as they might not exist on initial load error
     const requiredDynamicInputs = [
         elements.pecuniaryJudgmentDateInput, elements.pecuniaryJudgmentAmountInput,
         elements.nonPecuniaryJudgmentAmountInput, // Only amount input is needed for Non-Pecuniary
         elements.costsAwardedAmountInput, // Only amount input is needed for Costs
         elements.prejudgmentInterestDateInput, // Added
         elements.postjudgmentInterestDateInput // Added
     ];

    // Check static inputs first
    if (requiredStaticInputs.some(el => !el)) {
        console.error("One or more essential static input/control elements not found in DOM.");
         return { isValid: false, validationMessage: "Initialization error: Missing static input elements." };
     }
     // Removed the early return check for dynamic inputs.
     // If they don't exist when this is called, parsing/validation below will handle it.


    // Read from dynamic inputs, provide default empty string if elements don't exist yet
    const prejudgmentStartDateStr = elements.prejudgmentInterestDateInput ? elements.prejudgmentInterestDateInput.value : ''; // Replaces causeOfActionDate
    const postjudgmentEndDateStr = elements.postjudgmentInterestDateInput ? elements.postjudgmentInterestDateInput.value : ''; // Replaces dateOfCalculation
    const dateOfJudgmentStr = elements.pecuniaryJudgmentDateInput ? elements.pecuniaryJudgmentDateInput.value : '';
    const judgmentAwardedStr = elements.pecuniaryJudgmentAmountInput ? elements.pecuniaryJudgmentAmountInput.value : '';
    const nonPecuniaryAwardedStr = elements.nonPecuniaryJudgmentAmountInput ? elements.nonPecuniaryJudgmentAmountInput.value : ''; // Read from dynamic
    const costsAwardedStr = elements.costsAwardedAmountInput ? elements.costsAwardedAmountInput.value : ''; // Read from dynamic
    
    // For Non-Pecuniary and Costs dates, use the Pecuniary date since they're no longer editable
    const nonPecuniaryDateStr = dateOfJudgmentStr;
    const costsDateStr = dateOfJudgmentStr;


    const prejudgmentStartDate = parseDateInput(prejudgmentStartDateStr); // Replaces causeOfActionDate
    const postjudgmentEndDate = parseDateInput(postjudgmentEndDateStr); // Replaces dateOfCalculation
    const dateOfJudgment = parseDateInput(dateOfJudgmentStr); // Parse from dynamic input (Pecuniary)
    const nonPecuniaryJudgmentDate = parseDateInput(nonPecuniaryDateStr); // Parse from dynamic input
    const costsAwardedDate = parseDateInput(costsDateStr); // Parse from dynamic input
    const judgmentAwarded = parseCurrency(judgmentAwardedStr); // Parse from dynamic input (Pecuniary)
    const nonPecuniaryAwarded = parseCurrency(nonPecuniaryAwardedStr); // Parse from dynamic input
    const costsAwarded = parseCurrency(costsAwardedStr); // Parse from dynamic input
    const jurisdiction = elements.jurisdictionSelect.value;
    const showPrejudgment = elements.showPrejudgmentCheckbox.checked; // Added
    const showPostjudgment = elements.showPostjudgmentCheckbox.checked;
    const showPerDiem = elements.showPerDiemCheckbox ? elements.showPerDiemCheckbox.checked : true; // Added for per diem control

    // --- Input Validation ---
    let isValid = true;
    let validationMessage = "";

    // --- Input Validation ---
    // Check all required dates exist (now includes dynamic interest dates)
    if (!prejudgmentStartDate || !dateOfJudgment || !nonPecuniaryJudgmentDate || !costsAwardedDate || !postjudgmentEndDate) {
        validationMessage = "One or more required dates (Prejudgment Start, Judgments, Postjudgment End) are missing or invalid.";
        isValid = false;
    } else {
        // Check judgment dates against prejudgment start date
        if (dateOfJudgment < prejudgmentStartDate) {
            validationMessage = "Pecuniary Judgment Date cannot be before Prejudgment Start Date.";
            isValid = false;
        }
        if (nonPecuniaryJudgmentDate < prejudgmentStartDate) {
            validationMessage = "Non-Pecuniary Judgment Date cannot be before Prejudgment Start Date.";
            isValid = false;
        }
        if (costsAwardedDate < prejudgmentStartDate) {
            validationMessage = "Costs Awarded Date cannot be before Prejudgment Start Date.";
            isValid = false;
        }

        // Use the *actual* postjudgment end date for this check, only if postjudgment is shown
        // Postjudgment interest runs from the *latest* of the judgment dates up to the postjudgment end date
        const latestJudgmentDate = new Date(Math.max(dateOfJudgment, nonPecuniaryJudgmentDate, costsAwardedDate));
        if (showPostjudgment && postjudgmentEndDate < latestJudgmentDate) {
            validationMessage = "Postjudgment End Date cannot be before the latest Judgment Date when showing Postjudgment Interest.";
            isValid = false;
        }
        // Also check that prejudgment start date is not after the earliest judgment date
        const earliestJudgmentDate = new Date(Math.min(dateOfJudgment, nonPecuniaryJudgmentDate, costsAwardedDate));
        if (prejudgmentStartDate > earliestJudgmentDate) {
             validationMessage = "Prejudgment Start Date cannot be after the earliest Judgment Date.";
             isValid = false;
        }

    }
     // Check all currency amounts (judgment amounts are dynamic, interest amounts are calculated)
     if (judgmentAwarded < 0 || nonPecuniaryAwarded < 0 || costsAwarded < 0) {
         validationMessage = "Pecuniary Judgment, Non-pecuniary, and Costs amounts cannot be negative.";
         isValid = false;
     }

    return {
        prejudgmentStartDate, // Replaces causeOfActionDate
        postjudgmentEndDate, // Replaces dateOfCalculation
        dateOfJudgment, // Pecuniary Judgment Date
        nonPecuniaryJudgmentDate, // Added
        costsAwardedDate, // Added
        judgmentAwarded, // Pecuniary Judgment Amount
        nonPecuniaryAwarded, // Non-Pecuniary Amount
        costsAwarded, // Costs Amount
        jurisdiction,
        showPrejudgment, // Added
        showPostjudgment,
        showPerDiem, // Added for per diem control
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
        const firstCell = row.insertCell();
        firstCell.textContent = item.start; // Expect formatted date/period start
        row.insertCell().textContent = item.description; // Expect description (e.g., days, period end)
        row.insertCell().textContent = item.rate.toFixed(2) + '%';
        row.insertCell().innerHTML = formatCurrencyForDisplay(item.principal); // Principal for the period
        row.insertCell().innerHTML = formatCurrencyForDisplay(item.interest); // Interest for the period

        // Add special button to prejudgment table rows
        if (tableBody.id === 'prejudgmentTableBody' || tableBody.closest('#prejudgmentTable')) {
            const specialButton = document.createElement('button');
            specialButton.className = 'special-button';
            
            // Create a bold element for the text
            const boldText = document.createElement('b');
            boldText.textContent = '+ special';
            specialButton.appendChild(boldText);
            
            specialButton.setAttribute('type', 'button');
            specialButton.setAttribute('aria-label', 'Add special interest');
            specialButton.addEventListener('click', function() {
                alert('Special interest button clicked');
                // Add actual functionality here
            });
            firstCell.appendChild(specialButton);
        }

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
 * Updates the Summary table, creating editable fields for Pecuniary Judgment.
 * @param {Array<object>} items - Array of objects { item: string, dateValue: Date | string, amount: number, isEditable?: boolean, inputType?: 'date'|'text', dataAttrDate?: string, dataAttrAmount?: string }.
 * @param {number} totalOwing - The final calculated total amount.
 * @param {number} perDiem - The calculated per diem rate.
 * @param {Date} finalCalculationDate - The date up to which the calculation runs.
 * @param {function} recalculateCallback - Function to call when editable fields change.
 */
export function updateSummaryTable(items, totalOwing, perDiem, finalCalculationDate, recalculateCallback) {
    if (!elements.summaryTableBody || !elements.summaryTotalLabelEl || !elements.summaryTotalEl || !elements.summaryPerDiemEl) {
        console.error("Missing Summary table elements for updateSummaryTable");
        return;
    }
    elements.summaryTableBody.innerHTML = ''; // Clear previous rows

    // Reset dynamic element references before recreating them
    elements.pecuniaryJudgmentDateInput = null;
    elements.pecuniaryJudgmentAmountInput = null;
    elements.nonPecuniaryJudgmentDateInput = null; // Added
    elements.nonPecuniaryJudgmentAmountInput = null; // Added
    elements.costsAwardedDateInput = null; // Added
    elements.costsAwardedAmountInput = null; // Added
    elements.prejudgmentInterestDateInput = null; // Added
    elements.postjudgmentInterestDateInput = null; // Added

    // Help text for tooltips
    const helpTexts = {
        'Pecuniary Judgment': "Enter the date that judgment was pronounced.",
        'Prejudgment Interest': "Enter the date that prejudgment interest accrues from. Prejudgment interest typically accrues from the date the cause of action accrued, but the judge may order that interest accrues from another date.",
        'Postjudgment Interest': "Enter the date to accrue postjudgment interest to. Typically this will be to today's date, but you may specify another date."
    };

    items.forEach(item => {
        const row = elements.summaryTableBody.insertRow();
        const cellItem = row.insertCell();
        const cellDate = row.insertCell();
        const cellAmount = row.insertCell();

        // Create label with help icon for specific items
        if (helpTexts[item.item]) {
            const labelSpan = document.createElement('span');
            labelSpan.textContent = item.item;
            
            const helpIcon = document.createElement('span');
            helpIcon.className = 'help-icon';
            helpIcon.textContent = '?';
            helpIcon.setAttribute('tabindex', '0'); // Make focusable for accessibility
            helpIcon.setAttribute('role', 'button');
            helpIcon.setAttribute('aria-label', `Help for ${item.item}`);
            
            const tooltip = document.createElement('span');
            tooltip.className = 'tooltip';
            tooltip.textContent = helpTexts[item.item];
            
            helpIcon.appendChild(tooltip);
            
            cellItem.appendChild(labelSpan);
            cellItem.appendChild(helpIcon);
        } else {
            cellItem.textContent = item.item;
        }

        if (item.isEditable && item.item === 'Pecuniary Judgment') {
            // Create Date Input
            const dateInput = document.createElement('input');
            dateInput.type = 'date';
            dateInput.dataset.input = 'pecuniaryJudgmentDate'; // Use specific data attribute
            dateInput.value = item.dateValue instanceof Date ? formatDateForInput(item.dateValue) : item.dateValue;
            dateInput.addEventListener('change', recalculateCallback); // Add listener
            cellDate.appendChild(dateInput);
            elements.pecuniaryJudgmentDateInput = dateInput; // Store reference

            // Create Amount Input
            const amountInput = document.createElement('input');
            amountInput.type = 'text'; // Use text for currency formatting
            amountInput.dataset.input = 'pecuniaryJudgmentAmount'; // Use specific data attribute
            amountInput.value = formatCurrencyForInput(item.amount); // Format initial value
            setupCurrencyInputListeners(amountInput, recalculateCallback); // Setup currency listeners
            cellAmount.appendChild(amountInput);
            elements.pecuniaryJudgmentAmountInput = amountInput; // Store reference

        } else if (item.isEditable && item.item === 'Non-Pecuniary Judgment') {
            // Leave date cell empty for Non-Pecuniary Judgment
            elements.nonPecuniaryJudgmentDateInput = null; // No date input reference

            // Create Amount Input for Non-Pecuniary (keep amount editable)
            const amountInput = document.createElement('input');
            amountInput.type = 'text';
            amountInput.dataset.input = 'nonPecuniaryJudgmentAmount'; // Specific data attribute
            amountInput.value = formatCurrencyForInput(item.amount);
            setupCurrencyInputListeners(amountInput, recalculateCallback);
            cellAmount.appendChild(amountInput);
            elements.nonPecuniaryJudgmentAmountInput = amountInput; // Store reference

        } else if (item.isEditable && item.item === 'Costs Awarded') {
            // Leave date cell empty for Costs Awarded
            elements.costsAwardedDateInput = null; // No date input reference

            // Create Amount Input for Costs (keep amount editable)
            const amountInput = document.createElement('input');
            amountInput.type = 'text';
            amountInput.dataset.input = 'costsAwardedAmount'; // Specific data attribute
            amountInput.value = formatCurrencyForInput(item.amount);
            setupCurrencyInputListeners(amountInput, recalculateCallback);
            cellAmount.appendChild(amountInput);
            elements.costsAwardedAmountInput = amountInput; // Store reference

        } else if (item.isDateEditable && item.item === 'Prejudgment Interest') {
             // Create Date Input for Prejudgment Start Date
             const dateInput = document.createElement('input');
             dateInput.type = 'date';
             dateInput.dataset.input = 'prejudgmentInterestDate'; // Specific data attribute
             dateInput.value = item.dateValue instanceof Date ? formatDateForInput(item.dateValue) : item.dateValue;
             dateInput.addEventListener('change', recalculateCallback);
             cellDate.appendChild(dateInput);
             elements.prejudgmentInterestDateInput = dateInput; // Store reference
             // Amount is calculated, not editable
             cellAmount.innerHTML = formatCurrencyForDisplay(item.amount);

        } else if (item.isDateEditable && item.item === 'Postjudgment Interest') {
             // Create Date Input for Postjudgment End Date
             const dateInput = document.createElement('input');
             dateInput.type = 'date';
             dateInput.dataset.input = 'postjudgmentInterestDate'; // Specific data attribute
             dateInput.value = item.dateValue instanceof Date ? formatDateForInput(item.dateValue) : item.dateValue;
             dateInput.addEventListener('change', recalculateCallback);
             cellDate.appendChild(dateInput);
             elements.postjudgmentInterestDateInput = dateInput; // Store reference
             // Amount is calculated, not editable
             cellAmount.innerHTML = formatCurrencyForDisplay(item.amount);

        } else {
            // Fully non-editable rows (currently none, but could be added)
            cellDate.textContent = item.dateValue instanceof Date ? formatDateForInput(item.dateValue) : item.dateValue; // Format date if needed
            cellAmount.innerHTML = formatCurrencyForDisplay(item.amount);
        }

        // Apply alignment (based on CSS)
        cellItem.classList.add('text-left');
        cellDate.classList.add('text-center');
        cellAmount.classList.add('text-right');
    });

    // Update footer
    const formattedAccrualDate = formatDateLong(finalCalculationDate);
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
 * Only hides the table part, not the section title or checkbox.
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
 * Only hides the table part, not the section title or checkbox.
 * @param {boolean} isInitializing - Flag to indicate if this is during initial page load.
 * @param {function|null} recalculateCallback - Function to call after toggling (usually recalculate).
 */
export function togglePostjudgmentVisibility(isInitializing = false, recalculateCallback) {
    if (!elements.showPostjudgmentCheckbox || !elements.postjudgmentSection) {
        console.error("Required elements for toggling postjudgment visibility not found.");
        return;
    }
    const isChecked = elements.showPostjudgmentCheckbox.checked;

    // Toggle visibility of the table section only
    elements.postjudgmentSection.style.display = isChecked ? '' : 'none';

    // Trigger recalculation unless it's the initial setup phase
    if (!isInitializing && typeof recalculateCallback === 'function') {
        recalculateCallback();
    }
}

/**
 * Toggles the visibility of the per diem row based on the checkbox state.
 * @param {boolean} isInitializing - Flag to indicate if this is during initial page load.
 * @param {function|null} recalculateCallback - Function to call after toggling (usually recalculate).
 */
export function togglePerDiemVisibility(isInitializing = false, recalculateCallback) {
    if (!elements.showPerDiemCheckbox) {
        console.error("Required elements for toggling per diem visibility not found.");
        return;
    }
    
    const isChecked = elements.showPerDiemCheckbox.checked;
    const perDiemRow = document.querySelector('.per-diem-row');
    
    if (perDiemRow) {
        perDiemRow.style.display = isChecked ? '' : 'none';
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
    // const today = new Date(); // No longer needed here
    // const todayStr = formatDateForInput(today); // No longer needed here

    // Removed setting default dates for causeOfActionDateInput and dateOfCalculationInput
    // These defaults are now handled during the initial summary table population in calculator.js

    // Removed formatting for static nonPecuniaryAwardedInput and costsAwardedInput
    // Their values will be set and formatted when the summary table is initially populated

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
