
// For Jest tests, we need to use the vanilla version to avoid React dependency
// In the browser, this will use the main zustand package via the import map
import { createStore } from 'zustand/vanilla';
import { normalizeDate } from './utils.date.js';

/**
 * Zustand store for the Court Order Interest Calculator application.
 * This centralizes state management and provides actions to update the state.
 */
const store = createStore((set) => ({
    // Input values
    inputs: {
        prejudgmentStartDate: null,
        postjudgmentEndDate: null,
        dateOfJudgment: null,
        nonPecuniaryJudgmentDate: null,
        costsAwardedDate: null,
        judgmentAwarded: 0,
        nonPecuniaryAwarded: 0,
        costsAwarded: 0,
        jurisdiction: 'BC',
        showPrejudgment: true,
        showPostjudgment: true,
        showPerDiem: true,
        userEnteredPrejudgmentInterest: 0, // Added for editable prejudgment interest
        isValid: true,
        validationMessage: ''
    },
    
    // Saved state for prejudgment calculations when toggling checkbox
    savedPrejudgmentState: {
        specialDamages: [],
        prejudgmentResult: {
            details: [],
            total: 0,
            principal: 0,
            finalPeriodDamageInterestDetails: []
        },
        payments: [] // Add payments to saved state
    },
    
    // Calculation results
    results: {
        specialDamages: [],
        specialDamagesTotal: 0,
        prejudgmentResult: {
            details: [],
            total: 0,
            principal: 0,
            finalPeriodDamageInterestDetails: []
        },
        postjudgmentResult: {
            details: [],
            total: 0
        },
        judgmentTotal: 0,
        totalOwing: 0,
        perDiem: 0,
        finalCalculationDate: null,
        // Payment tracking
        payments: []
    },

    // Actions to update the state

    /**
     * Updates the inputs state with new values
     * @param {Object} newInputs - The new input values to set
     */
    setInputs: (newInputs) => set((state) => ({
        inputs: {
            ...state.inputs,
            ...newInputs
        }
    })),

    /**
     * Updates a single input value
     * @param {string} key - The input key to update
     * @param {any} value - The new value
     */
    setInput: (key, value) => set((state) => ({
        inputs: {
            ...state.inputs,
            [key]: value
        }
    })),

    /**
     * Updates the results state with new values
     * @param {Object} newResults - The new result values to set
     */
    setResults: (newResults) => set((state) => ({
        results: {
            ...state.results,
            ...newResults
        }
    })),

    /**
     * Updates a specific result property
     * @param {string} key - The result key to update
     * @param {any} value - The new value
     */
    setResult: (key, value) => set((state) => ({
        results: {
            ...state.results,
            [key]: value
        }
    })),

    /**
     * Updates the prejudgment result
     * @param {Object} prejudgmentResult - The new prejudgment result
     */
    setPrejudgmentResult: (prejudgmentResult) => set((state) => ({
        results: {
            ...state.results,
            prejudgmentResult: {
                ...state.results.prejudgmentResult,
                ...prejudgmentResult
            }
        }
    })),

    /**
     * Updates the postjudgment result
     * @param {Object} postjudgmentResult - The new postjudgment result
     */
    setPostjudgmentResult: (postjudgmentResult) => set((state) => ({
        results: {
            ...state.results,
            postjudgmentResult: {
                ...state.results.postjudgmentResult,
                ...postjudgmentResult
            }
        }
    })),

    /**
     * Updates the special damages array and recalculates the total
     * @param {Array} specialDamages - The new special damages array
     */
    setSpecialDamages: (specialDamages) => set((state) => {
        const specialDamagesTotal = specialDamages.reduce((sum, damage) => sum + damage.amount, 0);
        return {
            results: {
                ...state.results,
                specialDamages,
                specialDamagesTotal
            }
        };
    }),

    /**
     * Adds a special damage to the array and updates the total
     * @param {Object} damage - The special damage to add
     */
    addSpecialDamage: (damage) => set((state) => {
        const specialDamages = [...state.results.specialDamages, damage];
        const specialDamagesTotal = specialDamages.reduce((sum, damage) => sum + damage.amount, 0);
        return {
            results: {
                ...state.results,
                specialDamages,
                specialDamagesTotal
            }
        };
    }),

    /**
     * Updates a special damage at the specified index
     * @param {number} index - The index of the special damage to update
     * @param {Object} damage - The updated special damage
     */
    updateSpecialDamage: (index, damage) => set((state) => {
        const specialDamages = [...state.results.specialDamages];
        specialDamages[index] = damage;
        const specialDamagesTotal = specialDamages.reduce((sum, damage) => sum + damage.amount, 0);
        return {
            results: {
                ...state.results,
                specialDamages,
                specialDamagesTotal
            }
        };
    }),

    /**
     * Removes a special damage at the specified index
     * @param {number} index - The index of the special damage to remove
     */
    removeSpecialDamage: (index) => set((state) => {
        const specialDamages = [...state.results.specialDamages];
        specialDamages.splice(index, 1);
        const specialDamagesTotal = specialDamages.reduce((sum, damage) => sum + damage.amount, 0);
        return {
            results: {
                ...state.results,
                specialDamages,
                specialDamagesTotal
            }
        };
    }),

    /**
     * Adds a payment to the payments array
     * @param {Object} payment - Payment object containing date, amount, interestApplied, principalApplied, etc.
     */
    addPayment: (payment) => set((state) => {
        const payments = [...state.results.payments, payment];
        return {
            results: {
                ...state.results,
                payments
            }
        };
    }),

    /**
     * Updates a payment at the specified index
     * @param {number} index - The index of the payment to update
     * @param {Object} payment - The updated payment object
     */
    updatePayment: (index, payment) => set((state) => {
        const payments = [...state.results.payments];
        payments[index] = payment;
        return {
            results: {
                ...state.results,
                payments
            }
        };
    }),

    /**
     * Removes a payment at the specified index
     * @param {number} index - The index of the payment to remove
     */
    removePayment: (index) => set((state) => {
        const payments = [...state.results.payments];
        payments.splice(index, 1);
        return {
            results: {
                ...state.results,
                payments
            }
        };
    }),

    /**
     * Calculates the total amount of all payments
     * @returns {number} - The total amount of all payments
     */
    calculatePaymentTotal: () => {
        const { payments } = store.getState().results;
        return payments.reduce((sum, payment) => sum + payment.amount, 0);
    },

    /**
     * Saves the current prejudgment calculation state
     * Used when toggling the prejudgment checkbox off
     */
    savePrejudgmentState: () => set((state) => {
        return {
            savedPrejudgmentState: {
                prejudgmentStartDate: state.inputs.prejudgmentStartDate, // Save the prejudgment date
                specialDamages: [...state.results.specialDamages],
                prejudgmentResult: {
                    ...state.results.prejudgmentResult
                },
                payments: [...state.results.payments] // Save payments
            }
        };
    }),

    /**
     * Restores the saved prejudgment calculation state
     * Used when toggling the prejudgment checkbox on
     */
    restorePrejudgmentState: () => set((state) => {
        // Check if we have any saved state
        if (state.savedPrejudgmentState) {
            // First, prepare to update inputs
            const inputUpdates = {};
            
            // Always restore the prejudgment date if it exists
            if (state.savedPrejudgmentState.prejudgmentStartDate) {
                inputUpdates.prejudgmentStartDate = state.savedPrejudgmentState.prejudgmentStartDate;
            }
            
            // Check if we have special damages to restore
            const hasSpecialDamages = state.savedPrejudgmentState.specialDamages && 
                                     state.savedPrejudgmentState.specialDamages.length > 0;
                                     
            // Check if we have payments to restore
            const hasPayments = state.savedPrejudgmentState.payments &&
                               state.savedPrejudgmentState.payments.length > 0;
            
            // Prepare result updates
            const resultUpdates = {};
            
            // Add special damages to results if they exist
            if (hasSpecialDamages) {
                resultUpdates.specialDamages = [...state.savedPrejudgmentState.specialDamages];
                resultUpdates.specialDamagesTotal = state.savedPrejudgmentState.specialDamages.reduce(
                    (sum, damage) => sum + damage.amount, 0
                );
                resultUpdates.prejudgmentResult = {
                    ...state.savedPrejudgmentState.prejudgmentResult
                };
            }
            
            // Add payments to results if they exist
            if (hasPayments) {
                resultUpdates.payments = [...state.savedPrejudgmentState.payments];
            }
            
            // If we have result updates, return them along with input updates
            if (Object.keys(resultUpdates).length > 0) {
                return {
                    inputs: {
                        ...state.inputs,
                        ...inputUpdates
                    },
                    results: {
                        ...state.results,
                        ...resultUpdates
                    }
                };
            } else if (Object.keys(inputUpdates).length > 0) {
                // If no result updates but we have input updates, just restore those
                return {
                    inputs: {
                        ...state.inputs,
                        ...inputUpdates
                    }
                };
            }
        }
        return {}; // Return empty object if no saved state to restore
    }),

    /**
     * Resets the store to its initial state
     * @param {boolean} useDefaults - Whether to use default values for dates (true) or null values (false)
     */
    resetStore: (useDefaults = false) => {
        let inputDateValues = {
            prejudgmentStartDate: null,
            postjudgmentEndDate: null,
            dateOfJudgment: null,
            nonPecuniaryJudgmentDate: null,
            costsAwardedDate: null
        };
        
        let finalCalculationDate = null;
        
        // If useDefaults is true, calculate default dates
        if (useDefaults) {
            // Calculate current dates for defaults
            const today = normalizeDate(new Date());
            
            // Calculate dates for defaults
            const millisecondsPerDay = 24 * 60 * 60 * 1000;
            const date185DaysBefore = normalizeDate(new Date(today.getTime() - 185 * millisecondsPerDay)); // 185 days before today
            const dateOneYearAgo = normalizeDate(new Date(today.getTime() - 365 * millisecondsPerDay)); // One year ago
            
            inputDateValues = {
                prejudgmentStartDate: dateOneYearAgo,     // Default to one year ago
                postjudgmentEndDate: today,               // Default to today
                dateOfJudgment: date185DaysBefore,        // Default to 185 days before today
                nonPecuniaryJudgmentDate: date185DaysBefore, // Also set to 185 days before today
                costsAwardedDate: date185DaysBefore         // Also set to 185 days before today
            };
            
            finalCalculationDate = today; // Set to today
        }
        
        return set({
            inputs: {
                ...inputDateValues,
            judgmentAwarded: 0,
            nonPecuniaryAwarded: 0,
            costsAwarded: 0,
            jurisdiction: 'BC',
            showPrejudgment: true,
            showPostjudgment: true,
            showPerDiem: true,
            userEnteredPrejudgmentInterest: 0, // Added for editable prejudgment interest
            isValid: true,
            validationMessage: ''
            },
            savedPrejudgmentState: {
                specialDamages: [],
                prejudgmentResult: {
                    details: [],
                    total: 0,
                    principal: 0,
                    finalPeriodDamageInterestDetails: []
                },
                payments: [] // Reset saved payments
            },
            results: {
                specialDamages: [],
                specialDamagesTotal: 0,
                prejudgmentResult: {
                    details: [],
                    total: 0,
                    principal: 0,
                    finalPeriodDamageInterestDetails: []
                },
                postjudgmentResult: {
                    details: [],
                    total: 0
                },
                judgmentTotal: 0,
                totalOwing: 0,
                perDiem: 0,
                finalCalculationDate: finalCalculationDate,
                payments: useDefaults ? [{ date: '2021-10-13', amount: 500 }] : [] // Include default payment if useDefaults is true
            }
        });
    },

    /**
     * Initializes the store with default values
     * @param {Object} defaultValues - The default values to initialize with
     */
    initializeStore: (defaultValues) => set((state) => ({
        inputs: {
            ...state.inputs,
            ...(defaultValues?.inputs || {})
        },
        results: {
            ...state.results,
            ...(defaultValues?.results || {})
        }
    }))
}));

// Create a hook-like API for the store
const useStore = {
  getState: store.getState,
  setState: store.setState,
  subscribe: store.subscribe,
  destroy: store.destroy
};

export default useStore;
