import interestRatesData from './interestRates.js';
// Import calculatePerDiem as well
import { calculateInterestPeriods, calculatePerDiem } from './calculations.js';
import {
    elements, // Assumes elements for new inputs/tables/checkboxes are added here
    getInputValues, // Assumes this is updated to return nonPecuniaryAwarded, showPrejudgment
    updateInterestTable, // Assumes this is updated for new total row structure
    // updateSummary, // This will likely be replaced by updateSummaryTable
    // updateJudgmentTable, // Removed
    updateSummaryTable, // New function needed in domUtils
    clearResults, // May need updates for new tables
    togglePrejudgmentVisibility, // New function needed in domUtils
    togglePostjudgmentVisibility, // Assumes this is updated or uses a generic toggle
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
    clearResults(); // Assumes clearResults handles new tables
    // Show base total (Judgment + Non-Pecuniary + Costs) even if dates are invalid
    const baseTotal = (inputs.judgmentAwarded || 0) + (inputs.nonPecuniaryAwarded || 0) + (inputs.costsAwarded || 0);
    // Update summary table with zeros or base values if possible
    // updateJudgmentTable([], baseTotal); // Removed
    updateSummaryTable([], baseTotal, 0, new Date()); // Update new summary table
    elements.summaryTotalLabelEl.textContent = 'TOTAL OWING (Inputs Invalid)'; // Keep this label update
    return;
    }

    // Check if rates exist for the selected jurisdiction
    if (!interestRatesData[inputs.jurisdiction] || interestRatesData[inputs.jurisdiction].length === 0) {
        const message = `Interest rates are not available for the selected jurisdiction: ${inputs.jurisdiction}.`;
        console.error(message);
        alert(message);
        clearResults(); // Assumes clearResults handles new tables
        const baseTotal = inputs.judgmentAwarded + inputs.nonPecuniaryAwarded + inputs.costsAwarded;
        // updateJudgmentTable([], baseTotal); // Removed
        updateSummaryTable([], baseTotal, 0, new Date()); // Update new summary table
        elements.summaryTotalLabelEl.textContent = `TOTAL OWING (${inputs.jurisdiction} Rates Unavailable)`;
        return;
    }


    // 2. Calculate Prejudgment Interest (Conditional on Checkbox)
    let prejudgmentResult = { details: [], total: 0, principal: inputs.judgmentAwarded }; // Include principal
    if (inputs.showPrejudgment) {
        // Prejudgment ends the day *before* the judgment date
        const prejudgmentEndDate = new Date(inputs.dateOfJudgment);
        prejudgmentEndDate.setUTCDate(prejudgmentEndDate.getUTCDate() - 1);

        // Only calculate if the period is valid (at least one day)
        if (prejudgmentEndDate >= inputs.causeOfActionDate && inputs.judgmentAwarded > 0) {
            prejudgmentResult = calculateInterestPeriods(
                inputs.judgmentAwarded,
                inputs.causeOfActionDate,
                prejudgmentEndDate,
                'prejudgment',
                inputs.jurisdiction,
                interestRatesData
            );
        } else {
            console.warn("Prejudgment calculation skipped: Invalid date range or zero judgment amount.");
        }
    } else {
        console.log("Prejudgment calculation skipped: Checkbox unchecked.");
    }
    // Update Prejudgment Table (Assumes updateInterestTable handles the new structure and data attributes)
    updateInterestTable(
        elements.prejudgmentTableBody,
        elements.prejudgmentPrincipalTotalEl, // New element hook needed in domUtils
        elements.prejudgmentInterestTotalEl, // New element hook needed in domUtils
        prejudgmentResult.details,
        prejudgmentResult.principal, // Pass principal total
        prejudgmentResult.total // Pass interest total
    );

    // 3. Calculate Base Total for Postjudgment and Summary
    // This total includes the original awards and any calculated prejudgment interest
    const judgmentTotal = inputs.judgmentAwarded + prejudgmentResult.total + inputs.nonPecuniaryAwarded + inputs.costsAwarded;

    // 4. Calculate Postjudgment Interest (Conditional on Checkbox)
    let postjudgmentResult = { details: [], total: 0 };
    let finalCalculationDate = inputs.dateOfJudgment; // Default to judgment date if postjudgment is off

    if (inputs.showPostjudgment) {
        finalCalculationDate = inputs.dateOfCalculation; // Use the selected calculation date
        const postjudgmentStartDate = new Date(inputs.dateOfJudgment);

        // Ensure calculation date is valid and on or after judgment date
        if (inputs.dateOfCalculation && inputs.dateOfCalculation >= postjudgmentStartDate) {
            // Postjudgment principal is the total judgment amount
            const postjudgmentPrincipal = judgmentTotal;

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
             // Reset calculation date visually if invalid relative to judgment date
             if (elements.dateOfCalculationInput.value !== formatDateForInput(inputs.dateOfJudgment)) {
                 elements.dateOfCalculationInput.value = formatDateForInput(inputs.dateOfJudgment);
                 finalCalculationDate = inputs.dateOfJudgment; // Use judgment date for summary
             }
        }
    } else {
         // If postjudgment is hidden, ensure the calculation date input reflects the judgment date visually
         if (elements.dateOfCalculationInput.value !== formatDateForInput(inputs.dateOfJudgment)) {
              elements.dateOfCalculationInput.value = formatDateForInput(inputs.dateOfJudgment);
              finalCalculationDate = inputs.dateOfJudgment; // Use judgment date for summary
         }
    }
    // Update Postjudgment Table (Assumes updateInterestTable handles the new structure)
    updateInterestTable(
        elements.postjudgmentTableBody,
        null, // No principal total element for postjudgment
        elements.postjudgmentInterestTotalEl, // New element hook needed in domUtils
        postjudgmentResult.details,
        null, // No principal total
        postjudgmentResult.total // Pass interest total
    );

    // 5. Update Summary Table
    const summaryItems = [
        { item: 'Pecuniary Judgment', dateValue: formatDateForInput(inputs.dateOfJudgment), amount: inputs.judgmentAwarded },
        { item: 'Prejudgment Interest', dateValue: formatDateForInput(inputs.dateOfJudgment), amount: prejudgmentResult.total },
        { item: 'Non-Pecuniary Judgment', dateValue: formatDateForInput(inputs.dateOfJudgment), amount: inputs.nonPecuniaryAwarded },
        { item: 'Costs Awarded', dateValue: formatDateForInput(inputs.dateOfJudgment), amount: inputs.costsAwarded },
        { item: 'Post Judgment Interest', dateValue: formatDateForInput(finalCalculationDate), amount: postjudgmentResult.total },
    ];
    const totalOwing = judgmentTotal + postjudgmentResult.total;
    // Calculate Per Diem using the total owing and final date
    const perDiem = calculatePerDiem(totalOwing, finalCalculationDate, inputs.jurisdiction, interestRatesData);
    updateSummaryTable(summaryItems, totalOwing, perDiem, finalCalculationDate); // Pass calculated per diem
}


