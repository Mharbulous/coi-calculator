import { formatCurrencyForDisplay, formatCurrencyForInput, formatCurrencyForInputWithCommas, formatDateLong, parseCurrency, parseDateInput, formatDateForInput, formatDateForDisplay, validateDateFormat } from '../utils.js';
import useStore from '../store.js';
import elements from './elements.js';

/**
 * Retrieves the current values from the input fields, including those dynamically added to the summary table.
 * @returns {object} An object containing the parsed input values.
 */
export function getInputValues() {
    // Check if all required input elements are loaded (including dynamically created ones)
    const requiredStaticInputs = [
        elements.jurisdictionSelect, elements.showPrejudgmentCheckbox, elements.showPostjudgmentCheckbox
        // Note: fileNoInput and registryInput are not strictly required for calculation
    ];
    
    // Check static inputs first
    if (requiredStaticInputs.some(el => !el)) {
        console.error("One or more essential static input/control elements not found in DOM.");
        return { isValid: false, validationMessage: "Initialization error: Missing static input elements." };
    }
    
    // Read from dynamic inputs, provide default empty string if elements don't exist yet
    const prejudgmentStartDateStr = elements.prejudgmentInterestDateInput ? elements.prejudgmentInterestDateInput.value : '';
    const postjudgmentEndDateStr = elements.postjudgmentInterestDateInput ? elements.postjudgmentInterestDateInput.value : '';
    const dateOfJudgmentStr = elements.pecuniaryJudgmentDateInput ? elements.pecuniaryJudgmentDateInput.value : '';
    const judgmentAwardedStr = elements.pecuniaryJudgmentAmountInput ? elements.pecuniaryJudgmentAmountInput.value : '';
    const nonPecuniaryAwardedStr = elements.nonPecuniaryJudgmentAmountInput ? elements.nonPecuniaryJudgmentAmountInput.value : '';
    const costsAwardedStr = elements.costsAwardedAmountInput ? elements.costsAwardedAmountInput.value : '';
    
    // For Non-Pecuniary and Costs dates, use the Pecuniary date since they're no longer editable
    const nonPecuniaryDateStr = dateOfJudgmentStr;
    const costsDateStr = dateOfJudgmentStr;

    // Parse the input values
    const prejudgmentStartDate = parseDateInput(prejudgmentStartDateStr);
    const postjudgmentEndDate = parseDateInput(postjudgmentEndDateStr);
    const dateOfJudgment = parseDateInput(dateOfJudgmentStr);
    const nonPecuniaryJudgmentDate = parseDateInput(nonPecuniaryDateStr);
    const costsAwardedDate = parseDateInput(costsDateStr);
    const judgmentAwarded = parseCurrency(judgmentAwardedStr);
    const nonPecuniaryAwarded = parseCurrency(nonPecuniaryAwardedStr);
    const costsAwarded = parseCurrency(costsAwardedStr);
    const jurisdiction = elements.jurisdictionSelect.value;
    const showPrejudgment = elements.showPrejudgmentCheckbox.checked;
    const showPostjudgment = elements.showPostjudgmentCheckbox.checked;
    const showPerDiem = elements.showPerDiemCheckbox ? elements.showPerDiemCheckbox.checked : true;

    // Create the inputs object
    const inputs = {
        prejudgmentStartDate,
        postjudgmentEndDate,
        dateOfJudgment,
        nonPecuniaryJudgmentDate,
        costsAwardedDate,
        judgmentAwarded,
        nonPecuniaryAwarded,
        costsAwarded,
        jurisdiction,
        showPrejudgment,
        showPostjudgment,
        showPerDiem
    };
    
    // Validate the inputs
    const validationResult = validateInputValues(inputs);
    
    // Combine the inputs with the validation result
    const result = {
        ...inputs,
        isValid: validationResult.isValid,
        validationMessage: validationResult.validationMessage
    };
    
    // Update the Zustand store with the inputs
    useStore.getState().setInputs(result);
    
    return result;
}

/**
 * Validates the input values for the calculator.
 * @param {object} inputs - The input values to validate.
 * @returns {object} An object with isValid and validationMessage properties.
 */
export function validateInputValues(inputs) {
    let isValid = true;
    let validationMessage = "";

    // Check all required dates exist
    if (!inputs.prejudgmentStartDate || !inputs.dateOfJudgment || 
        !inputs.nonPecuniaryJudgmentDate || !inputs.costsAwardedDate || 
        !inputs.postjudgmentEndDate) {
        validationMessage = "One or more required dates (Prejudgment Start, Judgments, Postjudgment End) are missing or invalid.";
        isValid = false;
    } else {
        // Check judgment dates against prejudgment start date
        if (inputs.dateOfJudgment < inputs.prejudgmentStartDate) {
            validationMessage = "Pecuniary Judgment Date cannot be before Prejudgment Start Date.";
            isValid = false;
        }
        if (inputs.nonPecuniaryJudgmentDate < inputs.prejudgmentStartDate) {
            validationMessage = "Non-Pecuniary Judgment Date cannot be before Prejudgment Start Date.";
            isValid = false;
        }
        if (inputs.costsAwardedDate < inputs.prejudgmentStartDate) {
            validationMessage = "Costs Awarded Date cannot be before Prejudgment Start Date.";
            isValid = false;
        }

        // Use the *actual* postjudgment end date for this check, only if postjudgment is shown
        // Postjudgment interest runs from the *latest* of the judgment dates up to the postjudgment end date
        const latestJudgmentDate = new Date(Math.max(
            inputs.dateOfJudgment, 
            inputs.nonPecuniaryJudgmentDate, 
            inputs.costsAwardedDate
        ));
        
        if (inputs.showPostjudgment && inputs.postjudgmentEndDate < latestJudgmentDate) {
            validationMessage = "Postjudgment End Date cannot be before the latest Judgment Date when showing Postjudgment Interest.";
            isValid = false;
        }
        
        // Also check that prejudgment start date is not after the earliest judgment date
        const earliestJudgmentDate = new Date(Math.min(
            inputs.dateOfJudgment, 
            inputs.nonPecuniaryJudgmentDate, 
            inputs.costsAwardedDate
        ));
        
        if (inputs.prejudgmentStartDate > earliestJudgmentDate) {
            validationMessage = "Prejudgment Start Date cannot be after the earliest Judgment Date.";
            isValid = false;
        }
    }
    
    // Check all currency amounts
    if (inputs.judgmentAwarded < 0 || inputs.nonPecuniaryAwarded < 0 || inputs.costsAwarded < 0) {
        validationMessage = "Pecuniary Judgment, Non-pecuniary, and Costs amounts cannot be negative.";
        isValid = false;
    }

    return { isValid, validationMessage };
}
