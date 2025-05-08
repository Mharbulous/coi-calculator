/**
 * New Record Payment button Modal Script
 * This script adds event listeners to the Record Payment button
 * to directly test the payment modal functionality
 */

import { promptForPaymentDetails } from './dom/modal.js';
import useStore from './store.js';
import { showModal } from './dom/modal.js';

// Function to initialize the test modal functionality
function initRecordPaymentmodal() {
    const recordPaymentButton = document.getElementById('test-modal-button');
    
    if (recordPaymentButton) {
        console.log('Record Payment button found, adding click listener');
        
        recordPaymentButton.addEventListener('click', () => {
            console.log('Modal button clicked - opening payment modal directly');
            
            // Go directly to the payment modal without showing test modal first
            const state = useStore.getState();
            const prejudgmentDate = state.inputs.prejudgmentStartDate;
            const postjudgmentDate = state.inputs.postjudgmentEndDate;
            
            console.log('Dates for payment modal:', {
                prejudgmentDate: prejudgmentDate instanceof Date ? prejudgmentDate.toISOString() : prejudgmentDate,
                postjudgmentDate: postjudgmentDate instanceof Date ? postjudgmentDate.toISOString() : postjudgmentDate
            });
            
            promptForPaymentDetails(prejudgmentDate, postjudgmentDate)
                .then(result => {
                    console.log('Payment modal result:', result);
                    
                    // Add stub message if user confirmed payment (result is not null/undefined)
                    if (result) {
                        console.log(`STUB: User has confirmed that they want to add a payment row with the following particulars: $${result.amount} paid ${result.date}`);
                    }
                })
                .catch(error => {
                    console.error('Error in payment modal:', error);
                });
        });
    } else {
        console.error('Record Payment button not found in the DOM');
    }
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initRecordPaymentmodal);
