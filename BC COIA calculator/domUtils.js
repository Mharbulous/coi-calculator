/**
 * Re-exports all DOM utility functions from the dom/ directory.
 * This file maintains backward compatibility with existing code.
 */

// Re-export elements
export { default as elements } from './dom/elements.js';

// Re-export from inputs.js
export { getInputValues, validateInputValues } from './dom/inputs.js';

// Re-export from tables.interest.js and tables.summary.js
export { updateInterestTable } from './dom/tables.interest.js';
export { updateSummaryTable, clearResults } from './dom/tables.summary.js';

// Re-export from visibility.js
export { togglePrejudgmentVisibility, togglePostjudgmentVisibility, togglePerDiemVisibility } from './dom/visibility.js';

// Re-export from setup.js
export { setupCustomDateInputListeners, setupCurrencyInputListeners, setDefaultInputValues, initializeDatePickers } from './dom/setup.js';

// Re-export from specialDamages.js
export { insertSpecialDamagesRow, insertSpecialDamagesRowFromData, insertCalculatedRowIfNeeded } from './dom/specialDamages.js';
