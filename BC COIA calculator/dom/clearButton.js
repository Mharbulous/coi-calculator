/**
 * Clear Button Module
 * Handles functionality for the Clear button that resets all editable fields in the calculator.
 */

import useStore from '../store.js';
import { showClearConfirmationModal } from './modal.js';
import { destroySpecialDamagesDatePicker } from './datepickers.js';
import { parseDateInput } from '../utils.date.js';

// Reference to the clear button element
let clearButton;

/**
 * Initializes the clear button functionality
 */
export function initializeClearButton() {
    clearButton = document.getElementById('clear-button');
    
    if (!clearButton) {
        console.error("Clear button not found in the DOM.");
        return;
    }
    
    // Add event listener to the clear button
    clearButton.addEventListener('click', handleClearButtonClick);
    
    // Set initial button state
    updateClearButtonState();
    
    // Add listeners to update the button state when form data changes
    setupStateChangeListeners();
}

/**
 * Handles click event on the clear button
 * Shows a confirmation modal before proceeding with the reset
 */
async function handleClearButtonClick() {
    // If button is disabled, do nothing
    if (clearButton.classList.contains('disabled')) {
        return;
    }
    
    // Show confirmation modal and wait for response
    const confirmed = await showClearConfirmationModal();
    
    if (confirmed) {
        clearAllData();
    }
}

/**
 * Clears all editable fields in the application
 */
function clearAllData() {
    // 1. Clear all special damage rows
    clearSpecialDamageRows();
    
    // 2. Reset the store - without using defaults
    useStore.getState().resetStore(false);
    
    // 3. Clear all input fields with light blue background
    clearEditableInputFields();
    
    // 4. Directly update the interest table footers to show $0.00
    updateInterestTableFooters();
    
    // 5. Trigger recalculation and UI updates
    triggerRecalculation();
    
    // 6. Update button state
    updateClearButtonState();
}

/**
 * Directly updates the interest table footers to show $0.00
 */
function updateInterestTableFooters() {
    // Get the table footer elements
    const prejudgmentPrincipalTotal = document.querySelector('[data-display="prejudgmentPrincipalTotal"]');
    const prejudgmentInterestTotal = document.querySelector('[data-display="prejudgmentInterestTotal"]');
    const postjudgmentPrincipalTotal = document.querySelector('[data-display="postjudgmentPrincipalTotal"]');
    const postjudgmentInterestTotal = document.querySelector('[data-display="postjudgmentInterestTotal"]');
    
    // Update the footer values to $0.00
    if (prejudgmentPrincipalTotal) prejudgmentPrincipalTotal.innerHTML = '$0.00';
    if (prejudgmentInterestTotal) prejudgmentInterestTotal.innerHTML = '$0.00';
    if (postjudgmentPrincipalTotal) postjudgmentPrincipalTotal.innerHTML = '$0.00';
    if (postjudgmentInterestTotal) postjudgmentInterestTotal.innerHTML = '$0.00';
    
    // Also clear the day counts and dates in the table footers
    const prejudgmentTotalDays = document.querySelector('[data-display="prejudgmentTotalDays"]');
    const prejudgmentDateCell = document.querySelector('[data-display="prejudgmentDateCell"]');
    const postjudgmentTotalDays = document.querySelector('[data-display="postjudgmentTotalDays"]');
    const postjudgmentDateCell = document.querySelector('[data-display="postjudgmentDateCell"]');
    
    if (prejudgmentTotalDays) prejudgmentTotalDays.textContent = 'Total: 0 days';
    if (prejudgmentDateCell) prejudgmentDateCell.textContent = '';
    if (postjudgmentTotalDays) postjudgmentTotalDays.textContent = 'Total: 0 days';
    if (postjudgmentDateCell) postjudgmentDateCell.textContent = '';
}

/**
 * Clears all special damage rows from the table and DOM
 */
function clearSpecialDamageRows() {
    // Find all special damage rows
    const specialDamageRows = document.querySelectorAll('.special-damages-row');
    
    // Loop through each row
    specialDamageRows.forEach(row => {
        // Find and destroy the flatpickr instance for the date input
        const dateInput = row.querySelector('.special-damages-date');
        if (dateInput) {
            destroySpecialDamagesDatePicker(dateInput);
        }
        
        // Remove the row from the DOM
        row.remove();
    });
}

/**
 * Clears all editable input fields (those with light blue background)
 * Does NOT clear jurisdiction, registry, or file no. fields
 */
