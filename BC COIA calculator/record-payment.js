/**
 * Record Payment functionality
 * This module handles the Record Payment button click and payment processing
 * using the cleaner algorithm from payment-insertion.js
 */

import useStore from './store.js';
import { promptForPaymentDetails } from './dom/modal.js';
import { insertPaymentRecord } from './payment-insertion.js';

/**
 * Verify that all required resources are loaded
 * This helps diagnose issues with the Record Payment functionality
 */
function verifyResources() {
    console.log('Verifying resources for Record Payment functionality');
    
    // Check if the record payment button exists
    const recordPaymentButton = document.getElementById('record-payment-button');
    console.log('Record Payment button exists:', !!recordPaymentButton);
    
    // Check if required CSS is loaded
    const allStylesheets = Array.from(document.styleSheets);
    const modalStylesLoaded = allStylesheets.some(sheet => {
        try {
            if (sheet.href && (
                sheet.href.includes('modal.css') || 
                sheet.href.includes('record-payment-modal.css') ||
                sheet.href.includes('flatpickr-modal-custom.css')
            )) {
                return true;
            }
            return false;
        } catch (e) {
            // CORS issues might prevent accessing some stylesheets
            return false;
        }
    });
    console.log('Modal CSS styles loaded:', modalStylesLoaded);
    console.log('Total stylesheets loaded:', allStylesheets.length);
    
    // Check if Flatpickr is loaded
    const flatpickrLoaded = typeof flatpickr === 'function';
    console.log('Flatpickr loaded:', flatpickrLoaded);
    
    // Return verification result
    return {
        buttonExists: !!recordPaymentButton,
        modalStylesLoaded,
        flatpickrLoaded
    };
}

/**
 * Initialize the Record Payment button functionality
 */
export function initRecordPayment() {
    // Run verification
    const verification = verifyResources();
    console.log('Resource verification results:', verification);
    
    const recordPaymentButton = document.getElementById('record-payment-button');
    
    if (recordPaymentButton) {
        console.log('Adding click event listener to Record Payment button');
        recordPaymentButton.addEventListener('click', handleRecordPaymentClick);
    } else {
        console.error('Record Payment button not found in the DOM');
    }
}

/**
 * Handle the Record Payment button click
 * Opens a modal to prompt for payment details and processes the payment
 */
function handleRecordPaymentClick() {
    try {
        console.log('Record Payment button clicked - handler executed');
        
        // Get the current state and dates from the store
        const state = useStore.getState();
        console.log('State retrieved:', state ? 'State object exists' : 'State is null or undefined');
        
        const prejudgmentDate = state.inputs.prejudgmentStartDate;
        const postjudgmentDate = state.inputs.postjudgmentEndDate;
        
        console.log('Dates retrieved:', { 
            prejudgmentDate: prejudgmentDate instanceof Date ? prejudgmentDate.toISOString() : prejudgmentDate,
            postjudgmentDate: postjudgmentDate instanceof Date ? postjudgmentDate.toISOString() : postjudgmentDate
        });
        
        // Log before calling modal function
        console.log('About to call promptForPaymentDetails...');
        
        // Show the payment details modal
        promptForPaymentDetails(prejudgmentDate, postjudgmentDate)
            .then(paymentDetails => {
                console.log('Modal promise resolved:', paymentDetails ? 'With payment details' : 'Cancelled');
                
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
