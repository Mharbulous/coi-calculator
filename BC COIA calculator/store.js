
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
        }
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
        finalCalculationDate: null
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
                }
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
            
            // If we have special damages, restore both inputs and results
            if (hasSpecialDamages) {
                return {
                    inputs: {
                        ...state.inputs,
                        ...inputUpdates
                    },
                    results: {
                        ...state.results,
                        specialDamages: [...state.savedPrejudgmentState.specialDamages],
                        specialDamagesTotal: state.savedPrejudgmentState.specialDamages.reduce(
                            (sum, damage) => sum + damage.amount, 0
                        ),
                        prejudgmentResult: {
                            ...state.savedPrejudgmentState.prejudgmentResult
                        }
                    }
                };
            } else if (Object.keys(inputUpdates).length > 0) {
                // If no special damages but we have saved inputs, just restore those
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
                }
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
                finalCalculationDate: finalCalculationDate
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
    })),

    /**
     * Saves the current application state to localStorage
     * Used when navigating to Stripe checkout to maintain user data during payment flow
     * @returns {boolean} Whether state was successfully saved
     */
    saveStateToLocalStorage: () => {
        try {
            // Get current state
            const state = store.getState();
            
            // Helper function to ensure date objects are serializable
            const serializeDate = (date) => {
                if (!date) return null;
                if (date instanceof Date) {
                    return date.toISOString();
                }
                return date; // If already a string or other format
            };
            
            // Create a serializable copy with proper date handling
            const stateToSave = {
                inputs: { 
                    ...state.inputs,
                    // Ensure dates are properly serialized
                    prejudgmentStartDate: serializeDate(state.inputs.prejudgmentStartDate),
                    postjudgmentEndDate: serializeDate(state.inputs.postjudgmentEndDate),
                    dateOfJudgment: serializeDate(state.inputs.dateOfJudgment),
                    nonPecuniaryJudgmentDate: serializeDate(state.inputs.nonPecuniaryJudgmentDate),
                    costsAwardedDate: serializeDate(state.inputs.costsAwardedDate)
                },
                results: {
                    specialDamages: [...state.results.specialDamages],
                    specialDamagesTotal: state.results.specialDamagesTotal,
                    prejudgmentResult: { ...state.results.prejudgmentResult },
                    postjudgmentResult: { ...state.results.postjudgmentResult },
                    judgmentTotal: state.results.judgmentTotal,
                    totalOwing: state.results.totalOwing,
                    perDiem: state.results.perDiem,
                    finalCalculationDate: serializeDate(state.results.finalCalculationDate)
                }
            };
            
            console.log('Saving state:', stateToSave);
            
            // Store in localStorage with timestamp
            localStorage.setItem('coi_calculator_state', JSON.stringify({
                data: stateToSave,
                timestamp: Date.now()
            }));
            
            return true;
        } catch (error) {
            console.error('Failed to save state to localStorage:', error);
            return false;
        }
    },

    /**
     * Restores application state from localStorage
     * @param {boolean} fallbackToDefaults - Whether to use defaults if restore fails
     * @returns {boolean} Whether state was successfully restored
     */
    restoreStateFromLocalStorage: (fallbackToDefaults = true) => {
        try {
            // Get saved state from localStorage
            const savedStateJSON = localStorage.getItem('coi_calculator_state');
            if (!savedStateJSON) {
                if (fallbackToDefaults) {
                    // Initialize with default values instead
                    store.getState().resetStore(true);
                    return true;
                }
                return false;
            }
            
            const savedState = JSON.parse(savedStateJSON);
            
            // Check if state is too old (optional, 30 minutes expiration)
            const MAX_AGE = 30 * 60 * 1000; // 30 minutes
            if (Date.now() - savedState.timestamp > MAX_AGE) {
                // State is too old, clean it up
                localStorage.removeItem('coi_calculator_state');
                
                if (fallbackToDefaults) {
                    store.getState().resetStore(true);
                    return true;
                }
                return false;
            }
            
            // Helper function to deserialize dates from ISO strings
            const deserializeDate = (dateStr) => {
                if (!dateStr) return null;
                try {
                    return new Date(dateStr);
                } catch (error) {
                    console.error('Error parsing date:', dateStr, error);
                    return null;
                }
            };
            
            // Make a copy of the saved state data and convert date strings back to Date objects
            const stateData = JSON.parse(JSON.stringify(savedState.data)); // Deep clone
            
            // Convert date strings in inputs back to Date objects
            if (stateData.inputs) {
                stateData.inputs.prejudgmentStartDate = deserializeDate(stateData.inputs.prejudgmentStartDate);
                stateData.inputs.postjudgmentEndDate = deserializeDate(stateData.inputs.postjudgmentEndDate);
                stateData.inputs.dateOfJudgment = deserializeDate(stateData.inputs.dateOfJudgment);
                stateData.inputs.nonPecuniaryJudgmentDate = deserializeDate(stateData.inputs.nonPecuniaryJudgmentDate);
                stateData.inputs.costsAwardedDate = deserializeDate(stateData.inputs.costsAwardedDate);
            }
            
            // Convert date in results
            if (stateData.results) {
                stateData.results.finalCalculationDate = deserializeDate(stateData.results.finalCalculationDate);
            }
            
            console.log('Restoring state:', stateData);
            
            // Restore state with converted dates
            store.setState(stateData);
            
            // Clean up after successful restore
            localStorage.removeItem('coi_calculator_state');
            
            return true;
        } catch (error) {
            console.error('Failed to restore state from localStorage:', error);
            
            if (fallbackToDefaults) {
                store.getState().resetStore(true);
                return true;
            }
            return false;
        }
    }
}));

// Create a hook-like API for the store
const useStore = {
  getState: store.getState,
  setState: store.setState,
  subscribe: store.subscribe,
  destroy: store.destroy
};

export default useStore;
