import interestRatesData from './interestRates.js';
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
    parseCurrency
} from './utils.currency.js';
import useStore from './store.js';

/**
 * Collects special damages data from the prejudgment table and updates the Zustand store.
 * @returns {Array<object>} Array of special damages objects with date, description, and amount.
 */
function collectSpecialDamages() {
    const specialDamages = [];
    const rows = elements.prejudgmentTableBody.querySelectorAll('.special-damages-row');
    
    rows.forEach(row => {
        const dateInput = row.querySelector('.special-damages-date');
        const descInput = row.querySelector('.special-damages-description');
        const amountInput = row.querySelector('.special-damages-amount');
        
        if (dateInput && descInput && amountInput) {
            // Get the date from the input field in YYYY-MM-DD format
            const dateValue = dateInput.value; // Date is already YYYY-MM-DD from input
            
            // No conversion needed, store directly as YYYY-MM-DD
            
            const description = descInput.value.trim() || descInput.placeholder;
            const amount = parseCurrency(amountInput.value);
            
            if (dateValue && amount > 0) { // Use dateValue directly
                specialDamages.push({
                    date: dateValue, // Store as YYYY-MM-DD
                    description,
                    amount
                });
            }
        }
    });
    
    // Update Zustand store with the special damages
    useStore.getState().setSpecialDamages(specialDamages);
    
    return specialDamages;
}

/**
 * Logs a validation error to the console
 * @param {string} message - The error message to log
 */
function logValidationError(message) {
    console.warn("Validation error:", message);
}

/**
 * Handles invalid inputs by displaying appropriate messages and updating the UI.
 * @param {object} inputs - The input values object.
 * @param {string} validationMessage - The validation message to display.
 */
function handleInvalidInputs(inputs, validationMessage) {
    console.warn("Recalculation skipped due to invalid inputs:", validationMessage);
    
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
    
    // Check if the validation error is only related to the postjudgment date
    // and if the postjudgment section is hidden
    let isPostjudgmentOnlyError = false;
    if (!inputs.showPostjudgment && 
        inputs.dateOfJudgment && 
        inputs.nonPecuniaryJudgmentDate && 
        inputs.costsAwardedDate && 
        (inputs.showPrejudgment ? inputs.prejudgmentStartDate : true)) {
        // All other required dates are valid, so this must be a postjudgment-only error
        isPostjudgmentOnlyError = true;
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
        validationError: !isPostjudgmentOnlyError, // Only set validation error if it's not a postjudgment-only error when hidden
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
    console.error(message);
    
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
            console.warn("Prejudgment calculation skipped: Invalid date range (start date vs judgment date) or zero pecuniary judgment amount.");
            // Ensure structure is maintained even if skipped
            prejudgmentResult = { details: [], total: 0, principal: inputs.judgmentAwarded, finalPeriodDamageInterestDetails: [] };
        }
    } else {
        console.log("Prejudgment calculation skipped: Checkbox unchecked.");
        // When checkbox is unchecked, use the user-entered value for prejudgment interest
        if (inputs.userEnteredPrejudgmentInterest !== undefined) {
            prejudgmentResult.total = inputs.userEnteredPrejudgmentInterest;
        }
        // Even if skipped, the principal used for the total row includes special damages
        prejudgmentResult.principal = inputs.judgmentAwarded + specialDamagesTotal;
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
        console.log("Using calculated prejudgment interest:", prejudgmentInterestAmount);
    } else {
        // When checkbox is unchecked, use the user-entered amount
        prejudgmentInterestAmount = inputs.userEnteredPrejudgmentInterest || 0;
        console.log("Using user-entered prejudgment interest:", prejudgmentInterestAmount);
    }
    
    // This total includes the original awards, prejudgment interest (calculated or user-entered), AND special damages total
    const total = inputs.judgmentAwarded + prejudgmentInterestAmount + inputs.nonPecuniaryAwarded + inputs.costsAwarded + specialDamagesTotal;
    console.log("Judgment total calculated:", total);
    return total;
}

/**
 * Calculates postjudgment interest based on inputs and judgment total.
 * @param {object} inputs - The input values object.
 * @param {number} judgmentTotal - The judgment total.
 * @param {object} interestRatesData - The interest rates data.
 * @returns {object} An object containing postjudgment result and final calculation date.
 */
