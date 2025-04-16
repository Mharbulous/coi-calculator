import { formatCurrencyForDisplay, formatCurrencyForInput, formatCurrencyForInputWithCommas, formatDateLong, parseCurrency, parseDateInput, formatDateForInput, formatDateForDisplay, validateDateFormat } from './utils.js';
import useStore from './store.js';

// --- DOM Element Selectors ---
// Using data attributes for more robust selection
export const elements = {
    // Inputs
    jurisdictionSelect: document.querySelector('[data-input="jurisdictionSelect"]'),
    fileNoInput: document.querySelector('[data-input="fileNo"]'),
    registryInput: document.querySelector('[data-input="registry"]'),
    showPrejudgmentCheckbox: document.querySelector('[data-input="showPrejudgmentCheckbox"]'),
    showPostjudgmentCheckbox: document.querySelector('[data-input="showPostjudgmentCheckbox"]'),
    showPerDiemCheckbox: document.querySelector('[data-input="showPerDiemCheckbox"]'),

    // Display Sections & Containers
    prejudgmentSection: document.querySelector('[data-display="prejudgmentSection"]'),
    postjudgmentSection: document.querySelector('[data-display="postjudgmentSection"]'),

    // Table Bodies
    prejudgmentTableBody: document.querySelector('[data-display="prejudgmentTableBody"]'),
    postjudgmentTableBody: document.querySelector('[data-display="postjudgmentTableBody"]'),
    summaryTableBody: document.querySelector('[data-display="summaryTableBody"]'),

    // Table Footers / Totals
    prejudgmentTotalLabel: document.querySelector('[data-display="prejudgmentTotalLabel"]'),
    prejudgmentPrincipalTotalEl: document.querySelector('[data-display="prejudgmentPrincipalTotal"]'),
    prejudgmentInterestTotalEl: document.querySelector('[data-display="prejudgmentInterestTotal"]'),
    postjudgmentInterestTotalEl: document.querySelector('[data-display="postjudgmentInterestTotal"]'),
    summaryTotalLabelEl: document.querySelector('[data-display="summaryTotalLabel"]'),
    summaryTotalEl: document.querySelector('[data-display="summaryTotal"]'),
    summaryPerDiemEl: document.querySelector('[data-display="summaryPerDiem"]'),

    // Containers (optional, if needed for broader manipulation)
    editableFieldsSection: document.querySelector('.editable-fields-section'),
    paperContainer: document.querySelector('.paper'),

    // Dynamically created inputs in summary table (will be selected after creation)
    pecuniaryJudgmentDateInput: null,
    pecuniaryJudgmentAmountInput: null,
    nonPecuniaryJudgmentDateInput: null,
    nonPecuniaryJudgmentAmountInput: null,
    costsAwardedDateInput: null,
    costsAwardedAmountInput: null,
    prejudgmentInterestDateInput: null,
    postjudgmentInterestDateInput: null,
};


/**
 * Retrieves the current values from the input fields, including those dynamically added to the summary table.
 * @returns {object} An object containing the parsed input values and validity status.
 */
