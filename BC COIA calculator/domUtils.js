import { formatCurrencyForDisplay, formatCurrencyForInput, formatCurrencyForInputWithCommas, formatDateLong, parseCurrency, parseDateInput, formatDateForInput, formatDateForDisplay } from './utils.js';

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
        
        // Add the "add special damages" button only for rows with interest in prejudgment table
        if (isPrejudgmentTable && item.interest > 0) {
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

        existingSpecialDamagesRows.forEach(rowData => {
            let inserted = false;
            const newRowDate = parseDateInput(rowData.date); // YYYY-MM-DD
            if (!newRowDate) return; // Skip if date is invalid

            // Iterate through the *current* rows in the table body
            for (let i = 0; i < tableBody.rows.length; i++) {
                const currentRow = tableBody.rows[i];
                const currentRowDateCell = currentRow.cells[0];
                let currentRowDate = null;

                // Check if the current row is a special damages row (already re-inserted)
                const dateInput = currentRow.querySelector('.special-damages-date');
                if (dateInput) {
                    currentRowDate = parseDateInput(dateInput.value); // YYYY-MM-DD
                } else {
                    // Otherwise, it's a calculated row (DD/MM/YYYY text)
                    const dateStr = currentRowDateCell.textContent.trim();
                    const parts = dateStr.split('/');
                    if (parts.length === 3) {
                        // Ensure correct parsing for DD/MM/YYYY
                        const day = parseInt(parts[0], 10);
                        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
                        const year = parseInt(parts[2], 10);
                        const parsedDate = new Date(Date.UTC(year, month, day));
                        // Validate parsed date
                        if (!isNaN(parsedDate.getTime()) && parsedDate.getUTCDate() === day && parsedDate.getUTCMonth() === month && parsedDate.getUTCFullYear() === year) {
                             currentRowDate = parsedDate;
                        } else {
                             console.warn("Could not parse date from calculated row:", dateStr);
                        }
                    } else {
                         console.warn("Unexpected date format in calculated row:", dateStr);
                    }
                }

                // If we have a valid date for the current row and the new row's date is earlier
                if (currentRowDate && newRowDate < currentRowDate) {
                    insertSpecialDamagesRowFromData(tableBody, i, rowData); // Insert before this row
                    inserted = true;
                    break; // Move to the next special damages row
                }
            }
            // If not inserted yet (it's the latest date among all rows), append at the end
            if (!inserted) {
                insertSpecialDamagesRowFromData(tableBody, -1, rowData); // -1 appends
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
    const templateDisplayOnly = document.getElementById('summary-row-display-only'); // Added for completeness

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
                dateInput.addEventListener('change', recalculateCallback);
                elements.pecuniaryJudgmentDateInput = dateInput; // Store reference
            }
            if (amountInput) {
                amountInput.value = formattedAmountInputWithCommas; // Use comma format initially
                setupCurrencyInputListeners(amountInput, recalculateCallback);
                elements.pecuniaryJudgmentAmountInput = amountInput; // Store reference
            }
        } else if (template === templateAmountOnly) {
            if (dateDisplay) {
                 // Display the Pecuniary Judgment date for Non-Pecuniary/Costs
                 // We need access to the Pecuniary date here. Let's assume it's the first item's dateValue for now.
                 // A better approach might be to pass the pecuniary date explicitly or find it in the items array.
                 // For simplicity, let's find it:
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
                dateInput.addEventListener('change', recalculateCallback);
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
 * Inserts a new special damages row immediately after the specified row.
 * @param {HTMLTableSectionElement} tableBody - The tbody element of the table.
 * @param {HTMLTableRowElement} currentRow - The row after which to insert the new row.
 * @param {string} date - The date to pre-populate in the new row (DD/MM/YYYY format).
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
    dateInput.type = 'date';
    dateInput.className = 'special-damages-date';
    dateInput.dataset.type = 'special-damages-date';
    
    // Convert the passed date (DD/MM/YYYY) to YYYY-MM-DD for the input
    const dateParts = date.split('/');
    let inputDateValue = date; // Default fallback
    if (dateParts.length === 3) {
        const day = dateParts[0];
        const month = dateParts[1];
        const year = dateParts[2];
        inputDateValue = `${year}-${month}-${day}`;
    }
    dateInput.value = inputDateValue;
    
    dateInput.addEventListener('change', function() {
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
 */
function insertSpecialDamagesRowFromData(tableBody, index, rowData) {
    const newRow = tableBody.insertRow(index);
    newRow.className = 'special-damages-row'; // No highlight on re-insertion

    // Date cell
    const dateCell = newRow.insertCell();
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.className = 'special-damages-date';
    dateInput.dataset.type = 'special-damages-date';
    dateInput.value = rowData.date; // Already in YYYY-MM-DD
    dateInput.addEventListener('change', function() {
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