function calculatePostjudgmentInterest(inputs, judgmentTotal, interestRatesData) {
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
            // Postjudgment principal is the total judgment amount (including prejudgment interest on pecuniary)
            const postjudgmentPrincipal = judgmentTotal;

            if (postjudgmentPrincipal > 0) {
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
                     postjudgmentPrincipal, // Initial principal for postjudgment
                     interestRatesData
                 );
            } else {
                 postjudgmentResult = { details: [], total: 0 }; // Ensure structure if principal is 0
            }
        } else {
             console.warn("Postjudgment calculation skipped: Postjudgment End Date is before the latest judgment date or invalid.");
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
    
    // Log the components of the total for debugging
    console.log("Final total calculation:");
    console.log("  Judgment total:", judgmentTotal);
    console.log("  Postjudgment interest:", postjudgmentResult.total);
    console.log("  Total owing:", totalOwing);
    
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
    // 1. Get and Validate Inputs
    const inputs = getInputValues();
    
    // Special case: If validation failed but it's only because of a hidden postjudgment date,
    // we should proceed with the calculation and not show an error
    if (!inputs.isValid) {
        // Check if all other required dates are valid
        const otherDatesValid = 
            inputs.dateOfJudgment && 
            inputs.nonPecuniaryJudgmentDate && 
            inputs.costsAwardedDate && 
            (inputs.showPrejudgment ? inputs.prejudgmentStartDate : true);
            
        // If postjudgment is hidden and all other dates are valid, proceed anyway
        if (!inputs.showPostjudgment && otherDatesValid) {
            // Continue with calculation
            console.log("Proceeding with calculation despite missing postjudgment date (section is hidden)");
            
            // Clear any validation error in the store
            useStore.getState().setResult('validationError', false);
            useStore.getState().setResult('validationMessage', '');
        } else {
            // Handle truly invalid inputs
            handleInvalidInputs(inputs, inputs.validationMessage);
            return;
        }
    }

    // Check if rates exist for the selected jurisdiction
    if (!interestRatesData[inputs.jurisdiction] || interestRatesData[inputs.jurisdiction].length === 0) {
        handleMissingRates(inputs, inputs.jurisdiction);
        return;
    }

    // 2. Collect Special Damages (needed for both prejudgment calc and totals)
    const specialDamages = collectSpecialDamages();
    const specialDamagesTotal = useStore.getState().results.specialDamagesTotal;

    // 3. Calculate Prejudgment Interest
    const prejudgmentResult = calculatePrejudgmentInterest(inputs, specialDamagesTotal, interestRatesData);
    
    // Update Zustand store with prejudgment results
    useStore.getState().setPrejudgmentResult(prejudgmentResult);

    // Calculate the total principal including special damages for the footer display
    const totalPrincipalForFooter = inputs.judgmentAwarded + specialDamagesTotal;

    // 4. Update Prejudgment Table
    updateInterestTable(
        elements.prejudgmentTableBody,
        elements.prejudgmentPrincipalTotalEl,
        elements.prejudgmentInterestTotalEl,
        useStore.getState().results.prejudgmentResult, // Pass the prejudgment result
        totalPrincipalForFooter // Pass the specific footer principal
    );

    // 5. Calculate Base Total for Postjudgment and Summary
    const judgmentTotal = calculateJudgmentTotal(inputs, prejudgmentResult, specialDamagesTotal);
    
    // Update Zustand store with judgment total
    useStore.getState().setResult('judgmentTotal', judgmentTotal);

    // 6. Calculate Postjudgment Interest
    const { postjudgmentResult, finalCalculationDate } = calculatePostjudgmentInterest(inputs, judgmentTotal, interestRatesData);
    
    // Update Zustand store with postjudgment results and final calculation date
    useStore.getState().setPostjudgmentResult(postjudgmentResult);
    useStore.getState().setResult('finalCalculationDate', finalCalculationDate);
    
    // 7. Update Postjudgment Table
    updateInterestTable(
        elements.postjudgmentTableBody,
        null, // No principal total element for postjudgment
        elements.postjudgmentInterestTotalEl,
        useStore.getState().results.postjudgmentResult, // Pass the postjudgment result
        null // No specific footer principal for postjudgment
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
}

// Export the recalculate function for use in calculator.ui.js
export { recalculate };
