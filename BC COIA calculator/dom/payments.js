import { formatDateLong, parseDateInput, formatDateForInput, formatDateForDisplay, validateDateFormat } from '../utils.date.js';
import { formatCurrencyForDisplay, formatCurrencyForInput, formatCurrencyForInputWithCommas, parseCurrency } from '../utils.currency.js';
import { setupCustomDateInputListeners, setupCurrencyInputListeners } from './setup.js';
import { initializePaymentDatePicker, destroyPaymentDatePicker } from './datepickers.js'; // These functions will need to be created
import { showSpecialDamagesConfirmationModal } from './modal.js'; // Reuse this modal for now
import useStore from '../store.js';
import { logger } from '../util.logger.js'; // Import for enhanced debugging

/**
 * Finds the index of a payment in the state store based on DOM row
 * @param {HTMLTableRowElement} row - The row element to find in the store
 * @returns {number} The index in the store, or -1 if not found
 */
function findPaymentIndex(row) {
    const dateInput = row.querySelector('.payment-date');
    const amountInput = row.querySelector('.special-damages-amount[data-type="payment-amount"]');
    
    if (!dateInput || !amountInput) return -1;
    
    const rowDate = dateInput.value;
    const rowAmount = parseCurrency(amountInput.value);
    
    const state = useStore.getState();
    const payments = state.results.payments;
    
    // Find the matching payment in the store
    return payments.findIndex(payment => {
        // Convert date strings to canonical format for comparison
        const paymentDate = payment.date;
        
        // Match by date and approximate amount (for float precision issues)
        const datesMatch = paymentDate === rowDate;
        const epsilon = 0.001; // Small tolerance for floating point comparisons
        const amountsMatch = Math.abs(payment.amount - rowAmount) < epsilon;
        
        return datesMatch && amountsMatch;
    });
}

/**
 * Handles trash icon click to delete a payment row
 * @param {Event} event - The click event
 */
async function handleTrashIconClick(event) {
    const trashIcon = event.currentTarget;
    const row = trashIcon.closest('.editable-item-row');
    
    if (!row) return;
    
    // Get all the relevant inputs
    const dateInput = row.querySelector('.payment-date');
    const amountInput = row.querySelector('.special-damages-amount[data-type="payment-amount"]');
    
    if (!dateInput || !amountInput) return;
    
    // Check if amount is zero
    const amountValue = parseCurrency(amountInput.value);
    const isAmountZero = amountValue === 0;
    
    // Function to perform the actual deletion
    const deleteRow = () => {
        // Find the index of this payment in the store
        const index = findPaymentIndex(row);
        
        // Destroy the associated Flatpickr instance
        if (dateInput) {
            destroyPaymentDatePicker(dateInput);
        }
        
        // Remove from the DOM
        row.remove();
        
        // Remove from the store if found
        if (index !== -1) {
            useStore.getState().removePayment(index);
        }
        
        // Trigger recalculation after removing the row
        const event = new CustomEvent('payment-updated');
        document.dispatchEvent(event);
    };
    
    if (isAmountZero) {
        // If amount is zero, delete immediately
        deleteRow();
    } else {
        // Otherwise, show confirmation dialog with details
        const formattedDate = dateInput.value;
        const description = "Payment received"; // Fixed description for all payments
        const formattedAmount = formatCurrencyForDisplay(amountValue);
        
        // Show confirmation dialog and wait for user response
        const confirmed = await showSpecialDamagesConfirmationModal(
            formattedDate, 
            description, 
            formattedAmount
        );
        
        // If user confirmed deletion, delete the row
        if (confirmed) {
            deleteRow();
        }
    }
}

/**
 * Creates a delete icon element for deleting payments
 * @returns {HTMLElement} The delete icon element
 */
function createDeleteIcon() {
    const deleteIcon = document.createElement('span');
    deleteIcon.className = 'delete-icon';
    
    // Create the trash icon using ion-icon
    const trashIcon = document.createElement('ion-icon');
    trashIcon.setAttribute('name', 'trash-outline');
    
    // Append the trash icon to the delete icon span
    deleteIcon.appendChild(trashIcon);
    
    deleteIcon.title = 'Delete payment';
    deleteIcon.addEventListener('click', handleTrashIconClick);
    
    return deleteIcon;
}

/**
 * Inserts a new payment row immediately after the specified row.
 * @param {HTMLTableSectionElement} tableBody - The tbody element of the table.
 * @param {HTMLTableRowElement} currentRow - The row after which to insert the new row.
 * @param {string} date - The date to pre-populate in the new row (YYYY-MM-DD format).
 */
