import interestRatesData from './interestRates.js';
import { calculateInterestPeriods } from './calculations.js';
import {
    elements,
    getInputValues,
    updateInterestTable,
    updateSummary,
    clearResults,
    togglePostjudgmentVisibility,
    setDefaultInputValues,
    setupCurrencyInputListeners
} from './domUtils.js';
import { formatDateForInput } from './utils.js'; // Needed for date adjustments

/**
 * Main function to recalculate interest based on current inputs.
 */
function recalculate() {
    // 1. Get and Validate Inputs
    const inputs = getInputValues();

    if (!inputs.isValid) {
        // Clear previous results and display base total if inputs are invalid
        console.warn("Recalculation skipped due to invalid inputs:", inputs.validationMessage);
        alert(inputs.validationMessage || "Please check the input values."); // Show validation message
        clearResults();
        // Show base total (Judgment + Costs) even if dates are invalid
        const baseTotal = (inputs.judgmentAwarded || 0) + (inputs.costsAwarded || 0);
        updateSummary(baseTotal, new Date()); // Use current date for label if inputs invalid
        elements.summaryTotalLabelEl.textContent = 'TOTAL OWING (Inputs Invalid)';
        return;
    }

    // Check if rates exist for the selected jurisdiction
    if (!interestRatesData[inputs.jurisdiction] || interestRatesData[inputs.jurisdiction].length === 0) {
        const message = `Interest rates are not available for the selected jurisdiction: ${inputs.jurisdiction}.`;
        console.error(message);
        alert(message);
        clearResults();
        const baseTotal = inputs.judgmentAwarded + inputs.costsAwarded;
        updateSummary(baseTotal, new Date());
        elements.summaryTotalLabelEl.textContent = `TOTAL OWING (${inputs.jurisdiction} Rates Unavailable)`;
        return;
    }


    // 2. Calculate Prejudgment Interest
    // Prejudgment ends the day *before* the judgment date
    const prejudgmentEndDate = new Date(inputs.dateOfJudgment);
    prejudgmentEndDate.setUTCDate(prejudgmentEndDate.getUTCDate() - 1);

    let prejudgmentResult = { details: [], total: 0 };
    // Only calculate if the period is valid (at least one day)
    if (prejudgmentEndDate >= inputs.causeOfActionDate) {
        prejudgmentResult = calculateInterestPeriods(
            inputs.judgmentAwarded,
            inputs.causeOfActionDate,
            prejudgmentEndDate,
            'prejudgment',
            inputs.jurisdiction,
            interestRatesData
        );
    }
    updateInterestTable(
        elements.prejudgmentTableBody,
        elements.prejudgmentSubtotalEl,
        prejudgmentResult.details,
        prejudgmentResult.total
    );

    // 3. Calculate Postjudgment Interest (Conditional)
    let postjudgmentResult = { details: [], total: 0 };
    let finalCalculationDate = inputs.dateOfJudgment; // Default to judgment date if postjudgment is off

    if (inputs.showPostjudgment) {
        finalCalculationDate = inputs.dateOfCalculation; // Use the selected calculation date
        const postjudgmentStartDate = new Date(inputs.dateOfJudgment);

        // Ensure calculation date is valid and on or after judgment date
        if (inputs.dateOfCalculation && inputs.dateOfCalculation >= postjudgmentStartDate) {
            // Postjudgment principal includes judgment, prejudgment interest, and costs
            const postjudgmentPrincipal = inputs.judgmentAwarded + prejudgmentResult.total + inputs.costsAwarded;

            if (postjudgmentPrincipal > 0) {
                 postjudgmentResult = calculateInterestPeriods(
                     postjudgmentPrincipal,
                     postjudgmentStartDate,
                     inputs.dateOfCalculation, // Use the actual calculation date
                     'postjudgment',
                     inputs.jurisdiction,
                     interestRatesData
                 );
            }
        } else {
             console.warn("Postjudgment calculation skipped: Calculation date is before judgment date or invalid.");
        }
    } else {
         // If postjudgment is hidden, ensure the calculation date input reflects the judgment date visually
         if (elements.dateOfCalculationInput.value !== elements.dateOfJudgmentInput.value) {
              elements.dateOfCalculationInput.value = elements.dateOfJudgmentInput.value;
         }
    }

    updateInterestTable(
        elements.postjudgmentTableBody,
        elements.postjudgmentSubtotalEl,
        postjudgmentResult.details,
        postjudgmentResult.total
    );

    // 4. Update Summary
    const totalOwing = inputs.judgmentAwarded + prejudgmentResult.total + inputs.costsAwarded + postjudgmentResult.total;
    updateSummary(totalOwing, finalCalculationDate); // Pass the effective final date
}


/**
 * Sets up all event listeners for the calculator inputs.
 */
function setupEventListeners() {
    // Check if elements exist before adding listeners
    if (!elements.causeOfActionDateInput || !elements.dateOfJudgmentInput || !elements.dateOfCalculationInput || !elements.judgmentAwardedInput || !elements.costsAwardedInput || !elements.jurisdictionSelect || !elements.showPostjudgmentCheckbox) {
        console.error("Cannot setup listeners: One or more essential elements are missing.");
        return;
    }

    // Date inputs
    [elements.causeOfActionDateInput, elements.dateOfJudgmentInput, elements.dateOfCalculationInput].forEach(input => {
        input.addEventListener('change', recalculate);
    });

    // Currency inputs (Judgment and Costs)
    setupCurrencyInputListeners(elements.judgmentAwardedInput, recalculate);
    setupCurrencyInputListeners(elements.costsAwardedInput, recalculate);

    // Jurisdiction select
    elements.jurisdictionSelect.addEventListener('change', () => {
        console.log(`Jurisdiction changed to ${elements.jurisdictionSelect.value}. Recalculating...`);
        recalculate(); // Recalculate when jurisdiction changes
    });

    // Show Postjudgment checkbox
    elements.showPostjudgmentCheckbox.addEventListener('change', () => {
        // Pass 'recalculate' as the callback function
        togglePostjudgmentVisibility(false, recalculate);
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
         elements.causeOfActionDateInput, elements.dateOfJudgmentInput, elements.dateOfCalculationInput,
         elements.judgmentAwardedInput, elements.costsAwardedInput, elements.jurisdictionSelect,
         elements.showPostjudgmentCheckbox, elements.prejudgmentTableBody, elements.prejudgmentSubtotalEl,
         elements.postjudgmentTableBody, elements.postjudgmentSubtotalEl, elements.summaryTotalLabelEl,
         elements.summaryTotalEl, elements.accrualDateRow, elements.postjudgmentSection
     ];

     if (essentialElements.some(el => !el)) {
         console.error("Initialization failed: Essential DOM elements are missing. Check HTML structure and data attributes.");
         alert("Error initializing the calculator. Please check the console for details.");
         return; // Stop initialization
     }

    console.log("Initializing Calculator...");
    setDefaultInputValues(); // Set defaults (e.g., dates, format currency)
    setupEventListeners(); // Add input listeners
    togglePostjudgmentVisibility(true, recalculate); // Set initial visibility without recalculating yet
    recalculate(); // Perform the initial calculation
    console.log("Calculator Initialized.");
}

// --- Entry Point ---
// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initializeCalculator);
