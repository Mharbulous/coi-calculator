import { formatDateLong, parseDateInput, formatDateForInput, formatDateForDisplay, validateDateFormat, dateBefore, dateAfter, dateOnOrBefore, dateOnOrAfter } from '../utils.date.js';
import { formatCurrencyForDisplay, formatCurrencyForInput, formatCurrencyForInputWithCommas, parseCurrency } from '../utils.currency.js';
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
    
    // Read from dynamic inputs with fallback logic for both prejudgment and postjudgment dates
    
    // For prejudgment date, prioritize DOM if element exists, otherwise use store value
    let prejudgmentStartDateStr = '';
    if (elements.prejudgmentInterestDateInput) {
        // If the input element exists, read its current value
        prejudgmentStartDateStr = elements.prejudgmentInterestDateInput.value;
    } else {
        // Element doesn't exist (likely hidden), get value from store if available
        const storeStartDate = useStore.getState().inputs.prejudgmentStartDate;
        if (storeStartDate instanceof Date) {
            // Format the stored Date object back to YYYY-MM-DD string
            prejudgmentStartDateStr = formatDateForInput(storeStartDate); 
        } else if (typeof storeStartDate === 'string' && storeStartDate !== '') {
             // If it's already a valid string in the store (less likely but possible)
             prejudgmentStartDateStr = storeStartDate;
        }
        // If it's null or invalid in the store, prejudgmentStartDateStr remains ''
    }

    // For postjudgment date, prioritize DOM if element exists, otherwise use store value
    let postjudgmentEndDateStr = '';
    if (elements.postjudgmentInterestDateInput) {
        // If the input element exists, read its current value
        postjudgmentEndDateStr = elements.postjudgmentInterestDateInput.value;
    } else {
        // Element doesn't exist (likely hidden), get value from store if available
        const storeEndDate = useStore.getState().inputs.postjudgmentEndDate;
        if (storeEndDate instanceof Date) {
            // Format the stored Date object back to YYYY-MM-DD string
            postjudgmentEndDateStr = formatDateForInput(storeEndDate); 
        } else if (typeof storeEndDate === 'string' && storeEndDate !== '') {
             // If it's already a valid string in the store (less likely but possible)
             postjudgmentEndDateStr = storeEndDate;
        }
        // If it's null or invalid in the store, postjudgmentEndDateStr remains ''
    }
    
    // Use the judgment date input field as the primary source of the judgment date
    const dateOfJudgmentStr = elements.judgmentDateInput ? elements.judgmentDateInput.value : '';
    
    // pecuniaryJudgmentDateInput no longer exists, sync removed.
    
    const judgmentAwardedStr = elements.pecuniaryJudgmentAmountInput ? elements.pecuniaryJudgmentAmountInput.value : '';
    const nonPecuniaryAwardedStr = elements.nonPecuniaryJudgmentAmountInput ? elements.nonPecuniaryJudgmentAmountInput.value : '';
    const costsAwardedStr = elements.costsAwardedAmountInput ? elements.costsAwardedAmountInput.value : '';
    
    // For all damage rows, use the judgment date
    const nonPecuniaryDateStr = dateOfJudgmentStr;
    const costsDateStr = dateOfJudgmentStr;

    // Parse the input values
    const prejudgmentStartDate = parseDateInput(prejudgmentStartDateStr);
    const postjudgmentEndDate = parseDateInput(postjudgmentEndDateStr);
    const dateOfJudgment = parseDateInput(dateOfJudgmentStr);
    const nonPecuniaryJudgmentDate = dateOfJudgment; // Use the same Date object
    const costsAwardedDate = dateOfJudgment; // Use the same Date object
    const judgmentAwarded = parseCurrency(judgmentAwardedStr);
    const nonPecuniaryAwarded = parseCurrency(nonPecuniaryAwardedStr);
    const costsAwarded = parseCurrency(costsAwardedStr);
    const jurisdiction = elements.jurisdictionSelect.value;
    const showPrejudgment = elements.showPrejudgmentCheckbox.checked;
    const showPostjudgment = elements.showPostjudgmentCheckbox.checked;
    const showPerDiem = elements.showPerDiemCheckbox ? elements.showPerDiemCheckbox.checked : true;

    // Get the user-entered prejudgment interest amount when checkbox is unchecked
    const userEnteredPrejudgmentInterest = !showPrejudgment && elements.prejudgmentInterestAmountInput 
        ? parseCurrency(elements.prejudgmentInterestAmountInput.value) 
        : useStore.getState().inputs.userEnteredPrejudgmentInterest || 0;

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
        showPerDiem,
        userEnteredPrejudgmentInterest
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
    
    // Ensure date synchronization for validation purposes when judgment date is available
    if (inputs.dateOfJudgment && (!inputs.nonPecuniaryJudgmentDate || !inputs.costsAwardedDate)) {
        // If judgment date exists but the others don't, synchronize them
        inputs.nonPecuniaryJudgmentDate = inputs.dateOfJudgment;
        inputs.costsAwardedDate = inputs.dateOfJudgment;
    }

    // Check all required dates exist, but only check prejudgmentStartDate if showPrejudgment is true
    // and only check postjudgmentEndDate if showPostjudgment is true
    if (!inputs.dateOfJudgment || 
        !inputs.nonPecuniaryJudgmentDate || !inputs.costsAwardedDate || 
        (inputs.showPrejudgment && !inputs.prejudgmentStartDate) ||
        (inputs.showPostjudgment && !inputs.postjudgmentEndDate)) {
        validationMessage = "One or more required dates are missing or invalid.";
        isValid = false;
    } else {
        // All damage dates are now inputs.dateOfJudgment. Simplify checks.
        
        // Only check prejudgment constraints if the section is visible
        if (inputs.showPrejudgment) {
            // Check judgment date against prejudgment start date
            if (dateBefore(inputs.dateOfJudgment, inputs.prejudgmentStartDate)) {
                validationMessage = "Judgment Date cannot be before Prejudgment Start Date.";
                isValid = false;
            }
            
            // Check prejudgment start date against judgment date
            if (dateAfter(inputs.prejudgmentStartDate, inputs.dateOfJudgment)) {
                validationMessage = "Cause of action date cannot be later than the Judgment Date.";
                isValid = false;
            }
        }
        
        // Only check postjudgment constraints if the section is visible
        if (inputs.showPostjudgment) {
            // Check postjudgment end date against judgment date
            if (dateBefore(inputs.postjudgmentEndDate, inputs.dateOfJudgment)) {
                validationMessage = "Accrual date cannot be later than the Judgment Date.";
                isValid = false;
            }
        }
    }
    
    // Check all currency amounts
    if (inputs.judgmentAwarded < 0 || inputs.nonPecuniaryAwarded < 0 || inputs.costsAwarded < 0) {
        validationMessage = "General Damages & Debt, Non-pecuniary Damages, and Costs & Disbursements amounts cannot be negative.";
        isValid = false;
    }

    return { isValid, validationMessage };
}
