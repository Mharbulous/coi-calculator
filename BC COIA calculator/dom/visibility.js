import elements from './elements.js';
import useStore from '../store.js';
import { formatDateForInput } from '../utils.date.js';

/**
 * Toggles the visibility of the prejudgment section based on the checkbox state.
 * Hides both the table part and the section title when unchecked.
 * Also hides the prejudgment interest date field in the summary table when unchecked.
 * @param {boolean} isInitializing - Flag to indicate if this is during initial page load.
 * @param {function|null} recalculateCallback - Function to call after toggling (usually recalculate).
 */
export function togglePrejudgmentVisibility(isInitializing = false, recalculateCallback) {
    if (!elements.showPrejudgmentCheckbox || !elements.prejudgmentSection) {
        console.error("Required elements for toggling prejudgment visibility not found.");
        return;
    }
    
    // Get the checked state from the DOM element
    const isChecked = elements.showPrejudgmentCheckbox.checked;
    
    // Find the section title element that's a sibling of prejudgmentSection
    const prejudgmentTitle = elements.prejudgmentSection.previousElementSibling;
    
    // Toggle visibility of both the section and its title
    elements.prejudgmentSection.style.display = isChecked ? '' : 'none';
    if (prejudgmentTitle && prejudgmentTitle.classList.contains('section-title')) {
        prejudgmentTitle.style.display = isChecked ? '' : 'none';
    }
    
    // Find and toggle visibility of prejudgment date field in summary table
    if (elements.summaryTableBody) {
        // First attempt: Directly access the prejudgmentInterestDateInput element if available
        if (elements.prejudgmentInterestDateInput) {
            // Find the parent date-cell-container
            let dateCellContainer = elements.prejudgmentInterestDateInput.closest('.date-cell-container');
            if (dateCellContainer) {
                // Toggle visibility of the entire date cell container
                dateCellContainer.style.display = isChecked ? '' : 'none';
            } else {
                // If container not found, just hide the input itself
                elements.prejudgmentInterestDateInput.style.display = isChecked ? '' : 'none';
            }
        } else {
            // Fallback approach: Search for the row in the table
            const prejudgmentRow = Array.from(elements.summaryTableBody.querySelectorAll('tr')).find(row => {
                const itemTextEl = row.querySelector('[data-display="itemText"]');
                return itemTextEl && itemTextEl.textContent === 'Prejudgment Interest';
            });
            
            if (prejudgmentRow) {
                // Find and hide the date cell container
                const dateCellContainer = prejudgmentRow.querySelector('.date-cell-container');
                if (dateCellContainer) {
                    // Toggle visibility of the date cell container
                    dateCellContainer.style.display = isChecked ? '' : 'none';
                }
                
                // Also try to find any elements with dateLabel, helpIcon, or dateInput
                const helpIcon = prejudgmentRow.querySelector('[data-display="helpIcon"]');
                const dateLabel = prejudgmentRow.querySelector('[data-display="dateLabel"]');
                const dateInput = prejudgmentRow.querySelector('[data-input="dateValue"]');
                
                if (helpIcon) helpIcon.style.display = isChecked ? '' : 'none';
                if (dateLabel) dateLabel.style.display = isChecked ? '' : 'none';
                if (dateInput) dateInput.style.display = isChecked ? '' : 'none';
            }
        }
    }
    
    // Get the current state before making changes
    const currentState = useStore.getState();
    const prejudgmentStartDate = currentState.inputs.prejudgmentStartDate;
    const userEnteredPrejudgmentInterest = currentState.inputs.userEnteredPrejudgmentInterest;
    const calculatedPrejudgmentInterest = currentState.results.prejudgmentResult.total;
    
    // Update the Zustand store (unless we're initializing)
    if (!isInitializing) {
        useStore.getState().setInput('showPrejudgment', isChecked);
        
        if (isChecked) {
            // If we're turning the checkbox back on:
            
            // 1. Restore the saved prejudgment calculation state (if any)
            console.log("Restoring saved prejudgment calculation state");
            useStore.getState().restorePrejudgmentState();
            
            // 2. Update the DOM with the restored date value
            const restoredState = useStore.getState();
            if (restoredState.inputs.prejudgmentStartDate && elements.prejudgmentInterestDateInput) {
                // Format the date for display in the input field
                const formattedDate = formatDateForInput(restoredState.inputs.prejudgmentStartDate);
                elements.prejudgmentInterestDateInput.value = formattedDate;
                console.log("Restored prejudgment date to DOM:", formattedDate);
            }
        } else {
            // If we're turning the checkbox off:
            
            // 1. Save the current prejudgment calculation state
            console.log("Saving current prejudgment calculation state");
            useStore.getState().savePrejudgmentState();
            
            // 2. Save the current calculated value as the user-entered value
            if (calculatedPrejudgmentInterest > 0) {
                console.log("Saving calculated prejudgment interest as user-entered value:", calculatedPrejudgmentInterest);
                useStore.getState().setInput('userEnteredPrejudgmentInterest', calculatedPrejudgmentInterest);
            }
        }
        
        // If we're turning the checkbox off, clear any validation error that might be related to prejudgment date
        if (!isChecked) {
            // Check if all other required dates are valid
            const inputs = useStore.getState().inputs;
            const otherDatesValid = 
                inputs.dateOfJudgment && 
                inputs.nonPecuniaryJudgmentDate && 
                inputs.costsAwardedDate && 
                (inputs.showPostjudgment ? inputs.postjudgmentEndDate : true);
                
            // If all other dates are valid, clear the validation error
            if (otherDatesValid) {
                useStore.getState().setResult('validationError', false);
                useStore.getState().setResult('validationMessage', '');
            }
            
            // Reset the prejudgment date input background color to normal if it exists
            if (elements.prejudgmentInterestDateInput) {
                elements.prejudgmentInterestDateInput.style.backgroundColor = '#e0f2f7'; // NORMAL_BACKGROUND_COLOR
            }
        }
    }

    // Trigger recalculation unless it's the initial setup phase
    if (!isInitializing && typeof recalculateCallback === 'function') {
        recalculateCallback();
    }
}