/**
 * Sets up all event listeners for the calculator inputs.
 */
function setupEventListeners() {
    // Check if elements exist before adding listeners (Add new elements to check)
    const requiredElements = [
        elements.causeOfActionDateInput, elements.dateOfJudgmentInput, elements.dateOfCalculationInput,
        elements.judgmentAwardedInput, elements.nonPecuniaryAwardedInput, elements.costsAwardedInput, // Added nonPecuniary
        elements.jurisdictionSelect, elements.showPrejudgmentCheckbox, elements.showPostjudgmentCheckbox // Added showPrejudgment
    ];
    if (requiredElements.some(el => !el)) {
        console.error("Cannot setup listeners: One or more essential input/control elements are missing.");
        return;
    }

    // Date inputs
    [elements.causeOfActionDateInput, elements.dateOfJudgmentInput, elements.dateOfCalculationInput].forEach(input => {
        input.addEventListener('change', recalculate);
    });

    // Currency inputs (Judgment, Non-Pecuniary, Costs)
    setupCurrencyInputListeners(elements.judgmentAwardedInput, recalculate);
    setupCurrencyInputListeners(elements.nonPecuniaryAwardedInput, recalculate); // Added listener
    setupCurrencyInputListeners(elements.costsAwardedInput, recalculate);

    // Jurisdiction select
    elements.jurisdictionSelect.addEventListener('change', () => {
        console.log(`Jurisdiction changed to ${elements.jurisdictionSelect.value}. Recalculating...`);
        recalculate(); // Recalculate when jurisdiction changes
    });

    // Show Prejudgment checkbox
    elements.showPrejudgmentCheckbox.addEventListener('change', () => {
        // Pass 'recalculate' as the callback function
        togglePrejudgmentVisibility(false, recalculate); // Assumes new function in domUtils
    });

    // Show Postjudgment checkbox
    elements.showPostjudgmentCheckbox.addEventListener('change', () => {
        // Pass 'recalculate' as the callback function
        togglePostjudgmentVisibility(false, recalculate); // Assumes this uses generic toggle or is updated
    });

    // Optional: Listeners for File No and Registry (if they should trigger anything)
    // elements.fileNoInput.addEventListener('change', someFunction);
    // elements.registryInput.addEventListener('change', someFunction);
}

/**
 * Initializes the calculator when the DOM is fully loaded.
 */
function initializeCalculator() {
    // Ensure all essential elements are present before proceeding (Add new elements)
     const essentialElements = [
         // Inputs & Controls
         elements.causeOfActionDateInput, elements.dateOfJudgmentInput, elements.dateOfCalculationInput,
         elements.judgmentAwardedInput, elements.nonPecuniaryAwardedInput, elements.costsAwardedInput,
         elements.jurisdictionSelect, elements.showPrejudgmentCheckbox, elements.showPostjudgmentCheckbox,
         // Display Sections & Tables
         elements.prejudgmentSection, elements.postjudgmentSection, elements.accrualDateRow,
         elements.prejudgmentTableBody, elements.prejudgmentPrincipalTotalEl, elements.prejudgmentInterestTotalEl,
         // elements.judgmentTableBody, elements.judgmentTotalEl, // Removed
         elements.postjudgmentTableBody, elements.postjudgmentInterestTotalEl,
         elements.summaryTableBody, elements.summaryTotalLabelEl, elements.summaryTotalEl, elements.summaryPerDiemEl
     ];

     if (essentialElements.some(el => !el)) {
         console.error("Initialization failed: Essential DOM elements are missing. Check HTML structure, data attributes, and domUtils.js element mapping.");
         alert("Error initializing the calculator. Please check the console for details.");
         return; // Stop initialization
     }

    console.log("Initializing Calculator...");
    setDefaultInputValues(); // Set defaults (e.g., dates, format currency)
    setupEventListeners(); // Add input listeners
    togglePrejudgmentVisibility(true, null); // Set initial visibility without recalculating yet
    togglePostjudgmentVisibility(true, null); // Set initial visibility without recalculating yet
    recalculate(); // Perform the initial calculation
    console.log("Calculator Initialized.");
}

// --- Entry Point ---
// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initializeCalculator);