export function getInputValues() {
    // Check if all required input elements are loaded (including dynamically created ones)
    const requiredStaticInputs = [
        elements.jurisdictionSelect, elements.showPrejudgmentCheckbox, elements.showPostjudgmentCheckbox
        // Note: fileNoInput and registryInput are not strictly required for calculation
    ];
     // Check dynamic inputs separately as they might not exist on initial load error
     const requiredDynamicInputs = [
         elements.pecuniaryJudgmentDateInput, elements.pecuniaryJudgmentAmountInput,
         elements.nonPecuniaryJudgmentAmountInput, // Only amount input is needed for Non-Pecuniary
         elements.costsAwardedAmountInput, // Only amount input is needed for Costs
         elements.prejudgmentInterestDateInput,
         elements.postjudgmentInterestDateInput
     ];

    // Check static inputs first
    if (requiredStaticInputs.some(el => !el)) {
        console.error("One or more essential static input/control elements not found in DOM.");
         return { isValid: false, validationMessage: "Initialization error: Missing static input elements." };
     }
     // If dynamic inputs don't exist when this is called, parsing/validation below will handle it.


    // Read from dynamic inputs, provide default empty string if elements don't exist yet
    const prejudgmentStartDateStr = elements.prejudgmentInterestDateInput ? elements.prejudgmentInterestDateInput.value : '';
    const postjudgmentEndDateStr = elements.postjudgmentInterestDateInput ? elements.postjudgmentInterestDateInput.value : '';
    const dateOfJudgmentStr = elements.pecuniaryJudgmentDateInput ? elements.pecuniaryJudgmentDateInput.value : '';
    const judgmentAwardedStr = elements.pecuniaryJudgmentAmountInput ? elements.pecuniaryJudgmentAmountInput.value : '';
    const nonPecuniaryAwardedStr = elements.nonPecuniaryJudgmentAmountInput ? elements.nonPecuniaryJudgmentAmountInput.value : '';
    const costsAwardedStr = elements.costsAwardedAmountInput ? elements.costsAwardedAmountInput.value : '';
    
    // For Non-Pecuniary and Costs dates, use the Pecuniary date since they're no longer editable
    const nonPecuniaryDateStr = dateOfJudgmentStr;
    const costsDateStr = dateOfJudgmentStr;


    const prejudgmentStartDate = parseDateInput(prejudgmentStartDateStr);
    const postjudgmentEndDate = parseDateInput(postjudgmentEndDateStr);
    const dateOfJudgment = parseDateInput(dateOfJudgmentStr);
    const nonPecuniaryJudgmentDate = parseDateInput(nonPecuniaryDateStr);
    const costsAwardedDate = parseDateInput(costsDateStr);
    const judgmentAwarded = parseCurrency(judgmentAwardedStr);
    const nonPecuniaryAwarded = parseCurrency(nonPecuniaryAwardedStr);
    const costsAwarded = parseCurrency(costsAwardedStr);
    const jurisdiction = elements.jurisdictionSelect.value;
    const showPrejudgment = elements.showPrejudgmentCheckbox.checked;
    const showPostjudgment = elements.showPostjudgmentCheckbox.checked;
    const showPerDiem = elements.showPerDiemCheckbox ? elements.showPerDiemCheckbox.checked : true;

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

    // Create the inputs object
    const inputs = {
        prejudgmentStartDate,
        postjudgmentEndDate,
        dateOfJudgment,
        nonPecuniaryJudgmentDate,
        costsAwardedDate,
        judgmentAwarded,
        nonPecuniaryAwarded,
        costsAwarded,
        jurisdiction,
        showPrejudgment,
        showPostjudgment,
        showPerDiem,
        isValid,
        validationMessage
    };
    
    // Update the Zustand store with the inputs
    useStore.getState().setInputs(inputs);
    
    return inputs;
}

/**
 * Updates an interest table (prejudgment or postjudgment) with calculated details.
 * Handles the new 5-column structure and separate total elements.
 * @param {HTMLTableSectionElement} tableBody - The tbody element of the table.
 * @param {HTMLElement|null} principalTotalElement - Element for principal total (null if not applicable).
 * @param {HTMLElement} interestTotalElement - Element for interest total.
 * @param {Array<object>} details - Array of interest period details (expects properties like start, description, rate, principal, interest).
 * @param {object} resultState - The state object containing details, total, principal, etc. (e.g., appState.results.prejudgmentResult).
 * @param {number|null} principalTotalForFooter - The specific principal total to display in the footer (used for prejudgment).
 */
