import { formatCurrencyForDisplay, formatCurrencyForInput, formatCurrencyForInputWithCommas, formatDateLong, parseCurrency, parseDateInput, formatDateForInput, formatDateForDisplay, validateDateFormat } from '../utils.js';
import { setupCustomDateInputListeners, setupCurrencyInputListeners } from './setup.js';

/**
 * Inserts a new special damages row immediately after the specified row.
 * @param {HTMLTableSectionElement} tableBody - The tbody element of the table.
 * @param {HTMLTableRowElement} currentRow - The row after which to insert the new row.
 * @param {string} date - The date to pre-populate in the new row (YYYY-MM-DD format).
 */
export function insertSpecialDamagesRow(tableBody, currentRow, date) {
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
 * @param {Date|null} finalPeriodStartDate - The start date of the final regular interest period.
 * @param {Array<object>} mutableFinalPeriodDetails - The mutable array of calculated final period interest details.
 * @returns {HTMLTableRowElement} The newly inserted row element.
 */
export function insertSpecialDamagesRowFromData(tableBody, index, rowData, finalPeriodStartDate, mutableFinalPeriodDetails) {
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
    
    // Store the calculated detail for later use
    let calculatedDetail = null;
    
    // Find the matching calculated interest detail if applicable
    if (finalPeriodStartDate && mutableFinalPeriodDetails && mutableFinalPeriodDetails.length > 0) {
        const damageDate = parseDateInput(rowData.date);
        const damageAmount = parseCurrency(rowData.amount);
        
        // Check if this damage falls within the final period
        if (damageDate && finalPeriodStartDate && damageDate >= finalPeriodStartDate) {
            // Find the matching calculated interest detail
            const detailIndex = mutableFinalPeriodDetails.findIndex(detail =>
                detail.damageDate.getTime() === damageDate.getTime() && // Match date precisely
                detail.principal === damageAmount // Match original principal amount
            );
            
            if (detailIndex > -1) {
                calculatedDetail = mutableFinalPeriodDetails[detailIndex];
                
                // Create a container for the interest calculation details (days count only)
                const detailsContainer = document.createElement('div');
                detailsContainer.className = 'interest-calculation-details';
                detailsContainer.innerHTML = `<span class="days-count">${calculatedDetail.description}</span>`;
                
                // Add the details container to the description cell
                descCell.appendChild(detailsContainer);
                
                // Add the end date to the date cell (left-aligned like other dates)
                const endDateSpan = document.createElement('div');
                endDateSpan.className = 'end-date text-left';
                endDateSpan.textContent = calculatedDetail.endDate;
                dateCell.appendChild(endDateSpan);
                
                // Remove the matched detail from the mutable array to prevent duplicate insertion
                mutableFinalPeriodDetails.splice(detailIndex, 1);
            }
        }
    }
    
    descCell.classList.add('text-left');

    // Rate cell
    const rateCell = newRow.insertCell();
    rateCell.textContent = '';
    rateCell.classList.add('text-center');
    
    // Add interest rate to the rate cell if we have calculated detail
    if (calculatedDetail) {
        // Add the interest rate to the rate cell
        rateCell.textContent = calculatedDetail.rate.toFixed(2) + '%';
    }

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
    
    // Add interest amount to the interest cell if we have calculated detail
    if (calculatedDetail) {
        // Add the interest amount to the interest cell
        interestCell.innerHTML = formatCurrencyForDisplay(calculatedDetail.interest);
    }

    return newRow; // Return the created row element
}

/**
 * This function is no longer needed since we're now including the interest calculation details
 * directly in the special damages row. Keeping it as a stub for backward compatibility.
 * @deprecated Use insertSpecialDamagesRowFromData with finalPeriodStartDate and mutableFinalPeriodDetails instead.
 */
export function insertCalculatedRowIfNeeded(tableBody, referenceNode, rowData, finalPeriodStartDate, mutableFinalPeriodDetails) {
    // This function is now a no-op
    return;
}
