import { showClearConfirmationModal } from './modal.js';
import useStore from '../store.js';
import { recalculate } from '../calculator.core.js';
import elements from './elements.js';
import { formatDateForInput } from '../utils.date.js';

/**
 * Clears all calculator values:
 * - Erases all special damage rows
 * - Resets all dates to blank
 * - Sets all dollar amounts to blank
 */
function clearCalculator() {
    // Get the current store state
    const state = useStore.getState();
    
    // 1. Clear special damages
    state.setResults({
        specialDamages: [],
        specialDamagesTotal: 0
    });
    
    // 2. Clear all date fields and amounts in the UI
    const dateInputs = document.querySelectorAll('input[data-input*="Date"], input.custom-date-input');
    dateInputs.forEach(input => {
        if (input !== elements.judgmentDateInput) { // Keep judgment date as is
            input.value = '';
        }
    });
    
    // 3. Clear all amount fields
    const amountInputs = document.querySelectorAll('input[data-input*="amount"], input[data-input*="Amount"]');
    amountInputs.forEach(input => {
        input.value = '';
    });
    
    // 4. Update the store with empty values
    state.setInputs({
        judgmentAwarded: 0,
        nonPecuniaryAwarded: 0,
        costsAwarded: 0,
        prejudgmentStartDate: null,
        postjudgmentEndDate: null
    });
    
    // 5. Recalculate everything with the cleared values
    recalculate();
    
    // 6. Trigger content-changed event to update pagination
    document.dispatchEvent(new CustomEvent('content-changed'));
}

/**
 * Adds a Clear button to the UI
 */
export function setupClearButton() {
    // Check if there's already a print button to position relative to
    const titleContainer = document.getElementById('title-container');
    const existingPrintButton = document.getElementById('print-button');
    
    if (!titleContainer || !existingPrintButton) {
        console.error('Cannot add Clear button: title container or print button not found');
        return;
    }
    
    // Create the Clear button
    const clearButton = document.createElement('button');
    clearButton.id = 'clear-button';
    clearButton.className = 'action-button clear';
    clearButton.textContent = 'Clear';
    
    // Add the button to the page
    titleContainer.appendChild(clearButton);
    
    // Add click event listener with confirmation modal
    clearButton.addEventListener('click', () => {
        showClearConfirmationModal(clearCalculator);
    });
}
