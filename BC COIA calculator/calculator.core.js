// Import getInterestRates function from Firebase integration instead of using local rates
import { getInterestRates } from './firebaseIntegration.js';

// Initialize with empty rates data structure - will be populated with Firebase data
let interestRatesData = {};

// Flag to track if rates have been loaded
let ratesLoaded = false;

// Async function to load rates from Firebase
async function loadRatesFromFirebase() {
    try {
        const result = await getInterestRates();
        // Store the rates for use in calculations
        interestRatesData = result.rates;
        ratesLoaded = true;
        
        // Trigger a recalculation after rates are loaded
        if (typeof window !== 'undefined') {
            // Only run in browser context
            setTimeout(() => {
                recalculate();
            }, 100);
        }
        
        return true;
    } catch (error) {
        console.error("Error loading Firebase rates in calculator core:", error);
        // Propagate the error to the UI
        throw error;
    }
}

// Trigger Firebase rate loading when this module is imported
loadRatesFromFirebase().catch(error => {
    // Log error but don't show debugging info
    console.error("Failed to load interest rates from Firebase:", error);
    // Show an alert to inform the user about the error
    alert("Error: Could not load interest rates from Firebase. Please check your internet connection and try again.");
});
import { logger } from './util.logger.js'; // Import logger
import { calculateInterestPeriods, calculatePerDiem } from './calculations.js';
import {
    elements,
    getInputValues,
    updateInterestTable,
    updateSummaryTable,
    clearResults
} from './domUtils.js';
import { 
    formatDateForInput, 
    formatDateLong, 
    formatDateForDisplay, 
    parseDateInput,
    normalizeDate,
    dateBefore,
    dateAfter,
    dateOnOrBefore,
    dateOnOrAfter,
    datesEqual
} from './utils.date.js';
import {
    parseCurrency,
    formatCurrencyForDisplay
} from './utils.currency.js';
import useStore from './store.js';
import { destroyAllSpecialDamagesDatePickers, destroyAllPaymentDatePickers } from './dom/datepickers.js'; // Import cleanup functions
// Page break indicators removed

/**
 * Collects payment data from the prejudgment table and updates the Zustand store.
 * If the prejudgment checkbox is unchecked, returns the saved payments from the store.
 * @returns {Array<object>} Array of payment objects with date and amount.
 */
function collectPayments() {
    console.log("[DEBUG] collectPayments: Starting payment collection");
    
    const currentState = useStore.getState();
    const showPrejudgment = currentState.inputs.showPrejudgment;

    console.log("[DEBUG] collectPayments: showPrejudgment =", showPrejudgment);
    console.log("[DEBUG] collectPayments: Initial store payments (before any logic in this function):", JSON.stringify(currentState.results.payments));

    // If prejudgment is hidden and we have saved payments, use those
    if (!showPrejudgment &&
        currentState.savedPrejudgmentState &&
        currentState.savedPrejudgmentState.payments) { // Check for existence, not length, to allow empty saved array
        
        console.log("[DEBUG] collectPayments: Using saved prejudgment state payments:", 
                   JSON.stringify(currentState.savedPrejudgmentState.payments));
        return currentState.savedPrejudgmentState.payments;
    }
    
    // Otherwise, always return payments directly from the store.
    // DOM scraping and store updates based on DOM content should not happen here,
    // as the store is the single source of truth and is updated by specific actions.
    const storePayments = currentState.results.payments || [];
    console.log("[DEBUG] collectPayments: Returning current store payments:", JSON.stringify(storePayments));
    return storePayments;
}

/**
 * Collects special damages data from the Zustand store.
 * If the prejudgment checkbox is unchecked, returns the saved special damages from the store.
 * @returns {Array<object>} Array of special damages objects with date, description, and amount.
 */