export function insertPaymentRow(tableBody, currentRow, date) {
    // Get the index of the current row
    const rowIndex = currentRow.rowIndex; // Use rowIndex directly for insertion after
    
    // Create a new row and insert it after the current row
    const newRow = tableBody.insertRow(rowIndex); // Insert at the correct index
    
    // IMPORTANT: Add the payment-row class to identify this as a payment row
    newRow.className = 'editable-item-row payment-row highlight-new-row breakable'; // Add payment-row class
    
    console.log("[DEBUG] insertPaymentRow: Created new row at index:", rowIndex);
    console.log("[DEBUG] insertPaymentRow: Set row className to:", newRow.className);
    
    // Date cell (editable, pre-populated with the date from the current row)
    const dateCell = newRow.insertCell();
    const dateInput = document.createElement('input');
    dateInput.type = 'text';
    dateInput.className = 'payment-date custom-date-input';
    dateInput.dataset.type = 'payment-date';
    dateInput.placeholder = 'YYYY-MM-DD';
    dateInput.maxLength = 10;
    
    // Validate the passed date is within proper range before setting
    const isValidDate = validatePaymentDate(date);
    
    // Passed date is already YYYY-MM-DD from formatDateForDisplay
    dateInput.value = isValidDate ? date : ''; 
    
    // Initialize the datepicker for proper constraints
    // Let flatpickr fully handle the date input
    initializePaymentDatePicker(dateInput, function() {
        // When the date changes, trigger recalculation
        const event = new CustomEvent('payment-updated');
        document.dispatchEvent(event);
    });
    
    // Do NOT add setupCustomDateInputListeners for flatpickr-managed inputs
    // Let flatpickr handle all date input behavior
    
    dateCell.appendChild(dateInput);
    dateCell.classList.add('text-left');
    
    // Description cell with payment description and editable field
    const descCell = newRow.insertCell();
    descCell.classList.add('text-left');
    
    // Create a container for the description and input field
    const descContainer = document.createElement('div');
    descContainer.className = 'payment-desc-container';
    descContainer.style.display = 'flex';
    descContainer.style.alignItems = 'center';
    
    // Add the "Payment received:" label
    const descLabel = document.createElement('span');
    descLabel.textContent = "Payment received: ";
    descLabel.style.marginRight = '4px';
    descContainer.appendChild(descLabel);
    
    // Create the amount input field inside the description cell
    const amountInput = document.createElement('input');
    amountInput.type = 'text';
    amountInput.className = 'special-damages-amount'; // Use special-damages-amount class for consistent styling
    amountInput.dataset.type = 'payment-amount';
    amountInput.value = '';
    amountInput.style.width = '100px';
    setupCurrencyInputListeners(amountInput, function() {
        // When the amount changes, trigger recalculation
        const event = new CustomEvent('payment-updated');
        document.dispatchEvent(event);
    });
    descContainer.appendChild(amountInput);
    descCell.appendChild(descContainer);
    
    // Principal cell (will show calculated effect after processing)
    const principalCell = newRow.insertCell();
    principalCell.textContent = ''; // Will be filled after processing
    principalCell.classList.add('text-right');
    
    // Rate cell (empty for payment rows)
    const rateCell = newRow.insertCell();
    rateCell.textContent = '';
    rateCell.classList.add('text-center');
    
    // Interest cell (empty) with trash icon
    const interestCell = newRow.insertCell();
    interestCell.classList.add('text-right');
    
    // Add delete icon to interest cell
    const deleteIcon = createDeleteIcon();
    interestCell.appendChild(deleteIcon);
    
    // Set focus to the amount field
    setTimeout(() => {
        amountInput.focus();
        
        // Remove highlight class after a delay
        setTimeout(() => {
            newRow.classList.remove('highlight-new-row');
        }, 2000);
    }, 100);
    
    // Trigger recalculation after adding the row
    const event = new CustomEvent('payment-updated');
    document.dispatchEvent(event);
}

/**
 * Validates if a payment date is within the allowed range.
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {boolean} - True if date is valid, false otherwise
 */
function validatePaymentDate(dateStr) {
    if (!dateStr) return false;
    
    const date = parseDateInput(dateStr);
    if (!date) return false;
    
    const state = useStore.getState();
    const judgmentDate = state.inputs.dateOfJudgment;
    const prejudgmentDate = state.inputs.prejudgmentStartDate;
    
    if (!judgmentDate || !prejudgmentDate) return false;
    
    // Payment date must be after prejudgment date
    // Payment date must be on or before judgment date + 1 year (for now)
    const maxDate = new Date(judgmentDate);
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    
    return date >= prejudgmentDate && date <= maxDate;
}

