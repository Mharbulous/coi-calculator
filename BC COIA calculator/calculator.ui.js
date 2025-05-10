import { recalculate } from './calculator.core.js';
import {
    elements,
    updateInterestTable,
    updateSummaryTable,
    togglePrejudgmentVisibility,
    togglePostjudgmentVisibility,
    togglePerDiemVisibility,
    setDefaultInputValues,
    setupCurrencyInputListeners
} from './domUtils.js';
import { initializeClearButton } from './dom/clearButton.js';
import { formatDateForInput, normalizeDate } from './utils.date.js';
import useStore from './store.js';
import { updatePagination, setupPaginationListeners } from './dom/pageBreaks.js'; // Import pagination functions
import { showFirebaseError } from './error-handling.js'; // Import error handling function

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
 * Sets up all event listeners for the calculator inputs.
 */
function setupEventListeners() {
    // Listen for the special-damages-updated custom event
    document.addEventListener('special-damages-updated', () => {
        recalculate();
        document.dispatchEvent(new CustomEvent('content-changed')); // Trigger pagination update
    });
    
    // Listen for the payment-updated custom event
    document.addEventListener('payment-updated', () => {
        // Import logger for debugging
        import('./util.logger.js').then((logger) => {
            logger.debug("Payment-updated event received in calculator.ui.js");
            
            // Log store state before recalculation
            const storeState = useStore.getState();
            logger.debug("Store state before recalculation:", {
                payments: storeState.results.payments,
                prejudgmentDetails: storeState.results.prejudgmentResult.details,
                principalTotal: storeState.results.prejudgmentResult.principal
            });
            
            recalculate();
            
            // Log store state after recalculation
            const updatedState = useStore.getState();
            logger.debug("Store state after recalculation:", {
                payments: updatedState.results.payments,
                prejudgmentDetails: updatedState.results.prejudgmentResult.details,
                principalTotal: updatedState.results.prejudgmentResult.principal
            });
            
            // Log DOM state after recalculation
            logger.debug("DOM state after recalculation:", {
                prejudgmentTableRows: elements.prejudgmentTableBody ? elements.prejudgmentTableBody.rows.length : 'Not available',
                paymentRows: elements.prejudgmentTableBody ? 
                    elements.prejudgmentTableBody.querySelectorAll('.payment-row').length : 'Not available'
            });
            
            logger.debug("Dispatching content-changed event for pagination update");
            document.dispatchEvent(new CustomEvent('content-changed')); // Trigger pagination update
        }).catch(e => {
            console.error("Failed to import logger:", e);
            recalculate();
            document.dispatchEvent(new CustomEvent('content-changed')); // Trigger pagination update
        });
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
    
    // Initialize date pickers with constraints
    import('./dom/setup.js').then(module => {
        // Initialize date pickers with constraints
        module.initializeDatePickers(recalculate);
        
        // For backward compatibility, still set up listeners for judgment date
        // (though this is now handled in initializeDatePickers)
        module.setupCustomDateInputListeners(elements.judgmentDateInput, () => {
            recalculate();
            document.dispatchEvent(new CustomEvent('content-changed')); // Trigger pagination update
        });
    });

    // Note: Listeners for ALL dynamic inputs (dates and amounts) are added in updateSummaryTable

    // Jurisdiction select
    elements.jurisdictionSelect.addEventListener('change', () => {
        const newJurisdiction = elements.jurisdictionSelect.value;
        
        // Update the Zustand store
        useStore.getState().setInput('jurisdiction', newJurisdiction);
        
        recalculate(); 
        document.dispatchEvent(new CustomEvent('content-changed')); // Trigger pagination update
    });

    // Show Prejudgment checkbox
    elements.showPrejudgmentCheckbox.addEventListener('change', () => {
        // Pass 'recalculate' as the callback function
        togglePrejudgmentVisibility(false, recalculate);
    });

    // Show Postjudgment checkbox
    elements.showPostjudgmentCheckbox.addEventListener('change', () => {
        // Pass 'recalculate' and event dispatch as callbacks
        togglePostjudgmentVisibility(false, () => {
            recalculate();
            document.dispatchEvent(new CustomEvent('content-changed')); // Trigger pagination update
        });
    });

    // Show Per Diem checkbox
    elements.showPerDiemCheckbox.addEventListener('change', () => {
        // Pass 'recalculate' and event dispatch as callbacks
        togglePerDiemVisibility(false, () => {
            recalculate();
            document.dispatchEvent(new CustomEvent('content-changed')); // Trigger pagination update
        });
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

    setDefaultInputValues();
    setupEventListeners();
    togglePrejudgmentVisibility(true, null);
    togglePostjudgmentVisibility(true, null);
    togglePerDiemVisibility(true, null);
    // Page break indicators removed

    // --- Perform initial population of summary table to create dynamic inputs ---
    const today = normalizeDate(new Date()); // Today's date
    
    // Calculate dates for defaults
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const dateTwoYearsBefore = normalizeDate(new Date(today.getTime() - 730 * millisecondsPerDay)); // 2 years before today
    const dateOneYearAgo = normalizeDate(new Date(today.getTime() - 365 * millisecondsPerDay)); // One year ago
    
    // Set default dates as per requirements
    const defaultJudgmentDate = dateTwoYearsBefore; // Judgment date = 2 years before today
    const defaultPrejudgmentStartDate = normalizeDate(new Date('2019-04-14')); // Prejudgment interest date = 2017-04-14 (for testing)
    const defaultPostjudgmentEndDate = today; // Postjudgment interest date = today

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
    
    // Define default special damages
    const defaultSpecialDamages = [
        { date: '2019-04-30', description: 'Ambulance fees', amount: 320 },
        { date: '2020-07-03', description: 'Physiotherapy - 1 hour', amount: 220.50 },
        { date: '2024-07-02', description: 'Oxycodone', amount: 39.80 }
    ];
    
    // Calculate the total of special damages
    const defaultSpecialDamagesTotal = defaultSpecialDamages.reduce((sum, damage) => sum + damage.amount, 0);
    
    // Define default payment rcords
    const defaultPayments = [
        { date: '2019-04-16', amount: 500 },
        { date: '2021-11-02', amount: 22.22 },        
        { date: '2024-01-28', amount: 7500 }
    ];
    
    const defaultResults = {
        specialDamages: defaultSpecialDamages,
        specialDamagesTotal: defaultSpecialDamagesTotal,
        prejudgmentResult: { details: [], total: 0, principal: 0, finalPeriodDamageInterestDetails: [] },
        postjudgmentResult: { details: [], total: 0 },
        judgmentTotal: 0,
        totalOwing: 0,
        perDiem: 0,
        finalCalculationDate: defaultPostjudgmentEndDate,
        payments: defaultPayments
    };
    
    // Initialize Zustand store with default values
    useStore.getState().initializeStore({
        inputs: defaultInputs,
        results: defaultResults
    });
    
    // Update summary table using the Zustand store
    // Pass recalculate and event dispatch as the callback
    updateSummaryTable(useStore, () => {
        recalculate();
        document.dispatchEvent(new CustomEvent('content-changed')); // Trigger pagination update
    });
    // --- End initial population ---

    // Initialize pagination listeners
    setupPaginationListeners();
    
    // Initialize the Clear button functionality
    initializeClearButton();
    
    recalculate(); 
    document.dispatchEvent(new CustomEvent('content-changed')); // Perform initial pagination update
}

/**
 * Initializes the application with error handling for Firebase
 */
async function initializeApplication() {
  try {
    // Listen for Firebase errors
    document.addEventListener('firebase-rates-error', (event) => {
      console.error('Firebase rates error event received:', event.detail);
      showFirebaseError(event.detail);
    });
    
    // Initialize the calculator
    initializeCalculator();
    
  } catch (error) {
    // Handle any unexpected errors during initialization
    console.error('Failed to initialize application:', error);
    showFirebaseError(error);
  }
}

// --- Entry Point ---
// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initializeApplication);