function collectSpecialDamages() {
    const currentState = useStore.getState();
    const showPrejudgment = currentState.inputs.showPrejudgment;

    console.log("[DEBUG] collectSpecialDamages: showPrejudgment =", showPrejudgment);
    console.log("[DEBUG] collectSpecialDamages: Initial store special damages (before any logic in this function):", JSON.stringify(currentState.results.specialDamages));

    // If prejudgment is hidden and we have saved special damages, use those
    if (!showPrejudgment &&
        currentState.savedPrejudgmentState &&
        currentState.savedPrejudgmentState.specialDamages) { // Check for existence, not length
        
        console.log("[DEBUG] collectSpecialDamages: Using saved prejudgment state special damages:", 
                   JSON.stringify(currentState.savedPrejudgmentState.specialDamages));
        return currentState.savedPrejudgmentState.specialDamages;
    }
    
    // Otherwise, always return special damages directly from the store.
    const storeSpecialDamages = currentState.results.specialDamages || [];
    console.log("[DEBUG] collectSpecialDamages: Returning current store special damages:", JSON.stringify(storeSpecialDamages));
    return storeSpecialDamages;
}

/**
 * Logs a validation error to the console
 * @param {string} message - The error message to log
 */
function logValidationError(message) {
    // Validation errors are now silently handled
}

/**
 * Handles invalid inputs by displaying appropriate messages and updating the UI.
 * @param {object} inputs - The input values object.
 * @param {string} validationMessage - The validation message to display.
 */
function handleInvalidInputs(inputs, validationMessage) {
    // Log the validation error
    logValidationError(validationMessage || "Please check the input values.");
    
    clearResults(); // Assumes clearResults handles new tables
    
    // Show base total (Judgment + Non-Pecuniary + Costs) even if dates are invalid
    const baseTotal = (inputs.judgmentAwarded || 0) + (inputs.nonPecuniaryAwarded || 0) + (inputs.costsAwarded || 0);
    
    // Use provided dates if available, otherwise fallback defaults
    const today = new Date();
    const defaultPrejudgmentStartDate = inputs.prejudgmentStartDate || new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
    const defaultJudgmentDate = inputs.dateOfJudgment || new Date(today.getFullYear() -1, today.getMonth(), today.getDate());
    const defaultPostjudgmentEndDate = inputs.postjudgmentEndDate || today;
    
    // Check if the validation error is only related to hidden elements
    let isHiddenElementError = false;
    if (inputs.dateOfJudgment && 
        inputs.nonPecuniaryJudgmentDate && 
        inputs.costsAwardedDate && 
        (inputs.showPrejudgment ? inputs.prejudgmentStartDate : true) &&
        (inputs.showPostjudgment ? inputs.postjudgmentEndDate : true)) {
        // All required visible dates are valid, so this must be an error with hidden elements
        isHiddenElementError = true;
    }
    
    // Update Zustand store with error state
    useStore.getState().setResults({
        specialDamages: [],
        specialDamagesTotal: 0,
        prejudgmentResult: { details: [], total: 0, principal: 0, finalPeriodDamageInterestDetails: [] },
        postjudgmentResult: { details: [], total: 0 },
        judgmentTotal: baseTotal,
        totalOwing: baseTotal,
        perDiem: 0,
        finalCalculationDate: defaultPostjudgmentEndDate,
        validationError: !isHiddenElementError, // Only set validation error if it's not related to hidden elements
        validationMessage: validationMessage || "One or more required dates are missing or invalid."
    });
    
    // Update summary table using Zustand store
    updateSummaryTable(useStore, recalculate);
}

/**
 * Handles the case when interest rates are not available for the selected jurisdiction.
 * @param {object} inputs - The input values object.
 * @param {string} jurisdiction - The selected jurisdiction.
 */
function handleMissingRates(inputs, jurisdiction) {
    const message = `Interest rates are not available for the selected jurisdiction: ${jurisdiction}.`;
    // Log the validation error
    logValidationError(message);
    
    clearResults(); // Assumes clearResults handles new tables
    
    const baseTotal = (inputs.judgmentAwarded || 0) + (inputs.nonPecuniaryAwarded || 0) + (inputs.costsAwarded || 0); // Use || 0 for safety
    
    // Update Zustand store with error state
    useStore.getState().setResults({
        specialDamages: [],
        specialDamagesTotal: 0,
        prejudgmentResult: { details: [], total: 0, principal: 0, finalPeriodDamageInterestDetails: [] },
        postjudgmentResult: { details: [], total: 0 },
        judgmentTotal: baseTotal,
        totalOwing: baseTotal,
        perDiem: 0,
        finalCalculationDate: inputs.postjudgmentEndDate,
        validationError: true,
        validationMessage: `Interest rates are not available for the selected jurisdiction: ${jurisdiction}.`
    });
    
    // Update summary table using Zustand store
    updateSummaryTable(useStore, recalculate);
}