/**
 * Helper function to insert a payment row from saved data during table update.
 * @param {HTMLTableSectionElement} tableBody - The tbody element of the table.
 * @param {number} index - The index at which to insert the row (-1 to append).
 * @param {object} rowData - Object containing date (YYYY-MM-DD) and amount.
 * @returns {HTMLTableRowElement} The newly inserted row element.
 */
export function insertPaymentRowFromData(tableBody, index, rowData) {
    console.log("[DEBUG] insertPaymentRowFromData: Starting with tableBody:", tableBody?.id || "undefined", 
                "index:", index, "rowData:", rowData);
    
    // Validate inputs to prevent issues with missing data
    if (!tableBody || !rowData) {
        console.log("[DEBUG] insertPaymentRowFromData: Missing tableBody or rowData, returning null");
        return null;
    }
    
    // Create a safe index value
    const safeIndex = (index !== undefined && index >= 0) ? index : -1;
    console.log("[DEBUG] insertPaymentRowFromData: Using safeIndex:", safeIndex);
    
    const newRow = tableBody.insertRow(safeIndex);
    console.log("[DEBUG] insertPaymentRowFromData: Created new row at index:", safeIndex);
    
    // IMPORTANT: Add the payment-row class to identify this as a payment row
    newRow.className = 'editable-item-row payment-row breakable'; // Add payment-row class
    console.log("[DEBUG] insertPaymentRowFromData: Set row className to:", newRow.className);

    // Date cell
    const dateCell = newRow.insertCell();
    const dateInput = document.createElement('input');
    dateInput.type = 'text';
    dateInput.className = 'payment-date custom-date-input';
    dateInput.dataset.type = 'payment-date';
    dateInput.placeholder = 'YYYY-MM-DD';
    dateInput.maxLength = 10;
    
    // Ensure we have a valid date
    const validDate = rowData.date || '';
    dateInput.value = validDate; // Already in YYYY-MM-DD
    
    // Initialize the datepicker for proper constraints
    initializePaymentDatePicker(dateInput, function() {
        // When the date changes, trigger recalculation
        const event = new CustomEvent('payment-updated');
        document.dispatchEvent(event);
    });
    
    dateCell.appendChild(dateInput);
    dateCell.classList.add('text-left');

    // Handle potentially missing or invalid amounts
    const numericValue = parseCurrency(rowData.amount || 0);

    // Description cell with payment description and editable field
    const descCell = newRow.insertCell();
    descCell.classList.add('text-left');
    
    // Create a container for the description and input field
    const descContainer = document.createElement('div');
    descContainer.className = 'payment-desc-container';
    descContainer.style.display = 'flex';
    descContainer.style.alignItems = 'center';
    
    // Add the "Payment received:" label
    const descLabel = document.createElement('span');
    descLabel.textContent = "Payment received: ";
    descLabel.style.marginRight = '4px';
    descContainer.appendChild(descLabel);
    
    // Create the amount input field inside the description cell
    const amountInput = document.createElement('input');
    amountInput.type = 'text';
    amountInput.className = 'special-damages-amount'; // Use special-damages-amount class for consistent styling
    amountInput.dataset.type = 'payment-amount';
    amountInput.value = formatCurrencyForInputWithCommas(numericValue);
    amountInput.style.width = '100px';
    setupCurrencyInputListeners(amountInput, function() {
        // When the amount changes, trigger recalculation
        const event = new CustomEvent('payment-updated');
        document.dispatchEvent(event);
    });
    descContainer.appendChild(amountInput);
    descCell.appendChild(descContainer);
    
    // Principal cell (will show calculated effect after processing)
    const principalCell = newRow.insertCell();
    principalCell.textContent = ''; // Will be filled after processing
    principalCell.classList.add('text-right');

    // Rate cell (empty for payments)
    const rateCell = newRow.insertCell();
    rateCell.textContent = '';
    rateCell.classList.add('text-center');

    // Interest cell (empty) with delete icon
    const interestCell = newRow.insertCell();
    interestCell.classList.add('text-right');
    
    // Add delete icon
    const deleteIcon = createDeleteIcon();
    interestCell.appendChild(deleteIcon);

    return newRow; // Return the created row element
}
