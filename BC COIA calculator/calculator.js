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
import { formatDateForInput, formatDateLong, formatDateForDisplay, parseCurrency, parseDateInput } from './utils.js';
import useStore from './store.js';

// Create a reference to the Zustand store state to use in place of appState
let appState = useStore.getState();

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
    
    // Update appState reference with the latest state
    appState = useStore.getState();
    
    return specialDamages;
}

/**
 * Main function to recalculate interest based on current inputs.
 */
function recalculate() {
    // 1. Get and Validate Inputs
    const inputs = getInputValues();
    
    // Update appState reference with the latest state
    appState = useStore.getState();

    if (!inputs.isValid) {
        // Clear previous results and display base total if inputs are invalid
        console.warn("Recalculation skipped due to invalid inputs:", inputs.validationMessage);
        alert(inputs.validationMessage || "Please check the input values."); // Show validation message
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
        
        // Update appState reference with the latest state
        appState = useStore.getState();
        
        // Update summary table using Zustand store
        updateSummaryTable(useStore, recalculate);
        elements.summaryTotalLabelEl.textContent = 'TOTAL OWING (Inputs Invalid)';
        return;
    }

    // Check if rates exist for the selected jurisdiction
    if (!interestRatesData[inputs.jurisdiction] || interestRatesData[inputs.jurisdiction].length === 0) {
        const message = `Interest rates are not available for the selected jurisdiction: ${inputs.jurisdiction}.`;
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
        
        // Update appState reference with the latest state
        appState = useStore.getState();
        
        // Update summary table using Zustand store
        updateSummaryTable(useStore, recalculate);
        elements.summaryTotalLabelEl.textContent = `TOTAL OWING (${inputs.jurisdiction} Rates Unavailable)`;
        return;
    }

    // 2. Collect Special Damages (needed for both prejudgment calc and totals)
    // collectSpecialDamages now updates appState.results.specialDamages and appState.results.specialDamagesTotal
    const specialDamages = collectSpecialDamages();
    const specialDamagesTotal = appState.results.specialDamagesTotal;

    // 3. Calculate Prejudgment Interest (Conditional on Checkbox)
    // Prejudgment interest in BC COIA applies ONLY to pecuniary damages.
    let prejudgmentResult = { details: [], total: 0, principal: inputs.judgmentAwarded, finalPeriodDamageInterestDetails: [] }; // Initial principal is pecuniary only
    
    if (inputs.showPrejudgment) {
        // Prejudgment starts from the dynamic prejudgmentStartDate
        // Prejudgment ends the day *before* the pecuniary judgment date
        const prejudgmentEndDate = new Date(inputs.dateOfJudgment);
        prejudgmentEndDate.setUTCDate(prejudgmentEndDate.getUTCDate() - 1);

        // Only calculate if the period is valid (at least one day) and pecuniary amount > 0
        if (prejudgmentEndDate >= inputs.prejudgmentStartDate && inputs.judgmentAwarded > 0) {
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
    
    // Update Zustand store with prejudgment results
    useStore.getState().setPrejudgmentResult(prejudgmentResult);
    
    // Update appState reference with the latest state
    appState = useStore.getState();

    // Calculate the total principal including special damages for the footer display
    // Note: calculateInterestPeriods now returns the *final* principal after damages are applied within the period.
    // For the footer total, we want the initial pecuniary + *all* special damages.
    const totalPrincipalForFooter = inputs.judgmentAwarded + specialDamagesTotal;

    // Update Prejudgment Table using state
    updateInterestTable(
        elements.prejudgmentTableBody,
        elements.prejudgmentPrincipalTotalEl,
        elements.prejudgmentInterestTotalEl,
        appState.results.prejudgmentResult, // Pass the prejudgment result state
        totalPrincipalForFooter // Pass the specific footer principal
    );

    // Update Prejudgment Table Footer Label
    if (elements.prejudgmentTotalLabel) {
        if (inputs.isValid && inputs.dateOfJudgment) {
            // formatDateForDisplay now returns YYYY-MM-DD
            const formattedJudgmentDate = formatDateForDisplay(inputs.dateOfJudgment); 
            elements.prejudgmentTotalLabel.textContent = `Total at date of judgment (${formattedJudgmentDate})`;
        } else {
            // Fallback if date is invalid or not available
            elements.prejudgmentTotalLabel.textContent = 'Total'; 
        }
    } else {
        console.warn("Prejudgment total label element not found.");
    }

    // 4. Calculate Base Total for Postjudgment and Summary
    // This total includes the original awards, calculated prejudgment interest, AND special damages total
    const judgmentTotal = inputs.judgmentAwarded + prejudgmentResult.total + inputs.nonPecuniaryAwarded + inputs.costsAwarded + specialDamagesTotal;
    
    // Update appState with judgment total
    appState.results.judgmentTotal = judgmentTotal;
    
    // Update Zustand store with judgment total
    useStore.getState().setResult('judgmentTotal', judgmentTotal);

    // 5. Calculate Postjudgment Interest (Conditional on Checkbox)
    let postjudgmentResult = { details: [], total: 0 };
    // Postjudgment starts from the *latest* of the three judgment dates
    const latestJudgmentDate = new Date(Math.max(inputs.dateOfJudgment, inputs.nonPecuniaryJudgmentDate, inputs.costsAwardedDate));
    // Postjudgment ends on the dynamic postjudgmentEndDate
    let finalCalculationDate = latestJudgmentDate; // Default to latest judgment date if postjudgment is off or invalid range

    if (inputs.showPostjudgment) {
        const postjudgmentStartDate = new Date(latestJudgmentDate); // Start from the latest judgment date

        // Ensure postjudgment end date is valid and on or after the latest judgment date
        if (inputs.postjudgmentEndDate && inputs.postjudgmentEndDate >= postjudgmentStartDate) {
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
         // Visually reset the dynamic input if it exists and is different
         const latestJudgmentDateInputValue = formatDateForInput(latestJudgmentDate);
         if (elements.postjudgmentInterestDateInput && elements.postjudgmentInterestDateInput.value !== latestJudgmentDateInputValue) {
              elements.postjudgmentInterestDateInput.value = latestJudgmentDateInputValue;
         }
    }
    
    // Update Zustand store with postjudgment results and final calculation date
    useStore.getState().setPostjudgmentResult(postjudgmentResult);
    useStore.getState().setResult('finalCalculationDate', finalCalculationDate);
    
    // Update appState reference with the latest state
    appState = useStore.getState();
    
    // Update Postjudgment Table using state
    updateInterestTable(
        elements.postjudgmentTableBody,
        null, // No principal total element for postjudgment
        elements.postjudgmentInterestTotalEl,
        appState.results.postjudgmentResult, // Pass the postjudgment result state
        null // No specific footer principal for postjudgment
    );

    // Calculate final total and per diem
    const totalOwing = appState.results.judgmentTotal + appState.results.postjudgmentResult.total;
    
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
    
    // Update Zustand store with total owing and per diem
    useStore.getState().setResults({
        totalOwing,
        perDiem
    });
    
    // Update appState reference with the latest state
    appState = useStore.getState();

    // 5. Update Summary Table using Zustand store
    // updateSummaryTable can now take either appState or the Zustand store
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
        elements.jurisdictionSelect, elements.showPrejudgmentCheckbox, elements.showPostjudgmentCheckbox
    ];
    if (requiredElements.some(el => !el)) {
        console.error("Cannot setup listeners: One or more essential static input/control elements are missing.");
        return;
    }

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
    
    // Update appState reference with the latest state
    appState = useStore.getState();
    
    // Update summary table using the Zustand store
    updateSummaryTable(useStore, recalculate);
    // --- End initial population ---

    recalculate(); // Perform initial calculation based on default state
    console.log("Calculator Initialized.");
}

// --- Entry Point ---
// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initializeCalculator);