/**
 * Calculates prejudgment interest based on inputs.
 * @param {object} inputs - The input values object.
 * @param {number} specialDamagesTotal - The total of special damages.
 * @param {object} interestRatesData - The interest rates data.
 * @returns {object} The prejudgment result object.
 */
function calculatePrejudgmentInterest(inputs, specialDamagesTotal, interestRatesData) {
    // Prejudgment interest in BC COIA applies ONLY to pecuniary damages.
    let prejudgmentResult = { details: [], total: 0, principal: inputs.judgmentAwarded, finalPeriodDamageInterestDetails: [] }; // Initial principal is pecuniary only
    
    if (inputs.showPrejudgment) {
        // Check if we have saved prejudgment result state we can use
        const currentState = useStore.getState();
        const hasSavedState = currentState.savedPrejudgmentState && 
                             currentState.savedPrejudgmentState.prejudgmentResult && 
                             currentState.savedPrejudgmentState.prejudgmentResult.details && 
                             currentState.savedPrejudgmentState.prejudgmentResult.details.length > 0;
        
        // If we have saved state and the judgment amount hasn't changed, use the saved state
        if (hasSavedState && 
            currentState.savedPrejudgmentState.prejudgmentResult.principal === inputs.judgmentAwarded) {
            
            return { ...currentState.savedPrejudgmentState.prejudgmentResult };
        }
        
        // Otherwise calculate normally
        // Prejudgment starts from the dynamic prejudgmentStartDate
        // Prejudgment ends on the judgment date (inclusive)
        const prejudgmentEndDate = new Date(inputs.dateOfJudgment);
        // Ensure we're using the judgment date itself, not the day before
        // This is critical for one-day interest periods to work correctly

        // Only calculate if the period is valid (at least one day) and pecuniary amount > 0
        // Use normalized date comparison
        if (dateOnOrAfter(prejudgmentEndDate, inputs.prejudgmentStartDate) && inputs.judgmentAwarded > 0) {
            // Create a state object for calculations.js functions
            const stateForCalc = {
                inputs: useStore.getState().inputs,
                results: useStore.getState().results
            };
            
            // Call calculateInterestPeriods with state object
            prejudgmentResult = calculateInterestPeriods(
                stateForCalc,
                'prejudgment',
                inputs.prejudgmentStartDate, // Start date for this calc
                prejudgmentEndDate, // End date for this calc
                inputs.judgmentAwarded, // Initial principal for prejudgment
                interestRatesData
            );
        } else {
            // Ensure structure is maintained even if skipped
            prejudgmentResult = { details: [], total: 0, principal: inputs.judgmentAwarded, finalPeriodDamageInterestDetails: [] };
        }
    } else {
        
        // When checkbox is unchecked, check if we have saved state
        const currentState = useStore.getState();
        const hasSavedState = currentState.savedPrejudgmentState && 
                             currentState.savedPrejudgmentState.prejudgmentResult && 
                             currentState.savedPrejudgmentState.prejudgmentResult.details;
        
        if (hasSavedState) {
            // Use the structure from saved state but with user-entered total
            prejudgmentResult = { 
                ...currentState.savedPrejudgmentState.prejudgmentResult,
                total: inputs.userEnteredPrejudgmentInterest || 0
            };
        } else {
            // No saved state, use the user-entered value for prejudgment interest
            if (inputs.userEnteredPrejudgmentInterest !== undefined) {
                prejudgmentResult.total = inputs.userEnteredPrejudgmentInterest;
            }
            // Even if skipped, the principal used for the total row includes special damages
            prejudgmentResult.principal = inputs.judgmentAwarded + specialDamagesTotal;
        }
        
        // Don't reset the prejudgment date input value when the checkbox is unchecked
        // This preserves the user's entered date when toggling the checkbox
    }
    
    return prejudgmentResult;
}

