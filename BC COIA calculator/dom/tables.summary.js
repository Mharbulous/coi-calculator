import { formatDateLong, formatDateForInput, formatDateForDisplay } from '../utils.date.js';
import { formatCurrencyForDisplay, formatCurrencyForInputWithCommas } from '../utils.currency.js';
import elements from './elements.js';
import { setupCustomDateInputListeners, setupCurrencyInputListeners, initializeDatePickers } from './setup.js';

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

    // Calculate total special damages
    const specialDamagesTotal = (results.specialDamages || []).reduce((total, damage) => total + damage.amount, 0);

    // Construct summary items from appState
    // For damage rows, we'll use empty strings for dateValue since the judgment date is now in the header
    const items = [
        { item: 'General Damages & Debt', dateValue: '', amount: inputs.judgmentAwarded, isEditable: true },
        { item: 'Special Damages', dateValue: '', amount: specialDamagesTotal, isDisplayOnly: true },
        { item: 'Non-pecuniary Damages', dateValue: '', amount: inputs.nonPecuniaryAwarded, isEditable: true },
        { item: 'Costs & Disbursements', dateValue: '', amount: inputs.costsAwarded, isEditable: true },
        { item: 'Prejudgment Interest', dateValue: inputs.prejudgmentStartDate, amount: prejudgmentResult.total, isDateEditable: true },
    ];
    
    // Only include postjudgment interest row if showPostjudgment is true
    if (inputs.showPostjudgment) {
        items.push({ 
            item: 'Postjudgment Interest', 
            dateValue: inputs.postjudgmentEndDate, 
            amount: postjudgmentResult.total, 
            isDateEditable: true 
        });
    }

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
        'General Damages & Debt': "Enter the date that judgment was pronounced.",
        'Prejudgment Interest': "Cause of Action Date. Prejudgment interest will start to accrue from this date.",
        'Postjudgment Interest': "Accrual Date.  Postjudgment interest will accrue up to this date."
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
        if (item.isEditable && item.item === 'General Damages & Debt') {
            template = templatePecuniary;
        } else if (item.isEditable && (item.item === 'Non-pecuniary Damages' || item.item === 'Costs & Disbursements')) {
            template = templateAmountOnly;
        } else if (item.isDateEditable && (item.item === 'Prejudgment Interest' || item.item === 'Postjudgment Interest')) {
            template = templateDateOnly;
        } else if (item.isDisplayOnly || item.item === 'Special Damages') {
            template = templateDisplayOnly; // For display-only items like Special Damages
        } else {
            template = templateDisplayOnly; // Fallback for any other items
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
        const dateLabelSpan = rowClone.querySelector('[data-display="dateLabel"]'); // Find the new label span

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
                
                // Add a special listener for the pecuniary judgment date input to sync with the judgment date input
                dateInput.addEventListener('blur', (event) => {
                    if (elements.judgmentDateInput) {
                        elements.judgmentDateInput.value = event.target.value;
                    }
                });
                
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
                 // Display the General Damages & Debt date (now YYYY-MM-DD) for Non-Pecuniary/Costs
                 const pecuniaryItem = items.find(i => i.item === 'General Damages & Debt');
                 const pecuniaryDateStr = pecuniaryItem && pecuniaryItem.dateValue instanceof Date ? formatDateForDisplay(pecuniaryItem.dateValue) : '';
                 dateDisplay.textContent = pecuniaryDateStr;
            }
            if (amountInput) {
                amountInput.value = formattedAmountInputWithCommas; // Use comma format initially
                setupCurrencyInputListeners(amountInput, recalculateCallback);
                if (item.item === 'Non-pecuniary Damages') {
                    elements.nonPecuniaryJudgmentAmountInput = amountInput; // Store reference
                } else if (item.item === 'Costs & Disbursements') {
                    elements.costsAwardedAmountInput = amountInput; // Store reference
                }
            }
             // Set null references for dates as they are not editable here
             if (item.item === 'Non-pecuniary Damages') elements.nonPecuniaryJudgmentDateInput = null;
             if (item.item === 'Costs & Disbursements') elements.costsAwardedDateInput = null;

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
                // Find the amount-value span within the container and set its content
                const amountValueSpan = amountDisplay.querySelector('.amount-value');
                if (amountValueSpan) {
                    amountValueSpan.innerHTML = formattedAmount; // Display calculated amount in the span
                } else {
                    amountDisplay.innerHTML = formattedAmount; // Fallback to the old way if span not found
                }
            }
            // Set the text for the "from"/"until" label
            if (dateLabelSpan) {
                if (item.item === 'Prejudgment Interest') {
                    dateLabelSpan.textContent = 'from';
                } else if (item.item === 'Postjudgment Interest') {
                    dateLabelSpan.textContent = 'until';
                } else {
                    dateLabelSpan.textContent = ''; // Clear for other rows using this template (if any)
                }
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

    // Update footer based on validation status
    if (results.validationError) {
        // Create a new row for the error message that spans multiple columns
        const totalRow = elements.summaryTotalLabelEl.closest('tr');
        if (totalRow) {
            // Hide the original total row
            totalRow.style.display = 'none';
            
            // Create a new row for the error message
            const errorRow = document.createElement('tr');
            errorRow.className = 'total-row';
            
            // Create a cell that spans from the middle to the end
            const errorCell = document.createElement('td');
            errorCell.colSpan = 3; // Span all columns
            errorCell.className = 'text-right'; // Right align the text
            errorCell.style.color = '#721c24'; // Red text color
            errorCell.style.fontWeight = 'bold';
            errorCell.textContent = 'One or more required dates are missing or invalid.';
            
            // Add the cell to the row
            errorRow.appendChild(errorCell);
            
            // Insert the error row before the per diem row
            const perDiemRow = elements.summaryPerDiemEl.closest('tr');
            if (perDiemRow && perDiemRow.parentNode) {
                perDiemRow.parentNode.insertBefore(errorRow, perDiemRow);
            }
        } else {
            // Fallback if we can't find the total row
            elements.summaryTotalLabelEl.textContent = '';
            elements.summaryTotalEl.textContent = 'One or more required dates are missing or invalid.';
            elements.summaryTotalEl.style.color = '#721c24'; // Red text color
            elements.summaryTotalEl.style.fontWeight = 'bold';
            elements.summaryTotalEl.style.textAlign = 'right'; // Right align the text
        }
        
        // Set per diem to zero
        elements.summaryPerDiemEl.innerHTML = formatCurrencyForDisplay(0);
    } else {
        // Normal display - make sure the original total row is visible
        const totalRow = elements.summaryTotalLabelEl.closest('tr');
        if (totalRow) {
            totalRow.style.display = ''; // Show the row
            
            // Remove any error row that might exist
            const tfoot = totalRow.parentNode;
            if (tfoot) {
                const errorRows = tfoot.querySelectorAll('tr:not(.total-row):not(.per-diem-row)');
                errorRows.forEach(row => row.remove());
            }
        }
        
        // Update the total row with the correct values
        const formattedAccrualDate = formatDateLong(finalCalculationDate);
        elements.summaryTotalLabelEl.textContent = `TOTAL AS OF ${formattedAccrualDate}`;
        elements.summaryTotalLabelEl.style.color = ''; // Reset to default color
        elements.summaryTotalEl.style.color = ''; // Reset to default color
        elements.summaryTotalEl.style.fontWeight = ''; // Reset to default font weight
        elements.summaryTotalEl.innerHTML = formatCurrencyForDisplay(totalOwing);
        elements.summaryPerDiemEl.innerHTML = formatCurrencyForDisplay(perDiem);
    }
    
    // Reinitialize datepickers to ensure they work with the dynamically created date inputs
    initializeDatePickers(recalculateCallback);
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
    // Don't clear the prejudgment principal total element as it contains the "Prejudgment Interest" text
    if (elements.prejudgmentInterestTotalEl) elements.prejudgmentInterestTotalEl.innerHTML = zeroCurrency;
    if (elements.postjudgmentInterestTotalEl) elements.postjudgmentInterestTotalEl.innerHTML = zeroCurrency;
    if (elements.summaryTotalEl) elements.summaryTotalEl.innerHTML = zeroCurrency;
    if (elements.summaryPerDiemEl) elements.summaryPerDiemEl.innerHTML = zeroCurrency;

    // Reset summary label
    if (elements.summaryTotalLabelEl) elements.summaryTotalLabelEl.textContent = 'TOTAL AS OF';
}
