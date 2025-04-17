import interestRatesData from './interestRates.js';
import { calculateInterestPeriods, calculatePerDiem } from './calculations.js';
import {
    elements,
    getInputValues,
    updateInterestTable,
    updateSummaryTable,
    clearResults,
    togglePrejudgmentVisibility,
    togglePostjudgmentVisibility,
    togglePerDiemVisibility,
    setDefaultInputValues,
    setupCurrencyInputListeners
} from './domUtils.js';
import { 
    formatDateForInput, 
    formatDateLong, 
    formatDateForDisplay, 
    parseCurrency, 
    parseDateInput,
    normalizeDate,
    dateBefore,
    dateAfter,
    dateOnOrBefore,
    dateOnOrAfter,
    datesEqual
} from './utils.js';
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
 * Handles invalid inputs by displaying appropriate messages and updating the UI.
 * @param {object} inputs - The input values object.
 * @param {string} validationMessage - The validation message to display.
 */
function handleInvalidInputs(inputs, validationMessage) {
    console.warn("Recalculation skipped due to invalid inputs:", validationMessage);
    alert(validationMessage || "Please check the input values."); // Show validation message
    clearResults(); // Assumes clearResults handles new tables
    
    // Show base total (Judgment + Non-Pecuniary + Costs) even if dates are invalid
    const baseTotal = (inputs.judgmentAwarded || 0) + (inputs.nonPecuniaryAwarded || 0) + (inputs.costsAwarded || 0);
    
    // Use provided dates if available, otherwise fallback defaults
    const today = new Date();
    const defaultPrejudgmentStartDate = inputs.prejudgmentStartDate || new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
    const defaultJudgmentDate = inputs.dateOfJudgment || new Date(today.getFullYear() -1, today.getMonth(), today.getDate());
    const defaultPostjudgmentEndDate = inputs.postjudgmentEndDate || today;
    
    // Update Zustand store with error state
    useStore.getState().setResults({
        specialDamages: [],
        specialDamagesTotal: 0,
        prejudgmentResult: { details: [], total: 0, principal: 0, finalPeriodDamageInterestDetails: [] },
        postjudgmentResult: { details: [], total: 0 },
        judgmentTotal: baseTotal,
        totalOwing: baseTotal,
        perDiem: 0,
        finalCalculationDate: defaultPostjudgmentEndDate
    });
    
    // Update summary table using Zustand store
    updateSummaryTable(useStore, recalculate);
    elements.summaryTotalLabelEl.textContent = 'TOTAL OWING (Inputs Invalid)';
}

/**
 * Handles the case when interest rates are not available for the selected jurisdiction.
 * @param {object} inputs - The input values object.
 * @param {string} jurisdiction - The selected jurisdiction.
 */
function handleMissingRates(inputs, jurisdiction) {
    const message = `Interest rates are not available for the selected jurisdiction: ${jurisdiction}.`;
    console.error(message);
    alert(message);
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
        finalCalculationDate: inputs.postjudgmentEndDate
    });
    
    // Update summary table using Zustand store
    updateSummaryTable(useStore, recalculate);
    elements.summaryTotalLabelEl.textContent = `TOTAL OWING (${jurisdiction} Rates Unavailable)`;
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
        // Prejudgment ends the day *before* the pecuniary judgment date
        const prejudgmentEndDate = new Date(inputs.dateOfJudgment);
        prejudgmentEndDate.setUTCDate(prejudgmentEndDate.getUTCDate() - 1);

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
        // Even if skipped, the principal used for the total row includes special damages
        prejudgmentResult.principal = inputs.judgmentAwarded + specialDamagesTotal;
    }
    
    return prejudgmentResult;
}

/**
 * Updates the prejudgment table with the calculated results.
 * @param {object} inputs - The input values object.
 * @param {object} prejudgmentResult - The prejudgment calculation result.
 * @param {number} totalPrincipalForFooter - The total principal for the footer.
 */