/**
 * Calculates the judgment total based on inputs and prejudgment result.
 * @param {object} inputs - The input values object.
 * @param {object} prejudgmentResult - The prejudgment calculation result.
 * @param {number} specialDamagesTotal - The total of special damages.
 * @returns {number} The judgment total.
 */
function calculateJudgmentTotal(inputs, prejudgmentResult, specialDamagesTotal) {
    // Determine which prejudgment interest amount to use
    let prejudgmentInterestAmount = 0;
    
    if (inputs.showPrejudgment) {
        // When checkbox is checked, use the calculated amount
        prejudgmentInterestAmount = prejudgmentResult.total;
    } else {
        // When checkbox is unchecked, use the user-entered amount
        prejudgmentInterestAmount = inputs.userEnteredPrejudgmentInterest || 0;
    }
    
    // This total includes the original awards, prejudgment interest (calculated or user-entered), AND special damages total
    const total = inputs.judgmentAwarded + prejudgmentInterestAmount + inputs.nonPecuniaryAwarded + inputs.costsAwarded + specialDamagesTotal;
    return total;
}

/**
 * Calculates postjudgment interest based on inputs and principal amount.
 * @param {object} inputs - The input values object.
 * @param {number} principal - The principal amount (excluding prejudgment interest).
 * @param {object} interestRatesData - The interest rates data.
 * @returns {object} An object containing postjudgment result and final calculation date.
 */
function calculatePostjudgmentInterest(inputs, principal, interestRatesData) {
    let postjudgmentResult = { details: [], total: 0 };
    // Postjudgment starts from the *latest* of the three judgment dates
    const latestJudgmentDate = new Date(Math.max(inputs.dateOfJudgment, inputs.nonPecuniaryJudgmentDate, inputs.costsAwardedDate));
    // Postjudgment ends on the dynamic postjudgmentEndDate
    let finalCalculationDate = latestJudgmentDate; // Default to latest judgment date if postjudgment is off or invalid range

    if (inputs.showPostjudgment) {
        const postjudgmentStartDate = new Date(latestJudgmentDate); // Start from the latest judgment date

        // Ensure postjudgment end date is valid and on or after the latest judgment date
        // Use normalized date comparison
        if (inputs.postjudgmentEndDate && dateOnOrAfter(inputs.postjudgmentEndDate, postjudgmentStartDate)) {
            finalCalculationDate = inputs.postjudgmentEndDate; // Use the dynamic end date for calculation and display

            // Use the passed principal amount directly (without adding prejudgment interest)
            if (principal > 0) {
                 // Create a state object for calculations.js functions
                 const stateForCalc = {
                     inputs: useStore.getState().inputs,
                     results: useStore.getState().results
                 };
                 
                 // Call calculateInterestPeriods with state object
                 postjudgmentResult = calculateInterestPeriods(
                     stateForCalc,
                     'postjudgment',
                     postjudgmentStartDate, // Start date for this calc
                     inputs.postjudgmentEndDate, // End date for this calc
                     principal, // Initial principal for postjudgment (without prejudgment interest)
                     interestRatesData
                 );
            } else {
                 postjudgmentResult = { details: [], total: 0 }; // Ensure structure if principal is 0
            }
        } else {
             postjudgmentResult = { details: [], total: 0 }; // Ensure structure if skipped
             // If range is invalid, use latestJudgmentDate as the final date for summary display
             finalCalculationDate = latestJudgmentDate;
             
             // Don't show error notification here as it's already handled by the date picker constraints
             // Just silently reset the value if needed
             const latestJudgmentDateInputValue = formatDateForInput(latestJudgmentDate);
             if (elements.postjudgmentInterestDateInput && elements.postjudgmentInterestDateInput.value !== latestJudgmentDateInputValue) {
                 elements.postjudgmentInterestDateInput.value = latestJudgmentDateInputValue;
             }
        }
    } else {
         // If postjudgment is hidden, the final calculation date is the latest judgment date
         finalCalculationDate = latestJudgmentDate;
         
         // Don't reset the postjudgment date input value when the checkbox is unchecked
         // This preserves the user's entered date when toggling the checkbox
    }
    
    return { postjudgmentResult, finalCalculationDate };
}

