import { formatDateLong, parseDateInput, formatDateForInput, formatDateForDisplay, validateDateFormat } from '../utils.date.js';
import { formatCurrencyForDisplay, formatCurrencyForInput, formatCurrencyForInputWithCommas, parseCurrency } from '../utils.currency.js';
import { setupCustomDateInputListeners, setupCurrencyInputListeners } from './setup.js';
import { initializeSpecialDamagesDatePicker } from './datepickers.js';
import { showSpecialDamagesDeletionModal } from './modal.js';
import useStore from '../store.js';

/**
 * Shows a warning message when trying to delete a special damage with description or non-zero amount
 */
function showDeletionWarning() {
    showSpecialDamagesDeletionModal();
}

/**
 * Finds the index of a special damage in the state store based on DOM row
 * @param {HTMLTableRowElement} row - The row element to find in the store
 * @returns {number} The index in the store, or -1 if not found
 */
function findSpecialDamageIndex(row) {
    const dateInput = row.querySelector('.special-damages-date');
    const descInput = row.querySelector('.special-damages-description');
    const amountInput = row.querySelector('.special-damages-amount');
    
    if (!dateInput || !descInput || !amountInput) return -1;
    
    const rowDate = dateInput.value;
    const rowDesc = descInput.value;
    const rowAmount = parseCurrency(amountInput.value);
    
    const state = useStore.getState();
    const specialDamages = state.results.specialDamages;
    
    // Find the matching special damage in the store
    return specialDamages.findIndex(damage => {
        // Convert date strings to canonical format for comparison
        const damageDate = damage.date;
        
        // Match by date, description, and approximate amount (for float precision issues)
        const datesMatch = damageDate === rowDate;
        const descMatch = damage.description === rowDesc;
        const epsilon = 0.001; // Small tolerance for floating point comparisons
        const amountsMatch = Math.abs(damage.amount - rowAmount) < epsilon;
        
        return datesMatch && descMatch && amountsMatch;
    });
}

/**
 * Handles trash icon click to delete a special damages row
 * @param {Event} event - The click event
 */
function handleTrashIconClick(event) {
    const trashIcon = event.currentTarget;
    const row = trashIcon.closest('.special-damages-row');
    
    if (!row) return;
    
    // Get the description and amount inputs
    const descInput = row.querySelector('.special-damages-description');
    const amountInput = row.querySelector('.special-damages-amount');
    
    if (!descInput || !amountInput) return;
    
    // Check if description is empty and amount is zero
    const isDescEmpty = descInput.value.trim() === '';
    const amountValue = parseCurrency(amountInput.value);
    const isAmountZero = amountValue === 0;
    
    if (isDescEmpty && isAmountZero) {
        // Find the index of this special damage in the store
        const index = findSpecialDamageIndex(row);
        
        // Remove from the DOM
        row.remove();
        
        // Remove from the store if found
        if (index !== -1) {
            useStore.getState().removeSpecialDamage(index);
        }
        
        // Trigger recalculation after removing the row
        const event = new CustomEvent('special-damages-updated');
        document.dispatchEvent(event);
    } else {
        // Show warning message
        showDeletionWarning();
    }
}

/**
 * Creates a delete icon element for deleting special damages
 * @returns {HTMLElement} The delete icon element
 */
function createDeleteIcon() {
    const deleteIcon = document.createElement('span');
    deleteIcon.className = 'delete-icon';
    deleteIcon.innerHTML = '×';  // Using × character for the X
    deleteIcon.title = 'Delete special damages';
    deleteIcon.addEventListener('click', handleTrashIconClick);
    
    return deleteIcon;
}

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
    dateInput.maxLength = 10;
    
    // Validate the passed date is within proper range before setting
    const isValidDate = validateSpecialDamagesDate(date);
    
    // Passed date is already YYYY-MM-DD from formatDateForDisplay
    dateInput.value = isValidDate ? date : ''; 
    
    // Initialize the datepicker for proper constraints
    // Let flatpickr fully handle the date input
    initializeSpecialDamagesDatePicker(dateInput, function() {
        // When the date changes, trigger recalculation
        const event = new CustomEvent('special-damages-updated');
        document.dispatchEvent(event);
    });
    
    // Do NOT add setupCustomDateInputListeners for flatpickr-managed inputs
    // Let flatpickr handle all date input behavior
    
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
        const event = new CustomEvent('special-damages-updated');
        document.dispatchEvent(event);
    });
    principalCell.appendChild(principalInput);
    principalCell.classList.add('text-right');
    
    // Interest cell (empty) with trash icon
    const interestCell = newRow.insertCell();
    interestCell.classList.add('text-right');
    
    // Add delete icon to interest cell
    const deleteIcon = createDeleteIcon();
    interestCell.appendChild(deleteIcon);
    
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
 * Validates if a special damages date is within the allowed range.
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {boolean} - True if date is valid, false otherwise
 */
