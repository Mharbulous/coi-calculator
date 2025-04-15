import interestRatesData from './interestRates.js';
// Import calculatePerDiem as well
import { calculateInterestPeriods, calculatePerDiem } from './calculations.js';
import {
    elements, // Assumes elements for new inputs/tables/checkboxes are added here
    getInputValues, // Assumes this is updated to return prejudgmentStartDate, postjudgmentEndDate, etc.
    updateInterestTable, // Assumes this is updated for new total row structure
    updateSummaryTable, // Updated to handle editable fields
    clearResults,
    togglePrejudgmentVisibility,
    togglePostjudgmentVisibility,
    togglePerDiemVisibility,
    setDefaultInputValues,
    setupCurrencyInputListeners
} from './domUtils.js';
// Import necessary date formatting functions
import { formatDateForInput, formatDateLong, formatDateForDisplay, parseCurrency, parseDateInput } from './utils.js';

/**
 * Collects special damages data from the prejudgment table.
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
            const dateValue = dateInput.value;
            
            // Convert to DD/MM/YYYY format for display consistency
            let formattedDate = '';
            if (dateValue) {
                const dateParts = dateValue.split('-');
                if (dateParts.length === 3) {
                    const year = dateParts[0];
                    const month = dateParts[1];
                    const day = dateParts[2];
                    formattedDate = `${day}/${month}/${year}`;
                } else {
                    formattedDate = dateValue; // Fallback
                }
            }
            
            const description = descInput.value.trim() || descInput.placeholder;
            const amount = parseCurrency(amountInput.value);
            
            if (formattedDate && amount > 0) {
                specialDamages.push({
                    date: formattedDate,
                    description,
                    amount
                });
            }
        }
    });
    
    return specialDamages;
}

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
        // Update summary table with zeros or base values if possible, passing recalculate
        // Need initial items structure even on error to potentially show editable fields
        const today = new Date();
        // Use provided dates if available, otherwise fallback defaults
        const defaultPrejudgmentStartDate = inputs.prejudgmentStartDate || new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
        const defaultJudgmentDate = inputs.dateOfJudgment || new Date(today.getFullYear() -1, today.getMonth(), today.getDate());
        const defaultNonPecDate = inputs.nonPecuniaryJudgmentDate || defaultJudgmentDate;
        const defaultCostsDate = inputs.costsAwardedDate || defaultJudgmentDate;
        const defaultPostjudgmentEndDate = inputs.postjudgmentEndDate || today;

        const errorSummaryItems = [
             { item: 'Pecuniary Judgment', dateValue: defaultJudgmentDate, amount: inputs.judgmentAwarded || 0, isEditable: true },
             { item: 'Non-Pecuniary Judgment', dateValue: defaultNonPecDate, amount: inputs.nonPecuniaryAwarded || 0, isEditable: true },
             { item: 'Costs Awarded', dateValue: defaultCostsDate, amount: inputs.costsAwarded || 0, isEditable: true },
             { item: 'Prejudgment Interest', dateValue: defaultPrejudgmentStartDate, amount: 0, isDateEditable: true }, // Date editable
             { item: 'Postjudgment Interest', dateValue: defaultPostjudgmentEndDate, amount: 0, isDateEditable: true }, // Date editable
        ];
        updateSummaryTable(errorSummaryItems, baseTotal, 0, defaultPostjudgmentEndDate, recalculate); // Pass recalculate
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
        // Update summary table with zeros or base values if possible, passing recalculate
        const errorSummaryItems = [ // Use current input values for amounts/dates
             { item: 'Pecuniary Judgment', dateValue: inputs.dateOfJudgment, amount: inputs.judgmentAwarded, isEditable: true },
             { item: 'Non-Pecuniary Judgment', dateValue: inputs.nonPecuniaryJudgmentDate, amount: inputs.nonPecuniaryAwarded, isEditable: true },
             { item: 'Costs Awarded', dateValue: inputs.costsAwardedDate, amount: inputs.costsAwarded, isEditable: true },
             { item: 'Prejudgment Interest', dateValue: inputs.prejudgmentStartDate, amount: 0, isDateEditable: true }, // Date editable
             { item: 'Postjudgment Interest', dateValue: inputs.postjudgmentEndDate, amount: 0, isDateEditable: true }, // Date editable
        ];
        updateSummaryTable(errorSummaryItems, baseTotal, 0, inputs.postjudgmentEndDate, recalculate); // Pass recalculate
        elements.summaryTotalLabelEl.textContent = `TOTAL OWING (${inputs.jurisdiction} Rates Unavailable)`;
        return;
    }


    // 2. Collect Special Damages (needed for both prejudgment calc and totals)
    const specialDamages = collectSpecialDamages();
    const specialDamagesTotal = specialDamages.reduce((sum, damage) => sum + damage.amount, 0);

    // 3. Calculate Prejudgment Interest (Conditional on Checkbox)
    // Prejudgment interest in BC COIA applies ONLY to pecuniary damages.
    let prejudgmentResult = { details: [], total: 0, principal: inputs.judgmentAwarded }; // Initial principal is pecuniary only
    if (inputs.showPrejudgment) {
        // Prejudgment starts from the dynamic prejudgmentStartDate
        // Prejudgment ends the day *before* the pecuniary judgment date
        const prejudgmentEndDate = new Date(inputs.dateOfJudgment);
        prejudgmentEndDate.setUTCDate(prejudgmentEndDate.getUTCDate() - 1);

        // Only calculate if the period is valid (at least one day) and pecuniary amount > 0
        if (prejudgmentEndDate >= inputs.prejudgmentStartDate && inputs.judgmentAwarded > 0) {
            // Capture the new finalPeriodDamageInterestDetails array
            const { details: preDetails, total: preTotal, principal: prePrincipal, finalPeriodDamageInterestDetails } = calculateInterestPeriods(
                inputs.judgmentAwarded, // Base principal for prejudgment is pecuniary only
                inputs.prejudgmentStartDate, // Use dynamic start date
                prejudgmentEndDate,
                'prejudgment',
                inputs.jurisdiction,
                interestRatesData,
                specialDamages // Pass collected special damages here
            );
            // Assign results back to prejudgmentResult for consistency, including the new array
            prejudgmentResult = { details: preDetails, total: preTotal, principal: prePrincipal, finalPeriodDamageInterestDetails };
        } else {
            console.warn("Prejudgment calculation skipped: Invalid date range (start date vs judgment date) or zero pecuniary judgment amount.");
            // Ensure finalPeriodDamageInterestDetails exists even if calculation skipped
            prejudgmentResult.finalPeriodDamageInterestDetails = [];
        }
    } else {
        console.log("Prejudgment calculation skipped: Checkbox unchecked.");
        // Even if skipped, the principal used for the total row includes special damages
        prejudgmentResult.principal = inputs.judgmentAwarded + specialDamagesTotal;
        // Ensure finalPeriodDamageInterestDetails exists even if calculation skipped
        prejudgmentResult.finalPeriodDamageInterestDetails = [];
    }

    // Calculate the total principal including special damages for the footer display
    // Note: calculateInterestPeriods now returns the *final* principal after damages are applied within the period.
    // For the footer total, we want the initial pecuniary + *all* special damages.
    const totalPrincipalForFooter = inputs.judgmentAwarded + specialDamagesTotal;

    // Update Prejudgment Table ONLY with calculated interest details.
    // Special damages rows will be re-inserted by updateInterestTable itself.
    updateInterestTable(
        elements.prejudgmentTableBody,
        elements.prejudgmentPrincipalTotalEl,
        elements.prejudgmentInterestTotalEl,
        prejudgmentResult.details, // Pass only calculated details
        totalPrincipalForFooter, // Pass the correct total principal for the footer
        prejudgmentResult.total, // Pass interest total (calculated only on pecuniary, but principal adjusted)
        prejudgmentResult.finalPeriodDamageInterestDetails // Pass the new array here
    );

    // Update Prejudgment Table Footer Label
    if (elements.prejudgmentTotalLabel) {
        if (inputs.isValid && inputs.dateOfJudgment) {
            // Use formatDateForDisplay for DD/MM/YYYY format as requested
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
                 postjudgmentResult = calculateInterestPeriods(
                     postjudgmentPrincipal,
                     postjudgmentStartDate,
                     inputs.postjudgmentEndDate, // Use the dynamic end date
                     'postjudgment',
                     inputs.jurisdiction,
                     interestRatesData
                 );
            }
        } else {
             console.warn("Postjudgment calculation skipped: Postjudgment End Date is before the latest judgment date or invalid.");
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
    // Update Postjudgment Table
    updateInterestTable(
        elements.postjudgmentTableBody,
        null, // No principal total element for postjudgment
        elements.postjudgmentInterestTotalEl,
        postjudgmentResult.details,
        null, // No principal total
        postjudgmentResult.total // Pass interest total
    );

    // 5. Update Summary Table
    const summaryItems = [
        // Mark Pecuniary Judgment as editable, pass the Date object for formatting
        { item: 'Pecuniary Judgment', dateValue: inputs.dateOfJudgment, amount: inputs.judgmentAwarded, isEditable: true },
        // Non-Pecuniary Judgment - keep amount editable but not date
        { item: 'Non-Pecuniary Judgment', dateValue: inputs.nonPecuniaryJudgmentDate, amount: inputs.nonPecuniaryAwarded, isEditable: true },
        // Costs Awarded - keep amount editable but not date
        { item: 'Costs Awarded', dateValue: inputs.costsAwardedDate, amount: inputs.costsAwarded, isEditable: true },
        // Prejudgment interest date is now editable (start date)
        { item: 'Prejudgment Interest', dateValue: inputs.prejudgmentStartDate, amount: prejudgmentResult.total, isDateEditable: true },
        // Postjudgment Interest date is now editable (end date)
        { item: 'Postjudgment Interest', dateValue: inputs.postjudgmentEndDate, amount: postjudgmentResult.total, isDateEditable: true },
    ];
    const totalOwing = judgmentTotal + postjudgmentResult.total;
    // Calculate Per Diem using the total owing and final date (which is postjudgmentEndDate if valid, otherwise latestJudgmentDate)
    const perDiem = calculatePerDiem(totalOwing, finalCalculationDate, inputs.jurisdiction, interestRatesData);
    // Pass the recalculate function as the callback for editable fields
    updateSummaryTable(summaryItems, totalOwing, perDiem, finalCalculationDate, recalculate);
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
    // Check if elements exist before adding listeners (Remove checks for deleted elements)
    const requiredElements = [
        // elements.causeOfActionDateInput, // Removed
        // elements.dateOfCalculationInput, // Removed
        /* elements.judgmentAwardedInput, */ /* elements.nonPecuniaryAwardedInput, */ /* elements.costsAwardedInput, */ // Removed static amount inputs
        elements.jurisdictionSelect, elements.showPrejudgmentCheckbox, elements.showPostjudgmentCheckbox
    ];
    if (requiredElements.some(el => !el)) {
        console.error("Cannot setup listeners: One or more essential static input/control elements are missing.");
        return;
    }

    // Date inputs (Removed listeners for static date inputs)
    // [elements.causeOfActionDateInput, elements.dateOfCalculationInput].forEach(input => {
    //     if (input) input.addEventListener('change', recalculate);
    // });
    // Note: Listeners for ALL dynamic inputs (dates and amounts) are added in updateSummaryTable

    // Currency inputs (Removed listeners for static amount inputs)
    // setupCurrencyInputListeners(elements.judgmentAwardedInput, recalculate); // Removed
    // setupCurrencyInputListeners(elements.nonPecuniaryAwardedInput, recalculate); // Removed
    // setupCurrencyInputListeners(elements.costsAwardedInput, recalculate); // Removed
    // Note: Listeners for dynamic judgment amount inputs are added in updateSummaryTable

    // Jurisdiction select
    elements.jurisdictionSelect.addEventListener('change', () => {
        console.log(`Jurisdiction changed to ${elements.jurisdictionSelect.value}. Recalculating...`);
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
    // Ensure all essential elements are present before proceeding (Remove checks for deleted elements)
     const essentialElements = [
         // Inputs & Controls
         // elements.causeOfActionDateInput, // Removed
         // elements.dateOfCalculationInput, // Removed
         /* elements.judgmentAwardedInput, */ /* elements.nonPecuniaryAwardedInput, */ /* elements.costsAwardedInput, */ // Removed static amount inputs
         elements.jurisdictionSelect, elements.showPrejudgmentCheckbox, elements.showPostjudgmentCheckbox,
         // Display Sections & Tables
         elements.prejudgmentSection, elements.postjudgmentSection, // accrualDateRow removed from HTML
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
    setDefaultInputValues(); // Set defaults for static fields (Jurisdiction, checkboxes)
    setupEventListeners(); // Add input listeners for static fields (Jurisdiction, checkboxes)
    togglePrejudgmentVisibility(true, null); // Set initial visibility without recalculating
    togglePostjudgmentVisibility(true, null); // Set initial visibility without recalculating
    togglePerDiemVisibility(true, null); // Set initial visibility without recalculating

    // --- Perform initial population of summary table to create dynamic inputs ---
    const today = new Date();
    const defaultPostjudgmentEndDate = new Date(today); // Default end date is today
    const defaultJudgmentDate = new Date(2023, 4, 1); // Default judgment date: 2023-05-01 (months are 0-indexed)
    const defaultPrejudgmentStartDate = new Date(2019, 2, 1); // Default start date: 2019-03-01 (months are 0-indexed)

    const defaultAmount = 0; // Default amount for all judgments initially
    const pecuniaryDefaultAmount = 10000; // Default amount for pecuniary judgment
    const initialSummaryItems = [
        { item: 'Pecuniary Judgment', dateValue: defaultJudgmentDate, amount: pecuniaryDefaultAmount, isEditable: true },
        { item: 'Non-Pecuniary Judgment', dateValue: defaultJudgmentDate, amount: defaultAmount, isEditable: true }, // Now editable
        { item: 'Costs Awarded', dateValue: defaultJudgmentDate, amount: defaultAmount, isEditable: true }, // Now editable
        { item: 'Prejudgment Interest', dateValue: defaultPrejudgmentStartDate, amount: 0, isDateEditable: true }, // Date editable
        { item: 'Postjudgment Interest', dateValue: defaultPostjudgmentEndDate, amount: 0, isDateEditable: true }, // Date editable
    ];
    // Call updateSummaryTable directly to create the elements, passing recalculate as the callback
    // Use defaultPostjudgmentEndDate for the initial 'TOTAL AS OF' date
    updateSummaryTable(initialSummaryItems, 0, 0, defaultPostjudgmentEndDate, recalculate);
    // --- End initial population ---

    // Now perform the first *real* calculation using the inputs (including the newly created dynamic ones)
    recalculate();
    console.log("Calculator Initialized.");
}

// --- Entry Point ---
// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initializeCalculator);