export function updateInterestTable(tableBody, principalTotalElement, interestTotalElement, resultState, principalTotalForFooter) {
    if (!tableBody || !interestTotalElement || !resultState) {
        console.error("Missing required table elements or result state for updateInterestTable");
        return;
    }
    
    const { details = [], total: interestTotal = 0, finalPeriodDamageInterestDetails = [] } = resultState;
    // principalTotal is derived from principalTotalForFooter for the footer display
    const principalTotal = principalTotalForFooter;

    // Determine if this is the prejudgment table
    const isPrejudgmentTable = tableBody.id === 'prejudgmentTableBody' || 
                              tableBody.closest('table')?.id === 'prejudgmentTable';
    
    // If this is the prejudgment table, save any existing special damages rows
    const existingSpecialDamagesRows = [];
    if (isPrejudgmentTable) {
        const specialRows = tableBody.querySelectorAll('.special-damages-row');
        specialRows.forEach(row => {
            const dateInput = row.querySelector('.special-damages-date');
            const descInput = row.querySelector('.special-damages-description');
            const amountInput = row.querySelector('.special-damages-amount');
            
            if (dateInput && descInput && amountInput) {
                existingSpecialDamagesRows.push({
                    date: dateInput.value,
                    description: descInput.value.trim() || descInput.placeholder,
                    amount: amountInput.value
                });
            }
        });
    }
    
    // Clear previous rows
    tableBody.innerHTML = '';

    // Populate new rows (assuming 5 columns: Date/Period, Description, Rate, Principal, Interest)
    details.forEach(item => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = item.start; // Expect formatted date/period start
        
        // Description cell with potential button
        const descCell = row.insertCell();
        
        // Create a container for description and button
        const descriptionContainer = document.createElement('div');
        descriptionContainer.className = 'description-container';
        
        // Add the description text
        const descriptionText = document.createElement('span');
        descriptionText.textContent = item.description;
        descriptionContainer.appendChild(descriptionText);

        // Add the "add special damages" button only for regular period rows (not final period damage calc rows)
        // with interest in the prejudgment table
        if (isPrejudgmentTable && item.interest > 0 && !item.isFinalPeriodDamage) {
            const addButton = document.createElement('button');
            addButton.textContent = 'add special damages';
            addButton.className = 'add-special-damages-btn';
            addButton.dataset.date = item.start;
            addButton.dataset.amount = item.interest;
            
            // Add click event listener
            addButton.addEventListener('click', function(event) {
                event.preventDefault();
                console.log('Add special damages clicked for:', item);
                
                // Get the current row
                const currentRow = this.closest('tr');
                if (!currentRow) return;
                
                // Create a new special damages row
                insertSpecialDamagesRow(tableBody, currentRow, item.start);
            });
            
            descriptionContainer.appendChild(addButton);
        }
        
        descCell.appendChild(descriptionContainer);
        
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

    // Re-insert existing special damages rows in correct sorted order
    if (isPrejudgmentTable && existingSpecialDamagesRows.length > 0) {
        // Sort the special damages rows themselves by date first
        existingSpecialDamagesRows.sort((a, b) => {
            const dateA = parseDateInput(a.date); // YYYY-MM-DD
            const dateB = parseDateInput(b.date); // YYYY-MM-DD
            if (!dateA || !dateB) return 0;
            return dateA - dateB;
        });

        // Determine Final Period Start Date for comparison later
        let finalPeriodStartDate = null;
        if (details.length > 0) {
            const lastDetail = details[details.length - 1];
            // lastDetail.start is now in YYYY-MM-DD format from formatDateForDisplay
            finalPeriodStartDate = parseDateInput(lastDetail.start); // Use parseDateInput
        }
        // Make a mutable copy of the final period details for safe removal during iteration
        const mutableFinalPeriodDetails = [...finalPeriodDamageInterestDetails];


        existingSpecialDamagesRows.forEach(rowData => {
            let inserted = false;
            const newRowDate = parseDateInput(rowData.date); // YYYY-MM-DD (expects utils.js parseDateInput to handle this)
            if (!newRowDate) return; // Skip if date is invalid

            // Iterate through the *current* rows in the table body
            for (let i = 0; i < tableBody.rows.length; i++) {
                const currentRow = tableBody.rows[i];
                const currentRowDateCell = currentRow.cells[0];
                let currentRowDate = null;

                // Check if the current row is a special damages row (already re-inserted)
                const dateInput = currentRow.querySelector('.special-damages-date');
                if (dateInput) {
                    currentRowDate = parseDateInput(dateInput.value); // YYYY-MM-DD from input
                } else {
                    // Otherwise, it's a calculated row (YYYY-MM-DD text)
                    const dateStr = currentRowDateCell.textContent.trim();
                    currentRowDate = parseDateInput(dateStr); // Parse YYYY-MM-DD text
                    if (!currentRowDate) {
                        console.warn("Could not parse date from calculated row:", dateStr);
                    }
                }

                // If we have a valid date for the current row and the new row's date is earlier
                if (currentRowDate && newRowDate < currentRowDate) {
                    const insertedUserRow = insertSpecialDamagesRowFromData(tableBody, i, rowData); // Insert user row before currentRow
                    const referenceNode = currentRow; // The node to insert the calculated row before
                    insertCalculatedRowIfNeeded(tableBody, referenceNode, rowData, finalPeriodStartDate, mutableFinalPeriodDetails); // Pass referenceNode
                    inserted = true;
                    break; // Move to the next special damages row
                }
            }
            // If not inserted yet (it's the latest date among all rows), append at the end
            if (!inserted) {
                const insertedUserRow = insertSpecialDamagesRowFromData(tableBody, -1, rowData); // -1 appends user row
                const referenceNode = null; // No node to insert before, so it will append
                insertCalculatedRowIfNeeded(tableBody, referenceNode, rowData, finalPeriodStartDate, mutableFinalPeriodDetails); // Pass null referenceNode
            }
        });
    }


    // Update totals in the footer
    if (principalTotalElement && principalTotal !== null) {
        principalTotalElement.innerHTML = formatCurrencyForDisplay(principalTotal);
    }
    interestTotalElement.innerHTML = formatCurrencyForDisplay(interestTotal);
}


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
 * Updates the Summary table based on the application state.
 * Can use either the appState object or the Zustand store.
 * @param {object} state - The application state object containing inputs and results.
 * @param {function} recalculateCallback - Function to call when editable fields change.
 */
export function updateSummaryTable(state, recalculateCallback) {
    if (!elements.summaryTableBody || !elements.summaryTotalLabelEl || !elements.summaryTotalEl || !elements.summaryPerDiemEl) {
        console.error("Missing Summary table elements for updateSummaryTable");
        return;
    }
    elements.summaryTableBody.innerHTML = ''; // Clear previous rows

    // Determine if we're using appState or Zustand store
    let inputs, results;
    
    if (state.getState) {
        // Using Zustand store
        const storeState = state.getState();
        inputs = storeState.inputs;
        results = storeState.results;
    } else {
        // Using appState object
        inputs = state.inputs;
        results = state.results;
    }
    
    const { totalOwing, perDiem, finalCalculationDate } = results;
    const { prejudgmentResult, postjudgmentResult } = results;

    // Construct summary items from appState
    const items = [
        { item: 'Pecuniary Judgment', dateValue: inputs.dateOfJudgment, amount: inputs.judgmentAwarded, isEditable: true },
        { item: 'Non-Pecuniary Judgment', dateValue: inputs.nonPecuniaryJudgmentDate, amount: inputs.nonPecuniaryAwarded, isEditable: true },
        { item: 'Costs Awarded', dateValue: inputs.costsAwardedDate, amount: inputs.costsAwarded, isEditable: true },
        { item: 'Prejudgment Interest', dateValue: inputs.prejudgmentStartDate, amount: prejudgmentResult.total, isDateEditable: true },
        { item: 'Postjudgment Interest', dateValue: inputs.postjudgmentEndDate, amount: postjudgmentResult.total, isDateEditable: true },
    ];

    // Reset dynamic element references before recreating them
    elements.pecuniaryJudgmentDateInput = null;
    elements.pecuniaryJudgmentAmountInput = null;
    elements.nonPecuniaryJudgmentDateInput = null;
    elements.nonPecuniaryJudgmentAmountInput = null;
    elements.costsAwardedDateInput = null;
    elements.costsAwardedAmountInput = null;
    elements.prejudgmentInterestDateInput = null;
    elements.postjudgmentInterestDateInput = null;

    // Help text for tooltips
    const helpTexts = {
        'Pecuniary Judgment': "Enter the date that judgment was pronounced.",
        'Prejudgment Interest': "Enter the date that prejudgment interest accrues from. Prejudgment interest typically accrues from the date the cause of action accrued, but the judge may order that interest accrues from another date.",
        'Postjudgment Interest': "Enter the date to accrue postjudgment interest to. Typically this will be to today's date, but you may specify another date."
    };

    // Get template elements once
    const templatePecuniary = document.getElementById('summary-row-editable-pecuniary');
    const templateAmountOnly = document.getElementById('summary-row-editable-amount');
    const templateDateOnly = document.getElementById('summary-row-editable-date');
    const templateDisplayOnly = document.getElementById('summary-row-display-only');

    if (!templatePecuniary || !templateAmountOnly || !templateDateOnly || !templateDisplayOnly) {
        console.error("One or more summary table row templates not found in DOM.");
        return;
    }

    items.forEach(item => {
        let template;
        let rowClone;

        // 1. Determine which template to use
        if (item.isEditable && item.item === 'Pecuniary Judgment') {
            template = templatePecuniary;
        } else if (item.isEditable && (item.item === 'Non-Pecuniary Judgment' || item.item === 'Costs Awarded')) {
            template = templateAmountOnly;
        } else if (item.isDateEditable && (item.item === 'Prejudgment Interest' || item.item === 'Postjudgment Interest')) {
            template = templateDateOnly;
        } else {
            template = templateDisplayOnly; // Fallback or for non-editable items
        }

        // 2. Clone the template
        rowClone = template.content.cloneNode(true);

        // 3. Find elements within the clone
        const itemLabelContainer = rowClone.querySelector('[data-display="itemLabel"]');
        const itemTextSpan = rowClone.querySelector('[data-display="itemText"]');
        const helpIconSpan = rowClone.querySelector('[data-display="helpIcon"]');
        const tooltipSpan = rowClone.querySelector('[data-display="tooltipText"]');
        const dateInput = rowClone.querySelector('[data-input="dateValue"]');
        const amountInput = rowClone.querySelector('[data-input="amountValue"]');
        const dateDisplay = rowClone.querySelector('[data-display="dateValue"]');
        const amountDisplay = rowClone.querySelector('[data-display="amountValue"]');

        // 4. Populate Item Label and Help Text/Icon
        if (itemTextSpan) {
            itemTextSpan.textContent = item.item;
        }
        if (helpTexts[item.item] && helpIconSpan && tooltipSpan) {
            helpIconSpan.style.display = ''; // Make sure it's visible
            helpIconSpan.setAttribute('aria-label', `Help for ${item.item}`);
            tooltipSpan.textContent = helpTexts[item.item];
        } else if (helpIconSpan) {
            helpIconSpan.style.display = 'none'; // Hide if no help text
        }

        // 5. Populate Date and Amount (Inputs or Display) and Attach Listeners
        const formattedDate = item.dateValue instanceof Date ? formatDateForInput(item.dateValue) : item.dateValue;
        const formattedAmount = formatCurrencyForDisplay(item.amount); // For display-only cells
        const formattedAmountInputWithCommas = formatCurrencyForInputWithCommas(item.amount); // For input initial value

        if (template === templatePecuniary) {
            if (dateInput) {
                dateInput.value = formattedDate;
                setupCustomDateInputListeners(dateInput, recalculateCallback);
                elements.pecuniaryJudgmentDateInput = dateInput; // Store reference
            }
            if (amountInput) {
                amountInput.value = formattedAmountInputWithCommas; // Use comma format initially
                setupCurrencyInputListeners(amountInput, recalculateCallback);
                elements.pecuniaryJudgmentAmountInput = amountInput; // Store reference
            }
        } else if (template === templateAmountOnly) {
            if (dateDisplay) {
                 // Display the Pecuniary Judgment date (now YYYY-MM-DD) for Non-Pecuniary/Costs
                 const pecuniaryItem = items.find(i => i.item === 'Pecuniary Judgment');
                 const pecuniaryDateStr = pecuniaryItem && pecuniaryItem.dateValue instanceof Date ? formatDateForDisplay(pecuniaryItem.dateValue) : '';
                 dateDisplay.textContent = pecuniaryDateStr;
            }
            if (amountInput) {
                amountInput.value = formattedAmountInputWithCommas; // Use comma format initially
                setupCurrencyInputListeners(amountInput, recalculateCallback);
                if (item.item === 'Non-Pecuniary Judgment') {
                    elements.nonPecuniaryJudgmentAmountInput = amountInput; // Store reference
                } else if (item.item === 'Costs Awarded') {
                    elements.costsAwardedAmountInput = amountInput; // Store reference
                }
            }
             // Set null references for dates as they are not editable here
             if (item.item === 'Non-Pecuniary Judgment') elements.nonPecuniaryJudgmentDateInput = null;
             if (item.item === 'Costs Awarded') elements.costsAwardedDateInput = null;

        } else if (template === templateDateOnly) {
            if (dateInput) {
                dateInput.value = formattedDate;
                setupCustomDateInputListeners(dateInput, recalculateCallback);
                if (item.item === 'Prejudgment Interest') {
                    elements.prejudgmentInterestDateInput = dateInput; // Store reference
                } else if (item.item === 'Postjudgment Interest') {
                    elements.postjudgmentInterestDateInput = dateInput; // Store reference
                }
            }
            if (amountDisplay) {
                amountDisplay.innerHTML = formattedAmount; // Display calculated amount
            }
        } else { // templateDisplayOnly
            if (dateDisplay) {
                dateDisplay.textContent = formattedDate;
            }
            if (amountDisplay) {
                amountDisplay.innerHTML = formattedAmount;
            }
        }

        // 6. Append the populated clone to the table body
        elements.summaryTableBody.appendChild(rowClone);
    });

    // Update footer (remains the same)
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
    if (elements.postjudgmentTableBody) elements.postjudgmentTableBody.innerHTML = '';
    if (elements.summaryTableBody) elements.summaryTableBody.innerHTML = '';

    // Clear table footers/totals
    if (elements.prejudgmentPrincipalTotalEl) elements.prejudgmentPrincipalTotalEl.innerHTML = zeroCurrency;
    if (elements.prejudgmentInterestTotalEl) elements.prejudgmentInterestTotalEl.innerHTML = zeroCurrency;
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
    
    // Get the checked state from the DOM element
    const isChecked = elements.showPrejudgmentCheckbox.checked;
    
    // Update the DOM visibility
    elements.prejudgmentSection.style.display = isChecked ? '' : 'none';
    
    // Update the Zustand store (unless we're initializing)
    if (!isInitializing) {
        useStore.getState().setInput('showPrejudgment', isChecked);
    }

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
    
    // Get the checked state from the DOM element
    const isChecked = elements.showPostjudgmentCheckbox.checked;

    // Toggle visibility of the table section only
    elements.postjudgmentSection.style.display = isChecked ? '' : 'none';
    
    // Update the Zustand store (unless we're initializing)
    if (!isInitializing) {
        useStore.getState().setInput('showPostjudgment', isChecked);
    }

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
    
    // Get the checked state from the DOM element
    const isChecked = elements.showPerDiemCheckbox.checked;
    const perDiemRow = document.querySelector('.per-diem-row');
    
    if (perDiemRow) {
        perDiemRow.style.display = isChecked ? '' : 'none';
    }
    
    // Update the Zustand store (unless we're initializing)
    if (!isInitializing) {
        useStore.getState().setInput('showPerDiem', isChecked);
    }

    // Trigger recalculation unless it's the initial setup phase
    if (!isInitializing && typeof recalculateCallback === 'function') {
        recalculateCallback();
    }
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

/**
 * Inserts a new special damages row immediately after the specified row.
 * @param {HTMLTableSectionElement} tableBody - The tbody element of the table.
 * @param {HTMLTableRowElement} currentRow - The row after which to insert the new row.
 * @param {string} date - The date to pre-populate in the new row (YYYY-MM-DD format).
 */
function insertSpecialDamagesRow(tableBody, currentRow, date) {
    // Get the index of the current row
    const rowIndex = currentRow.rowIndex; // Use rowIndex directly for insertion after
    
    // Create a new row and insert it after the current row
    const newRow = tableBody.insertRow(rowIndex); // Insert at the correct index
    newRow.className = 'special-damages-row highlight-new-row';
    
    // Date cell (editable, pre-populated with the date from the current row)
    const dateCell = newRow.insertCell();
    const dateInput = document.createElement('input');
    dateInput.type = 'text';
    dateInput.className = 'special-damages-date custom-date-input';
    dateInput.dataset.type = 'special-damages-date';
    dateInput.placeholder = 'YYYY-MM-DD';
    
    // Passed date is already YYYY-MM-DD from formatDateForDisplay
    dateInput.value = date; 
    
    // Use the custom date input listeners
    setupCustomDateInputListeners(dateInput, function() {
        // When the date changes, trigger recalculation
        const event = new CustomEvent('special-damages-updated');
        document.dispatchEvent(event);
    });
    
    dateCell.appendChild(dateInput);
    dateCell.classList.add('text-left');
    
    // Description cell with placeholder
    const descCell = newRow.insertCell();
    const descInput = document.createElement('input');
    descInput.type = 'text';
    descInput.className = 'special-damages-description';
    descInput.placeholder = 'Describe special damages';
    descInput.dataset.type = 'special-damages-description';
    descCell.appendChild(descInput);
    descCell.classList.add('text-left');
    
    // Rate cell (empty)
    const rateCell = newRow.insertCell();
    rateCell.textContent = '';
    rateCell.classList.add('text-center');
    
    // Principal/Amount cell (editable)
    const principalCell = newRow.insertCell();
    const principalInput = document.createElement('input');
    principalInput.type = 'text';
    principalInput.className = 'special-damages-amount';
    principalInput.dataset.type = 'special-damages-amount';
    principalInput.value = '';
    setupCurrencyInputListeners(principalInput, function() {
        // When the amount changes, trigger recalculation
        // We need to access the recalculate function from calculator.js
        // For now, we'll dispatch a custom event that calculator.js can listen for
        const event = new CustomEvent('special-damages-updated');
        document.dispatchEvent(event);
    });
    principalCell.appendChild(principalInput);
    principalCell.classList.add('text-right');
    
    // Interest cell (empty)
    const interestCell = newRow.insertCell();
    interestCell.textContent = '';
    interestCell.classList.add('text-right');
    
    // Set focus to the description field
    setTimeout(() => {
        descInput.focus();
        
        // Remove highlight class after a delay
        setTimeout(() => {
            newRow.classList.remove('highlight-new-row');
        }, 2000);
    }, 100);
    
    // Trigger recalculation after adding the row
    const event = new CustomEvent('special-damages-updated');
    document.dispatchEvent(event);
}

/**
 * Helper function to insert a special damages row from saved data during table update.
 * @param {HTMLTableSectionElement} tableBody - The tbody element of the table.
 * @param {number} index - The index at which to insert the row (-1 to append).
 * @param {object} rowData - Object containing date (YYYY-MM-DD), description, and amount.
 * @returns {HTMLTableRowElement} The newly inserted row element.
 */
function insertSpecialDamagesRowFromData(tableBody, index, rowData) {
    const newRow = tableBody.insertRow(index);
    newRow.className = 'special-damages-row'; // No highlight on re-insertion

    // Date cell
    const dateCell = newRow.insertCell();
    const dateInput = document.createElement('input');
    dateInput.type = 'text';
    dateInput.className = 'special-damages-date custom-date-input';
    dateInput.dataset.type = 'special-damages-date';
    dateInput.placeholder = 'YYYY-MM-DD';
    dateInput.value = rowData.date; // Already in YYYY-MM-DD
    
    // Use the custom date input listeners
    setupCustomDateInputListeners(dateInput, function() {
        const event = new CustomEvent('special-damages-updated');
        document.dispatchEvent(event);
    });
    
    dateCell.appendChild(dateInput);
    dateCell.classList.add('text-left');

    // Description cell
    const descCell = newRow.insertCell();
    const descInput = document.createElement('input');
    descInput.type = 'text';
    descInput.className = 'special-damages-description';
    descInput.placeholder = 'Describe special damages';
    descInput.dataset.type = 'special-damages-description';
    descInput.value = (rowData.description === descInput.placeholder) ? '' : rowData.description; // Set value, handle placeholder case
    descCell.appendChild(descInput);
    descCell.classList.add('text-left');

    // Rate cell
    const rateCell = newRow.insertCell();
    rateCell.textContent = '';
    rateCell.classList.add('text-center');

    // Principal/Amount cell
    const principalCell = newRow.insertCell();
    const principalInput = document.createElement('input');
    principalInput.type = 'text';
    principalInput.className = 'special-damages-amount';
    principalInput.dataset.type = 'special-damages-amount';
    // Parse the stored value first, then format with commas for display
    const numericValue = parseCurrency(rowData.amount);
    principalInput.value = formatCurrencyForInputWithCommas(numericValue);
    setupCurrencyInputListeners(principalInput, function() {
        const event = new CustomEvent('special-damages-updated');
        document.dispatchEvent(event);
    });
    principalCell.appendChild(principalInput);
    principalCell.classList.add('text-right');

    // Interest cell
    const interestCell = newRow.insertCell();
    interestCell.textContent = '';
    interestCell.classList.add('text-right');

    return newRow; // Return the created row element
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
 * Helper function to insert the calculated special interest row if applicable, before a reference node.
 * @param {HTMLTableSectionElement} tableBody - The tbody element.
 * @param {Node|null} referenceNode - The node before which to insert the calculated row (null to append).
 * @param {object} rowData - The data object for the user-entered row that triggered this check.
 * @param {Date|null} finalPeriodStartDate - The start date of the final regular interest period.
 * @param {Array<object>} mutableFinalPeriodDetails - The mutable array of calculated final period interest details.
 */
function insertCalculatedRowIfNeeded(tableBody, referenceNode, rowData, finalPeriodStartDate, mutableFinalPeriodDetails) {
    // No need to check referenceNode here, insertBefore handles null correctly
    if (!finalPeriodStartDate || mutableFinalPeriodDetails.length === 0) {
        return; // Nothing to do if prerequisites are missing
    }

    const damageDate = parseDateInput(rowData.date); // Get Date object for comparison (expects YYYY-MM-DD)
    const damageAmount = parseCurrency(rowData.amount); // Get numeric amount for matching

    // Check if this damage falls within the final period
    if (damageDate && finalPeriodStartDate && damageDate >= finalPeriodStartDate) {
        // Find the matching calculated interest detail
        const detailIndex = mutableFinalPeriodDetails.findIndex(detail =>
            detail.damageDate.getTime() === damageDate.getTime() && // Match date precisely
            detail.principal === damageAmount // Match original principal amount
        );

        if (detailIndex > -1) {
            const calculatedDetail = mutableFinalPeriodDetails[detailIndex];

            // Create the calculated interest row
            const calculatedRow = document.createElement('tr'); // Create row element
            calculatedRow.classList.add('calculated-special-interest-row'); // Add a class for potential styling

            // Extract day count from description (e.g., "Description (123 days)" -> "123 days")
            const descriptionMatch = calculatedDetail.description.match(/\((\d+)\s+days\)/);
            const daysDescription = descriptionMatch ? `${descriptionMatch[1]} days` : ''; // Fallback to empty if no match

            calculatedRow.insertCell().textContent = calculatedDetail.start; // Formatted Date
            calculatedRow.insertCell().textContent = daysDescription; // Use extracted days description
            calculatedRow.insertCell().textContent = calculatedDetail.rate.toFixed(2) + '%'; // Rate
            calculatedRow.insertCell().innerHTML = ''; // Leave Principal blank
            calculatedRow.insertCell().innerHTML = formatCurrencyForDisplay(calculatedDetail.interest); // Calculated Interest

            // Apply text alignment
            calculatedRow.cells[0].classList.add('text-left'); // Date
            calculatedRow.cells[1].classList.add('text-right'); // Description (Right-aligned)
            calculatedRow.cells[2].classList.add('text-center'); // Rate
            calculatedRow.cells[3].classList.add('text-right'); // Principal (remains right, but content is blank)
            calculatedRow.cells[4].classList.add('text-right'); // Interest

            // Insert the row before the referenceNode (or append if referenceNode is null)
            tableBody.insertBefore(calculatedRow, referenceNode);

            // Remove the matched detail from the mutable array to prevent duplicate insertion
            mutableFinalPeriodDetails.splice(detailIndex, 1);
        }
    }
}