function validateSpecialDamagesDate(dateStr) {
    if (!dateStr) return false;
    
    const date = parseDateInput(dateStr);
    if (!date) return false;
    
    const state = useStore.getState();
    const judgmentDate = state.inputs.dateOfJudgment;
    const prejudgmentDate = state.inputs.prejudgmentStartDate;
    
    if (!judgmentDate || !prejudgmentDate) return false;
    
    // Special damages date must be after prejudgment date + 1 day
    // Special damages can only be 1+ days after prejudgment interest date
    const minDate = new Date(prejudgmentDate);
    minDate.setDate(minDate.getDate() + 1);
    
    // Special damages date must be on or before judgment date
    // Note: Judgment date itself is the last valid date for special damages
    return date >= minDate && date <= judgmentDate;
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
    // Validate inputs to prevent issues with missing data
    if (!tableBody || !rowData) return null;
    
    // Create a safe index value
    const safeIndex = (index !== undefined && index >= 0) ? index : -1;
    
    const newRow = tableBody.insertRow(safeIndex);
    newRow.className = 'special-damages-row'; // No highlight on re-insertion

    // Date cell
    const dateCell = newRow.insertCell();
    const dateInput = document.createElement('input');
    dateInput.type = 'text';
    dateInput.className = 'special-damages-date custom-date-input';
    dateInput.dataset.type = 'special-damages-date';
    dateInput.placeholder = 'YYYY-MM-DD';
    dateInput.maxLength = 10;
    
    // Ensure we have a valid date
    const validDate = rowData.date || '';
    dateInput.value = validDate; // Already in YYYY-MM-DD
    
    // Initialize the datepicker for proper constraints
    // Let flatpickr fully handle the date input
    initializeSpecialDamagesDatePicker(dateInput, function() {
        // When the date changes, trigger recalculation
        const event = new CustomEvent('special-damages-updated');
        document.dispatchEvent(event);
    });
    
    // Do NOT add setupCustomDateInputListeners for flatpickr-managed inputs
    // Let flatpickr handle all date input behavior
    
    dateCell.appendChild(dateInput);
    dateCell.classList.add('text-left');

    // Description cell
    const descCell = newRow.insertCell();
    const descInput = document.createElement('input');
    descInput.type = 'text';
    descInput.className = 'special-damages-description';
    descInput.placeholder = 'Describe special damages';
    descInput.dataset.type = 'special-damages-description';
    
    // Handle various edge cases for description
    const description = rowData.description || '';
    descInput.value = (description === descInput.placeholder) ? '' : description; 
    descCell.appendChild(descInput);
    
    // Store the calculated detail for later use
    let calculatedDetail = null;
    
    // Find the matching calculated interest detail if applicable
    if (finalPeriodStartDate && mutableFinalPeriodDetails && mutableFinalPeriodDetails.length > 0 && rowData.date) {
        const damageDate = parseDateInput(rowData.date);
        const damageAmount = parseCurrency(rowData.amount || 0);
        
        // Check if this damage falls within the final period
        if (damageDate && finalPeriodStartDate && damageDate >= finalPeriodStartDate) {
            // Find the matching calculated interest detail
            // Use a more flexible matching approach to handle potential precision issues and timezone differences
            const detailIndex = mutableFinalPeriodDetails.findIndex(detail => {
                if (!detail || !detail.damageDate) return false;
                
                // Format both dates to YYYY-MM-DD strings for comparison to avoid timezone issues
                const formattedDamageDate = formatDateForDisplay(damageDate);
                const formattedDetailDate = formatDateForDisplay(detail.damageDate);
                const datesMatch = formattedDamageDate === formattedDetailDate;
                
                // Check if principals are approximately equal (handle potential floating point issues)
                // Use a small epsilon value to account for potential rounding differences
                const epsilon = 0.001; // Allow for tiny differences due to floating point precision
                const principalsMatch = Math.abs(detail.principal - damageAmount) < epsilon;
                
                return datesMatch && principalsMatch;
            });
            
            if (detailIndex > -1) {
                calculatedDetail = mutableFinalPeriodDetails[detailIndex];
                
                // Extract just the days count from the description (e.g., "test 2 (108 days) @" -> "108 days")
                let daysCount = "";
                const daysMatch = calculatedDetail.description.match(/\((\d+\s*days)\)/);
                if (daysMatch && daysMatch[1]) {
                    daysCount = daysMatch[1]; // This will be "108 days" from the example
                }
                
                // Create a container for the simplified days count
                const detailsContainer = document.createElement('div');
                detailsContainer.className = 'interest-calculation-details days-only';
                detailsContainer.innerHTML = `<span class="days-count">${daysCount}</span>`;
                
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
        // First add an empty space to align with the first line
        rateCell.innerHTML = '&nbsp;';
        
        // Create a container with the same class for consistent styling
        const rateContainer = document.createElement('div');
        rateContainer.className = 'interest-calculation-details';
        rateContainer.textContent = calculatedDetail.rate.toFixed(2) + '%';
        
        // Add the container to the rate cell
        rateCell.appendChild(rateContainer);
    }

    // Principal/Amount cell
    const principalCell = newRow.insertCell();
    const principalInput = document.createElement('input');
    principalInput.type = 'text';
    principalInput.className = 'special-damages-amount';
    principalInput.dataset.type = 'special-damages-amount';
    
    // Handle potentially missing or invalid amounts
    const numericValue = parseCurrency(rowData.amount || 0);
    principalInput.value = formatCurrencyForInputWithCommas(numericValue);
    
    setupCurrencyInputListeners(principalInput, function() {
        const event = new CustomEvent('special-damages-updated');
        document.dispatchEvent(event);
    });
    principalCell.appendChild(principalInput);
    principalCell.classList.add('text-right');

    // Interest cell
    const interestCell = newRow.insertCell();
    interestCell.classList.add('text-right');
    
    // Add interest amount to the interest cell if we have calculated detail (two-line case)
    if (calculatedDetail) {
        // Create an empty space div for the first line with the delete icon
        const firstLineDiv = document.createElement('div');
        firstLineDiv.style.display = 'flex';
        firstLineDiv.style.justifyContent = 'flex-end';
        firstLineDiv.style.alignItems = 'center';
        
        // Add the delete icon to the first line
        const deleteIcon = createDeleteIcon();
        firstLineDiv.appendChild(deleteIcon);
        interestCell.appendChild(firstLineDiv);
        
        // Create a container for interest details (second line)
        const interestContainer = document.createElement('div');
        interestContainer.className = 'interest-calculation-details';
        
        // Add the interest amount
        const interestSpan = document.createElement('span');
        interestSpan.innerHTML = formatCurrencyForDisplay(calculatedDetail.interest || 0);
        interestContainer.appendChild(interestSpan);
        
        // Add the container to the interest cell
        interestCell.appendChild(interestContainer);
    } else {
        // Single line case - just add the delete icon directly
        const deleteIcon = createDeleteIcon();
        interestCell.appendChild(deleteIcon);
    }

    return newRow; // Return the created row element
}

/**
 * This function is no longer needed since we're now including the interest calculation details
 * directly in the special damages row. Keeping it as a stub for backward compatibility.
 * @deprecated Use insertSpecialDamagesRowFromData with finalPeriodStartDate and mutableFinalPeriodDetails instead.
 */
export function insertCalculatedRowIfNeeded() {
    // This function is now a no-op
    return;
}
