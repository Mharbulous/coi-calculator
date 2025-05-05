/**
 * Record Payment functionality
 * This module handles the Record Payment button click and shows the payment modal
 */

import { showRecordPaymentModal } from './dom/modal.js';
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
 * Shows the payment modal with date constraints based on prejudgment and postjudgment dates
 */
async function handleRecordPaymentClick() {
    // Get the prejudgment and postjudgment dates from the store
    const state = useStore.getState();
    const prejudgmentDate = state.inputs.prejudgmentStartDate;
    const postjudgmentDate = state.inputs.postjudgmentEndDate;
    
    // Show the payment modal
    const paymentData = await showRecordPaymentModal(prejudgmentDate, postjudgmentDate);
    
    // This is just a wireframe for now, so we're not doing anything with the payment data
    if (paymentData) {
        console.log('Payment recorded:', paymentData);
        // In the future, this would update the store and recalculate interest
    }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initRecordPayment();
});
