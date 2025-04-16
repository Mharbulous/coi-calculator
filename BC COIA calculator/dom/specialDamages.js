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
 * @returns {HTMLTableRowElement} The newly inserted row element.
 */
export function insertSpecialDamagesRowFromData(tableBody, index, rowData) {
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
 * Helper function to insert the calculated special interest row if applicable, before a reference node.
 * @param {HTMLTableSectionElement} tableBody - The tbody element.
 * @param {Node|null} referenceNode - The node before which to insert the calculated row (null to append).
 * @param {object} rowData - The data object for the user-entered row that triggered this check.
 * @param {Date|null} finalPeriodStartDate - The start date of the final regular interest period.
 * @param {Array<object>} mutableFinalPeriodDetails - The mutable array of calculated final period interest details.
 */
export function insertCalculatedRowIfNeeded(tableBody, referenceNode, rowData, finalPeriodStartDate, mutableFinalPeriodDetails) {
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
