import elements from './elements.js';
import useStore from '../store.js';

/**
 * Toggles the visibility of the prejudgment section based on the checkbox state.
 * Only hides the table part, not the section title or checkbox.
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
    
    // Update the DOM visibility
    elements.prejudgmentSection.style.display = isChecked ? '' : 'none';
    
    // Update the Zustand store (unless we're initializing)
    if (!isInitializing) {
        useStore.getState().setInput('showPrejudgment', isChecked);
    }

    // Trigger recalculation unless it's the initial setup phase
    if (!isInitializing && typeof recalculateCallback === 'function') {
        recalculateCallback();
    }
}

/**
 * Toggles the visibility of the postjudgment section based on the checkbox state.
 * Only hides the table part, not the section title or checkbox.
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

    // Toggle visibility of the table section only
    elements.postjudgmentSection.style.display = isChecked ? '' : 'none';
    
    // Update the Zustand store (unless we're initializing)
    if (!isInitializing) {
        useStore.getState().setInput('showPostjudgment', isChecked);
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
