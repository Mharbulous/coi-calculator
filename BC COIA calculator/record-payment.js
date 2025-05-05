/**
 * Record Payment functionality
 * This module handles the Record Payment button click
 */

import useStore from './store.js';
import { promptForPaymentDetails } from './dom/modal.js';

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
 * Opens a modal to prompt for payment details
 */
function handleRecordPaymentClick() {
    // Get the prejudgment and postjudgment dates from the store
    const state = useStore.getState();
    const prejudgmentDate = state.inputs.prejudgmentStartDate;
    const postjudgmentDate = state.inputs.postjudgmentEndDate;
    
    console.log('Record Payment button clicked');
    
    // Show the payment details modal
    promptForPaymentDetails(prejudgmentDate, postjudgmentDate)
        .then(paymentDetails => {
            if (paymentDetails) {
                // For now, just log the payment details
                console.log('Payment details received:', paymentDetails);
                // In future tasks, we'll add code to process the payment
            } else {
                console.log('Payment recording canceled');
            }
        });
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initRecordPayment();
});
