// BC COIA calculator/dom/tables.interest.js
// This file now acts as a facade, re-exporting the primary functionality
// from the new core module.

import { updateInterestTable as coreUpdateInterestTable } from './tables.interest.core.js';

/**
 * Updates an interest table (prejudgment or postjudgment) with calculated details.
 * This function is a re-export from tables.interest.core.js.
 * @param {HTMLTableSectionElement} tableBody - The tbody element of the table.
 * @param {HTMLElement|null} principalTotalElement - Element for principal total (null if not applicable).
 * @param {HTMLElement} interestTotalElement - Element for interest total.
 * @param {object} resultState - The state object containing details, total, principal, etc. (e.g., appState.results.prejudgmentResult).
 * @param {number|null} principalTotalForFooter - The specific principal total to display in the footer (used for prejudgment).
 * @param {object} interestRatesData - The interest rates data for payment processing.
 */
export function updateInterestTable(tableBody, principalTotalElement, interestTotalElement, resultState, principalTotalForFooter, interestRatesData) {
    // The window._isSpecialDamagesAddInProgress flag check was removed on 2025-05-11
    // as it was deprecated. The core logic (tables.interest.core.js) no longer relies on this flag.
    // Table updates are now consistently handled by the event-driven recalculation flow
    // triggered after store updates.
    coreUpdateInterestTable(tableBody, principalTotalElement, interestTotalElement, resultState, principalTotalForFooter, interestRatesData);
}

// If there were other functions exported from the original tables.interest.js that are still needed
// by other parts of the application, they would also be re-exported here,
// potentially by moving their logic to one of the new modules and then re-exporting from that module via core.js,
// or directly from their new module if appropriate.
// For this refactor, only updateInterestTable was specified as the main entry point.
