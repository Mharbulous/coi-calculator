/**
 * Record Payment functionality
 * This module handles the Record Payment button click and payment processing
 * using the cleaner algorithm from payment-insertion.js
 */

import useStore from './store.js';
import { promptForPaymentDetails } from './dom/modal.js';
import { insertPaymentRecord } from './payment-insertion.js';

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
 * Opens a modal to prompt for payment details and processes the payment
 */
function handleRecordPaymentClick() {
    // Get the current state and dates from the store
    const state = useStore.getState();
    const prejudgmentDate = state.inputs.prejudgmentStartDate;
    const postjudgmentDate = state.inputs.postjudgmentEndDate;
    
    console.log('Record Payment button clicked');
    
    // Show the payment details modal
    promptForPaymentDetails(prejudgmentDate, postjudgmentDate)
        .then(paymentDetails => {
            if (paymentDetails) {
                console.log('Payment details received:', paymentDetails);
                
                // Get rates data from the store
                const ratesData = state.ratesData;
                
                // Process the payment using our new algorithm
                const updatedState = insertPaymentRecord(state, paymentDetails, ratesData);
                
                // Update the store with the new state
                useStore.setState(updatedState);
                
                console.log('Payment processed and state updated');
            } else {
                console.log('Payment recording canceled');
            }
        });
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initRecordPayment();
});
