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
import { formatDateForInput } from './utils.js';
import useStore from './store.js';

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