function clearEditableInputFields() {
    // Get all input fields with the custom-date-input class (date fields)
    const dateInputs = document.querySelectorAll('.custom-date-input');
    dateInputs.forEach(input => {
        // Skip jurisdiction, registry and file no fields
        if (input.closest('[data-input="jurisdictionSelect"]') ||
            input.closest('[data-input="registry"]') ||
            input.closest('[data-input="fileNo"]')) {
            return;
        }
        input.value = '';
    });
    
    // Get all dollar amount inputs
    const amountInputs = document.querySelectorAll('input[data-input="amountValue"], input[data-input="prejudgmentAmountValue"]');
    amountInputs.forEach(input => {
        input.value = '';
    });
}

/**
 * Triggers recalculation of the calculator and updates the UI
 */
function triggerRecalculation() {
    // Before triggering events, ensure judgment date is properly synced to other dates
    const judgmentDateInput = document.querySelector('[data-input="judgmentDate"]');
    
    if (judgmentDateInput && judgmentDateInput.value) {
        const judgmentDate = parseDateInput(judgmentDateInput.value);
        
        // Update the store to ensure all judgment-related dates are in sync
        if (judgmentDate) {
            useStore.getState().setInputs({
                dateOfJudgment: judgmentDate,
                nonPecuniaryJudgmentDate: judgmentDate,
                costsAwardedDate: judgmentDate
            });
        }
    }
    
    // Dispatch the special-damages-updated event to trigger recalculation
    document.dispatchEvent(new CustomEvent('special-damages-updated'));
    
    // Dispatch content-changed event to trigger pagination update
    document.dispatchEvent(new CustomEvent('content-changed'));
}

/**
 * Updates the clear button's appearance based on whether there is data to clear
 */
export function updateClearButtonState() {
    if (!clearButton) return;
    
    const hasData = detectFormData();
    
    if (hasData) {
        // Active state: Red background with white text
        clearButton.classList.remove('disabled');
        clearButton.classList.add('active');
    } else {
        // Disabled state: Gray background with black text
        clearButton.classList.remove('active');
        clearButton.classList.add('disabled');
    }
}

/**
 * Detects if any editable fields contain data
 * @returns {boolean} - True if any editable fields contain data, false otherwise
 */
function detectFormData() {
    // Check the store for non-zero monetary values
    const state = useStore.getState();
    const { judgmentAwarded, nonPecuniaryAwarded, costsAwarded } = state.inputs;
    const { specialDamages } = state.results;
    
    // If store has monetary values
    if (judgmentAwarded > 0 || nonPecuniaryAwarded > 0 || costsAwarded > 0) {
        return true;
    }
    
    // If store has special damages
    if (specialDamages && specialDamages.length > 0) {
        return true;
    }
    
    // Check if any date inputs have values
    const dateInputs = document.querySelectorAll('.custom-date-input');
    for (const input of dateInputs) {
        // Skip non-editable fields
        if (input.closest('[data-input="jurisdictionSelect"]') ||
            input.closest('[data-input="registry"]') ||
            input.closest('[data-input="fileNo"]')) {
            continue;
        }
        
        if (input.value && input.value.trim() !== '') {
            return true;
        }
    }
    
    // Check if any amount inputs have non-zero values
    const amountInputs = document.querySelectorAll('input[data-input="amountValue"], input[data-input="prejudgmentAmountValue"]');
    for (const input of amountInputs) {
        const value = input.value.replace(/[^0-9.-]/g, ''); // Remove currency formatting
        if (value && parseFloat(value) !== 0) {
            return true;
        }
    }
    
    // No data found
    return false;
}

/**
 * Sets up listeners to update the button state when form data changes
 */
function setupStateChangeListeners() {
    // Listen for the special-damages-updated event
    document.addEventListener('special-damages-updated', updateClearButtonState);
    
    // Add event listeners to all editable fields for button state updates
    const allInputs = document.querySelectorAll('input[type="text"]:not([data-input="registry"]):not([data-input="fileNo"])');
    allInputs.forEach(input => {
        input.addEventListener('change', updateClearButtonState);
        input.addEventListener('input', updateClearButtonState);
    });
    
    // Add specific listener for judgment date to ensure date synchronization
    const judgmentDateInput = document.querySelector('[data-input="judgmentDate"]');
    if (judgmentDateInput) {
        judgmentDateInput.addEventListener('change', function() {
            if (this.value) {
                const judgmentDate = parseDateInput(this.value);
                if (judgmentDate) {
                    useStore.getState().setInputs({
                        dateOfJudgment: judgmentDate,
                        nonPecuniaryJudgmentDate: judgmentDate,
                        costsAwardedDate: judgmentDate
                    });
                }
            }
        });
    }
}