/**
 * Toggles the visibility of the postjudgment section based on the checkbox state.
 * Hides both the table part and the section title when unchecked.
 * @param {boolean} isInitializing - Flag to indicate if this is during initial page load.
 * @param {function|null} recalculateCallback - Function to call after toggling (usually recalculate).
 */
export function togglePostjudgmentVisibility(isInitializing = false, recalculateCallback) {
    if (!elements.showPostjudgmentCheckbox || !elements.postjudgmentSection) {
        console.error("Required elements for toggling postjudgment visibility not found.");
        return;
    }
    
    // Get the checked state from the DOM element
    const isChecked = elements.showPostjudgmentCheckbox.checked;

    // Find the section title element that's a sibling of postjudgmentSection
    const postjudgmentTitle = elements.postjudgmentSection.previousElementSibling;
    
    // Toggle visibility of both the section and its title
    elements.postjudgmentSection.style.display = isChecked ? '' : 'none';
    if (postjudgmentTitle && postjudgmentTitle.classList.contains('section-title')) {
        postjudgmentTitle.style.display = isChecked ? '' : 'none';
    }
    
    // Save the current postjudgment date value before updating the store
    // This ensures we don't lose the date when toggling visibility
    const currentState = useStore.getState();
    const postjudgmentEndDate = currentState.inputs.postjudgmentEndDate;
    
    // Update the Zustand store (unless we're initializing)
    if (!isInitializing) {
        useStore.getState().setInput('showPostjudgment', isChecked);
        
        // If we're turning the checkbox back on and we have a saved date, make sure it's still in the store
        if (isChecked && postjudgmentEndDate) {
            useStore.getState().setInput('postjudgmentEndDate', postjudgmentEndDate);
        }
        
        // If we're turning the checkbox off, clear any validation error that might be related to postjudgment date
        if (!isChecked) {
            // Check if all other required dates are valid
            const inputs = useStore.getState().inputs;
            const otherDatesValid = 
                inputs.dateOfJudgment && 
                inputs.nonPecuniaryJudgmentDate && 
                inputs.costsAwardedDate && 
                (inputs.showPrejudgment ? inputs.prejudgmentStartDate : true);
                
            // If all other dates are valid, clear the validation error
            if (otherDatesValid) {
                useStore.getState().setResult('validationError', false);
                useStore.getState().setResult('validationMessage', '');
            }
            
            // Reset the postjudgment date input background color to normal if it exists
            if (elements.postjudgmentInterestDateInput) {
                elements.postjudgmentInterestDateInput.style.backgroundColor = '#e0f2f7'; // NORMAL_BACKGROUND_COLOR
            }
        }
    }

    // Trigger recalculation unless it's the initial setup phase
    if (!isInitializing && typeof recalculateCallback === 'function') {
        recalculateCallback();
    }
}

/**
 * Toggles the visibility of the per diem row based on the checkbox state.
 * @param {boolean} isInitializing - Flag to indicate if this is during initial page load.
 * @param {function|null} recalculateCallback - Function to call after toggling (usually recalculate).
 */
export function togglePerDiemVisibility(isInitializing = false, recalculateCallback) {
    if (!elements.showPerDiemCheckbox) {
        console.error("Required elements for toggling per diem visibility not found.");
        return;
    }
    
    // Get the checked state from the DOM element
    const isChecked = elements.showPerDiemCheckbox.checked;
    const perDiemRow = document.querySelector('.per-diem-row');
    
    if (perDiemRow) {
        perDiemRow.style.display = isChecked ? '' : 'none';
    }
    
    // Update the Zustand store (unless we're initializing)
    if (!isInitializing) {
        useStore.getState().setInput('showPerDiem', isChecked);
    }

    // Trigger recalculation unless it's the initial setup phase
    if (!isInitializing && typeof recalculateCallback === 'function') {
        recalculateCallback();
    }
}
