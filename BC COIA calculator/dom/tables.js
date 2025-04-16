import { formatCurrencyForDisplay, formatCurrencyForInput, formatCurrencyForInputWithCommas, formatDateLong, parseCurrency, parseDateInput, formatDateForInput, formatDateForDisplay, validateDateFormat } from '../utils.js';
import elements from './elements.js';
import { setupCustomDateInputListeners } from './setup.js';
import { setupCurrencyInputListeners } from './setup.js';
import { insertSpecialDamagesRowFromData, insertCalculatedRowIfNeeded } from './specialDamages.js';

/**
 * Updates an interest table (prejudgment or postjudgment) with calculated details.
 * Handles the new 5-column structure and separate total elements.
 * @param {HTMLTableSectionElement} tableBody - The tbody element of the table.
 * @param {HTMLElement|null} principalTotalElement - Element for principal total (null if not applicable).
 * @param {HTMLElement} interestTotalElement - Element for interest total.
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
                import('./specialDamages.js').then(module => {
                    module.insertSpecialDamagesRow(tableBody, currentRow, item.start);
                });
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
                    // Insert user row before currentRow with interest calculation details included
                    const insertedUserRow = insertSpecialDamagesRowFromData(tableBody, i, rowData, finalPeriodStartDate, mutableFinalPeriodDetails);
                    
                    inserted = true;
                    break; // Move to the next special damages row
                }
            }
            // If not inserted yet (it's the latest date among all rows), append at the end
            if (!inserted) {
                // Append the user row at the end with interest calculation details included
                const insertedUserRow = insertSpecialDamagesRowFromData(tableBody, -1, rowData, finalPeriodStartDate, mutableFinalPeriodDetails);
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
 * Updates the Summary table based on the Zustand store.
 * @param {object} store - The Zustand store.
 * @param {function} recalculateCallback - Function to call when editable fields change.
 */
export function updateSummaryTable(store, recalculateCallback) {
    if (!elements.summaryTableBody || !elements.summaryTotalLabelEl || !elements.summaryTotalEl || !elements.summaryPerDiemEl) {
        console.error("Missing Summary table elements for updateSummaryTable");
        return;
    }
    elements.summaryTableBody.innerHTML = ''; // Clear previous rows

    // Get state from Zustand store
    const storeState = store.getState();
    const inputs = storeState.inputs;
    const results = storeState.results;
    
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
