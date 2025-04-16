/**
 * Re-exports all DOM utility functions from the dom/ directory.
 * This file maintains backward compatibility with existing code.
 */

// Re-export elements
export { default as elements } from './dom/elements.js';

// Re-export from inputs.js
export { getInputValues, validateInputValues } from './dom/inputs.js';

// Re-export from tables.js
export { updateInterestTable, updateSummaryTable, clearResults } from './dom/tables.js';

// Re-export from visibility.js
export { togglePrejudgmentVisibility, togglePostjudgmentVisibility, togglePerDiemVisibility } from './dom/visibility.js';

// Re-export from setup.js
export { setupCustomDateInputListeners, setupCurrencyInputListeners, setDefaultInputValues } from './dom/setup.js';

// Re-export from specialDamages.js
export { insertSpecialDamagesRow, insertSpecialDamagesRowFromData, insertCalculatedRowIfNeeded } from './dom/specialDamages.js';