/**
 * Calculates the final total and per diem.
 * @param {number} judgmentTotal - The judgment total.
 * @param {object} postjudgmentResult - The postjudgment calculation result.
 * @param {object} finalCalculationDate - The final calculation date.
 * @param {object} interestRatesData - The interest rates data.
 * @returns {object} An object containing total owing and per diem.
 */
function calculateFinalTotals(judgmentTotal, postjudgmentResult, finalCalculationDate, interestRatesData) {
    // Calculate final total and per diem
    const totalOwing = judgmentTotal + postjudgmentResult.total;
    
    
    // Create a state object for calculations.js functions with updated totalOwing
    const stateForCalc = {
        inputs: useStore.getState().inputs,
        results: {
            ...useStore.getState().results,
            totalOwing: totalOwing,
            finalCalculationDate: finalCalculationDate
        }
    };
    
    // Calculate Per Diem using state object
    const perDiem = calculatePerDiem(stateForCalc, interestRatesData);
    
    return { totalOwing, perDiem };
}

/**
 * Main function to recalculate interest based on current inputs.
 */
function recalculate() {
    // Log when recalculate is called
    // Attempt to get event type, but handle cases where window.event might not be reliable
    let eventSource = 'unknown';
    try {
        if (window.event && typeof window.event.type === 'string') {
            eventSource = window.event.type;
        }
    } catch (e) {
        // Silently ignore errors accessing window.event, as it's not always available or standard
    }
    
    logger.debug(`[calculator.core.js recalculate] Recalculate triggered. Event type hint: ${eventSource}.`);

    // More detailed log if the event type suggests it's from a special damages update
    if (eventSource === 'special-damages-updated') { 
        // This 'special-damages-updated' is the custom event dispatched from specialDamages.js
        try {
            logger.debug(`[calculator.core.js recalculate] Detailed log for 'special-damages-updated' event: Current store special damages: ${JSON.stringify(useStore.getState().results.specialDamages)}`);
        } catch (e) {
            logger.error('[calculator.core.js recalculate] Error stringifying special damages for log:', e);
        }
    }

    // 1. Get and Validate Inputs
    const inputs = getInputValues();
    
    // Special case: If validation failed but it's only because of a hidden prejudgment or postjudgment date,
    // we should proceed with the calculation and not show an error
    if (!inputs.isValid) {
        // Check if all other required dates are valid
        const otherDatesValid = 
            inputs.dateOfJudgment && 
            inputs.nonPecuniaryJudgmentDate && 
            inputs.costsAwardedDate && 
            (inputs.showPrejudgment ? inputs.prejudgmentStartDate : true) &&
            (inputs.showPostjudgment ? inputs.postjudgmentEndDate : true);
            
        // If all required visible dates are valid, proceed anyway
        if (otherDatesValid) {
            // Continue with calculation despite validation issues (hidden elements)
            
            // Clear any validation error in the store
            useStore.getState().setResult('validationError', false);
            useStore.getState().setResult('validationMessage', '');
        } else {
            // Handle truly invalid inputs
            handleInvalidInputs(inputs, inputs.validationMessage);
            return;
        }
    }

    // Check if rates have been loaded and if they exist for the selected jurisdiction
    if (!ratesLoaded) {
        // Don't show an error, just return and wait for rates to load
        return;
    }
    
    // Check if rates exist for the selected jurisdiction
    if (!interestRatesData[inputs.jurisdiction] || interestRatesData[inputs.jurisdiction].length === 0) {
        handleMissingRates(inputs, inputs.jurisdiction);
        return;
    }

    // 2. Collect Payments and Special Damages (needed for both prejudgment calc and totals)
    logger.debug(`[calculator.core.js recalculate] Before collectPayments, store payments: ${JSON.stringify(useStore.getState().results.payments)}`);
    const payments = collectPayments();
    logger.debug("[calculator.core.js recalculate] After collectPayments, payments array (raw):", payments); // Changed console.log to logger.debug
    logger.debug("[calculator.core.js recalculate] After collectPayments, payments array (JSON):", JSON.stringify(payments)); // Changed console.log to logger.debug
    const specialDamages = collectSpecialDamages();
    logger.debug("[calculator.core.js recalculate] After collectSpecialDamages, specialDamages array (raw):", specialDamages);
    logger.debug("[calculator.core.js recalculate] After collectSpecialDamages, specialDamages array (JSON):", JSON.stringify(specialDamages));
    
    // Calculate the total special damages amount
    const specialDamagesTotal = specialDamages.reduce((total, damage) => total + damage.amount, 0);
    
    // Store the special damages total in the store
    useStore.getState().setResult('specialDamagesTotal', specialDamagesTotal);

    // 3. Calculate prejudgment interest
    const prejudgmentResult = calculatePrejudgmentInterest(inputs, specialDamagesTotal, interestRatesData);
    
    // Update Zustand store with prejudgment results
    useStore.getState().setPrejudgmentResult(prejudgmentResult);

    // Calculate the total principal including special damages for the footer display
    const totalPrincipalForFooter = inputs.judgmentAwarded + specialDamagesTotal;

    // 4. Update Prejudgment Table
    // Destroy existing special damages and payment pickers BEFORE rebuilding the table
    destroyAllSpecialDamagesDatePickers(); 
    destroyAllPaymentDatePickers();
    updateInterestTable(
        elements.prejudgmentTableBody,
        elements.prejudgmentPrincipalTotalEl,
        elements.prejudgmentInterestTotalEl,
        useStore.getState().results.prejudgmentResult, // Pass the prejudgment result
        totalPrincipalForFooter, // Pass the specific footer principal
        interestRatesData // Pass interestRatesData
    );

    // 5. Calculate Base Total for Postjudgment and Summary
    const judgmentTotal = calculateJudgmentTotal(inputs, prejudgmentResult, specialDamagesTotal);
    
    // Update Zustand store with judgment total
    useStore.getState().setResult('judgmentTotal', judgmentTotal);

    // Calculate principal for postjudgment interest (excluding prejudgment interest)
    // For simple interest calculation, postjudgment interest should only be calculated on:
    // - judgmentAwarded (General Damages & Debt)
    // - nonPecuniaryAwarded
    // - costsAwarded
    // - specialDamagesTotal
    // but NOT on prejudgment interest
    const postjudgmentPrincipal = inputs.judgmentAwarded + inputs.nonPecuniaryAwarded + inputs.costsAwarded + specialDamagesTotal;

    // 6. Calculate Postjudgment Interest
    const { postjudgmentResult, finalCalculationDate } = calculatePostjudgmentInterest(inputs, postjudgmentPrincipal, interestRatesData);
    
    // Update Zustand store with postjudgment results and final calculation date
    useStore.getState().setPostjudgmentResult(postjudgmentResult);
    useStore.getState().setResult('finalCalculationDate', finalCalculationDate);
    
    // 7. Update Postjudgment Table
    updateInterestTable(
        elements.postjudgmentTableBody,
        null, // No principal total element for postjudgment
        elements.postjudgmentInterestTotalEl,
        useStore.getState().results.postjudgmentResult, // Pass the postjudgment result
        postjudgmentPrincipal, // Pass the postjudgment principal for display purposes
        interestRatesData // Pass interestRatesData
    );

    // 8. Calculate final total and per diem
    const { totalOwing, perDiem } = calculateFinalTotals(
        useStore.getState().results.judgmentTotal, 
        useStore.getState().results.postjudgmentResult, 
        finalCalculationDate, 
        interestRatesData
    );
    
    // Update Zustand store with total owing and per diem
    useStore.getState().setResults({
        totalOwing,
        perDiem
    });

    // 9. Update Summary Table using Zustand store
    updateSummaryTable(useStore, recalculate);

    // Page break indicators removed
}

// Export the recalculate function for use in calculator.ui.js
export { recalculate };
