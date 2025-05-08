/**
 * Record Payment functionality
 * This module provides payment processing functionality using the algorithm 
 * from payment-insertion.js.
 * 
 * Previously attached to the Record Payment button, now available for use by 
 * the "Add... Payment" dropdown option.
 */

import useStore from './store.js';
import { promptForPaymentDetails, showModal } from './dom/modal.js';
import { insertPaymentRecord } from './payment-insertion.js';

/**
 * Process a payment record
 * This function handles showing the payment details modal and processing the payment.
 * It is now called by the "Add... Payment" dropdown option rather than a dedicated button.
 */
export function processPaymentRecord() {
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
        console.error('Error in processPaymentRecord:', error);
    }
}

// No longer initializing as the button has been removed
// The processPaymentRecord function is now exported for use by the dropdown menu
