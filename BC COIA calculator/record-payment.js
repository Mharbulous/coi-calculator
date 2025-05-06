/**
 * Record Payment functionality
 * This module handles the Record Payment button functionality and payment processing
 * using the algorithm from payment-insertion.js.
 * 
 * This module combines functionality that was previously split between 
 * record-payment.js and test-modal.js.
 */

import useStore from './store.js';
import { promptForPaymentDetails, showModal } from './dom/modal.js';
import { insertPaymentRecord } from './payment-insertion.js';

/**
 * Initialize the Record Payment button functionality.
 * Adds a click handler to the button that opens the payment modal
 * and processes any payments.
 */
export function initRecordPayment() {
    const recordPaymentButton = document.getElementById('test-modal-button');
    
    if (recordPaymentButton) {
        recordPaymentButton.addEventListener('click', handleRecordPaymentClick);
    } else {
        console.error('Record Payment button (id: test-modal-button) not found in the DOM');
    }
}

/**
 * Handle the Record Payment button click.
 * This function is called when the user clicks the Record Payment button.
 * It handles showing the payment details modal and processing the payment.
 */
function handleRecordPaymentClick() {
    try {
        // Get the current state and dates from the store
        const state = useStore.getState();
        
        const prejudgmentDate = state.inputs.prejudgmentStartDate;
        const postjudgmentDate = state.inputs.postjudgmentEndDate;
        
        // Show the payment details modal
        promptForPaymentDetails(prejudgmentDate, postjudgmentDate)
            .then(paymentDetails => {
                if (paymentDetails) {
                    // Get rates data from the store
                    const ratesData = state.ratesData;
                    
                    // Process the payment using the payment insertion algorithm
                    const updatedState = insertPaymentRecord(state, paymentDetails, ratesData);
                    
                    // Update the store with the new state
                    useStore.setState(updatedState);
                }
            })
            .catch(error => {
                console.error('Error in payment modal promise:', error);
            });
    } catch (error) {
        console.error('Error in handleRecordPaymentClick:', error);
    }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initRecordPayment();
});
