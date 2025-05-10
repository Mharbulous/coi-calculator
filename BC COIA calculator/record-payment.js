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
export function processPaymentRecord(rowStartDate, rowEndDate) {
    // Import logger for debugging
    import('./util.logger.js').then(logger => {
        try {
            logger.debug("processPaymentRecord called with dates:", { 
                rowStartDate, 
                rowEndDate 
            });
            
            // Get the current state and dates from the store
            const state = useStore.getState();
            
            const prejudgmentDate = state.inputs.prejudgmentStartDate;
            const postjudgmentDate = state.inputs.postjudgmentEndDate;
            
            // Use row dates if provided, otherwise fall back to prejudgment/postjudgment dates
            const startDate = rowStartDate || prejudgmentDate;
            const endDate = rowEndDate || postjudgmentDate;
            
            logger.debug("Payment date range:", {
                prejudgmentDate,
                postjudgmentDate,
                startDate,
                endDate
            });
            
            // Show the payment details modal
            logger.debug("Showing payment details modal");
            promptForPaymentDetails(prejudgmentDate, postjudgmentDate, startDate, endDate)
                .then(paymentDetails => {
                    if (paymentDetails) {
                        logger.debug("Payment details received from modal:", paymentDetails);
                        
                        // Get rates data from the store
                        const ratesData = state.ratesData;
                        
                        // Process the payment using the payment insertion algorithm
                        logger.debug("Calling insertPaymentRecord");
                        
                        // Since insertPaymentRecord now returns a Promise, we need to handle it differently
                        const insertPaymentPromise = insertPaymentRecord(state, paymentDetails, ratesData);
                        
                        // Check if return value is a Promise
                        if (insertPaymentPromise && typeof insertPaymentPromise.then === 'function') {
                            insertPaymentPromise.then(updatedState => {
                                logger.debug("insertPaymentRecord returned updated state");
                                
                                // Check if the payment was added to the payments array
                                const paymentsAfterUpdate = updatedState.results.payments;
                                logger.debug("Payments in updated state:", paymentsAfterUpdate);
                                
                                // Update the store with the new state
                                logger.debug("Updating store state with new payment");
                                useStore.setState(updatedState);
                                
                                // Verify the store was updated
                                const stateAfterUpdate = useStore.getState();
                                logger.debug("Payments in store after update:", stateAfterUpdate.results.payments);
                                
                                logger.debug("Payment processing completed successfully");
                            }).catch(error => {
                                logger.error("Error in insertPaymentRecord promise:", error);
                            });
                        } else {
                            // Handle synchronous result (old implementation or fallback)
                            logger.debug("insertPaymentRecord returned immediate result");
                            const updatedState = insertPaymentPromise;
                            
                            // Update the store with the new state
                            useStore.setState(updatedState);
                            
                            logger.debug("Payment processing completed (sync mode)");
                        }
                    } else {
                        logger.debug("No payment details received (user cancelled)");
                    }
                })
                .catch(error => {
                    logger.error('Error in payment modal promise:', error);
                });
        } catch (error) {
            logger.error('Error in processPaymentRecord:', error);
        }
    }).catch(error => {
        console.error('Failed to import logger:', error);
        
        // Fallback to non-instrumented version
        try {
            // Get the current state and dates from the store
            const state = useStore.getState();
            
            const prejudgmentDate = state.inputs.prejudgmentStartDate;
            const postjudgmentDate = state.inputs.postjudgmentEndDate;
            
            // Use row dates if provided, otherwise fall back to prejudgment/postjudgment dates
            const startDate = rowStartDate || prejudgmentDate;
            const endDate = rowEndDate || postjudgmentDate;
            
            // Show the payment details modal
            promptForPaymentDetails(prejudgmentDate, postjudgmentDate, startDate, endDate)
                .then(paymentDetails => {
                    if (paymentDetails) {
                        // Get rates data from the store
                        const ratesData = state.ratesData;
                        
                        // Process the payment using the payment insertion algorithm
                        const insertResult = insertPaymentRecord(state, paymentDetails, ratesData);
                        
                        // Handle Promise or direct result
                        if (insertResult && typeof insertResult.then === 'function') {
                            insertResult.then(updatedState => {
                                useStore.setState(updatedState);
                            });
                        } else {
                            useStore.setState(insertResult);
                        }
                    }
                })
                .catch(error => {
                    console.error('Error in payment modal promise:', error);
                });
        } catch (error) {
            console.error('Error in processPaymentRecord:', error);
        }
    });
}

// No longer initializing as the button has been removed
// The processPaymentRecord function is now exported for use by the dropdown menu