function updatePrejudgmentTable(inputs, prejudgmentResult, totalPrincipalForFooter) {
    // Update Prejudgment Table using state
    updateInterestTable(
        elements.prejudgmentTableBody,
        elements.prejudgmentPrincipalTotalEl,
        elements.prejudgmentInterestTotalEl,
        prejudgmentResult, // Pass the prejudgment result
        totalPrincipalForFooter // Pass the specific footer principal
    );

    // We no longer need to update the prejudgment table footer label
    // as it has been removed from the HTML structure
}

/**
 * Calculates the judgment total based on inputs and prejudgment result.
 * @param {object} inputs - The input values object.
 * @param {object} prejudgmentResult - The prejudgment calculation result.
 * @param {number} specialDamagesTotal - The total of special damages.
 * @returns {number} The judgment total.
 */
function calculateJudgmentTotal(inputs, prejudgmentResult, specialDamagesTotal) {
    // This total includes the original awards, calculated prejudgment interest, AND special damages total
    return inputs.judgmentAwarded + prejudgmentResult.total + inputs.nonPecuniaryAwarded + inputs.costsAwarded + specialDamagesTotal;
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
             // Visually reset the dynamic input if it exists and is different
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
 * Updates the postjudgment table with the calculated results.
 * @param {object} postjudgmentResult - The postjudgment calculation result.
 */
function updatePostjudgmentTable(postjudgmentResult) {
    // Update Postjudgment Table using state
    updateInterestTable(
        elements.postjudgmentTableBody,
        null, // No principal total element for postjudgment
        elements.postjudgmentInterestTotalEl,
        postjudgmentResult, // Pass the postjudgment result
        null // No specific footer principal for postjudgment
    );
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
    // 1. Get and Validate Inputs
    const inputs = getInputValues();
    
    if (!inputs.isValid) {
        handleInvalidInputs(inputs, inputs.validationMessage);
        return;
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
    updatePrejudgmentTable(inputs, useStore.getState().results.prejudgmentResult, totalPrincipalForFooter);

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
    updatePostjudgmentTable(useStore.getState().results.postjudgmentResult);

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


/**
 * Sets up all event listeners for the calculator inputs.
 */
function setupEventListeners() {
    // Listen for the special-damages-updated custom event
    document.addEventListener('special-damages-updated', () => {
        console.log('Special damages updated, recalculating...');
        recalculate();
    });
    // Check if elements exist before adding listeners
    const requiredElements = [
        elements.jurisdictionSelect, elements.showPrejudgmentCheckbox, elements.showPostjudgmentCheckbox,
        elements.judgmentDateInput
    ];
    if (requiredElements.some(el => !el)) {
        console.error("Cannot setup listeners: One or more essential static input/control elements are missing.");
        return;
    }
    
    // Set up event listener for judgment date input
    import('./dom/setup.js').then(module => {
        module.setupCustomDateInputListeners(elements.judgmentDateInput, recalculate);
    });

    // Note: Listeners for ALL dynamic inputs (dates and amounts) are added in updateSummaryTable

    // Jurisdiction select
    elements.jurisdictionSelect.addEventListener('change', () => {
        const newJurisdiction = elements.jurisdictionSelect.value;
        console.log(`Jurisdiction changed to ${newJurisdiction}. Recalculating...`);
        
        // Update the Zustand store
        useStore.getState().setInput('jurisdiction', newJurisdiction);
        
        recalculate(); // Recalculate when jurisdiction changes
    });

    // Show Prejudgment checkbox
    elements.showPrejudgmentCheckbox.addEventListener('change', () => {
        // Pass 'recalculate' as the callback function
        togglePrejudgmentVisibility(false, recalculate);
    });

    // Show Postjudgment checkbox
    elements.showPostjudgmentCheckbox.addEventListener('change', () => {
        // Pass 'recalculate' as the callback function
        togglePostjudgmentVisibility(false, recalculate);
    });

    // Show Per Diem checkbox
    elements.showPerDiemCheckbox.addEventListener('change', () => {
        // Pass 'recalculate' as the callback function
        togglePerDiemVisibility(false, recalculate);
    });

    // Optional: Listeners for File No and Registry (if they should trigger anything)
    // elements.fileNoInput.addEventListener('change', someFunction);
    // elements.registryInput.addEventListener('change', someFunction);
}

/**
 * Initializes the calculator when the DOM is fully loaded.
 */
function initializeCalculator() {
    // Ensure all essential elements are present before proceeding
     const essentialElements = [
         // Inputs & Controls
         elements.jurisdictionSelect, elements.showPrejudgmentCheckbox, elements.showPostjudgmentCheckbox,
         // Display Sections & Tables
         elements.prejudgmentSection, elements.postjudgmentSection,
         elements.prejudgmentTableBody, elements.prejudgmentPrincipalTotalEl, elements.prejudgmentInterestTotalEl,
         elements.postjudgmentTableBody, elements.postjudgmentInterestTotalEl,
         elements.summaryTableBody, elements.summaryTotalLabelEl, elements.summaryTotalEl, elements.summaryPerDiemEl
     ];

     if (essentialElements.some(el => !el)) {
         console.error("Initialization failed: Essential DOM elements are missing. Check HTML structure, data attributes, and domUtils.js element mapping.");
         alert("Error initializing the calculator. Please check the console for details.");
         return; // Stop initialization
     }

    console.log("Initializing Calculator...");
    setDefaultInputValues();
    setupEventListeners();
    togglePrejudgmentVisibility(true, null);
    togglePostjudgmentVisibility(true, null);
    togglePerDiemVisibility(true, null);

    // --- Perform initial population of summary table to create dynamic inputs ---
    const today = new Date();
    const defaultPostjudgmentEndDate = new Date(today);
    const defaultJudgmentDate = new Date(2023, 4, 1); // months are 0-indexed
    const defaultPrejudgmentStartDate = new Date(2019, 2, 1); // months are 0-indexed

    const defaultAmount = 0;
    const pecuniaryDefaultAmount = 10000;
    
    // Set default value for judgment date input
    if (elements.judgmentDateInput) {
        elements.judgmentDateInput.value = formatDateForInput(defaultJudgmentDate);
    }
    
    // Initialize default values
    const defaultInputs = {
        prejudgmentStartDate: defaultPrejudgmentStartDate,
        postjudgmentEndDate: defaultPostjudgmentEndDate,
        dateOfJudgment: defaultJudgmentDate,
        nonPecuniaryJudgmentDate: defaultJudgmentDate,
        costsAwardedDate: defaultJudgmentDate,
        judgmentAwarded: pecuniaryDefaultAmount,
        nonPecuniaryAwarded: defaultAmount,
        costsAwarded: defaultAmount,
        jurisdiction: 'BC',
        showPrejudgment: true,
        showPostjudgment: true,
        showPerDiem: true,
        isValid: true,
        validationMessage: ''
    };
    
    const defaultResults = {
        specialDamages: [],
        specialDamagesTotal: 0,
        prejudgmentResult: { details: [], total: 0, principal: 0, finalPeriodDamageInterestDetails: [] },
        postjudgmentResult: { details: [], total: 0 },
        judgmentTotal: 0,
        totalOwing: 0,
        perDiem: 0,
        finalCalculationDate: defaultPostjudgmentEndDate
    };
    
    // Initialize Zustand store with default values
    useStore.getState().initializeStore({
        inputs: defaultInputs,
        results: defaultResults
    });
    
    // Update summary table using the Zustand store
    updateSummaryTable(useStore, recalculate);
    // --- End initial population ---

    recalculate(); // Perform initial calculation based on default state
    console.log("Calculator Initialized.");
}

// --- Entry Point ---
// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initializeCalculator);
