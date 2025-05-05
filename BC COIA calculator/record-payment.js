/**
 * Record Payment functionality
 * This module handles the Record Payment button click
 */

import useStore from './store.js';

/**
 * Initialize the Record Payment button functionality
 */
export function initRecordPayment() {
    const recordPaymentButton = document.getElementById('record-payment-button');
    
    if (recordPaymentButton) {
        recordPaymentButton.addEventListener('click', handleRecordPaymentClick);
    }
}

/**
 * Handle the Record Payment button click
 * This is a placeholder for the new implementation
 */
function handleRecordPaymentClick() {
    // Get the prejudgment and postjudgment dates from the store
    const state = useStore.getState();
    const prejudgmentDate = state.inputs.prejudgmentStartDate;
    const postjudgmentDate = state.inputs.postjudgmentEndDate;
    
    // Log information for now
    console.log('Record Payment button clicked');
    console.log('Prejudgment date:', prejudgmentDate);
    console.log('Postjudgment date:', postjudgmentDate);
    
    // In the future, this will open a new modal and handle payment recording
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initRecordPayment();
});
