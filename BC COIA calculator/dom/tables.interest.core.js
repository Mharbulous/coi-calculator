// BC COIA calculator/dom/tables.interest.core.js
// This module will serve as the main orchestrator and entry point for interest table updates.
// It will retain the primary updateInterestTable function signature for backward compatibility
// and will coordinate calls to the other new modules (rowRendering and rowSorting).

import useStore from '../store.js';
import {
    renderInitialInterestRows,
    updateTableFooter
} from './tables.interest.rowRendering.js';
import {
    collectAndSortRows
} from './tables.interest.rowSorting.js';
// We will need elements for the footer update, but let's pass it from here for now or let rowRendering handle it.
// import elements from './elements.js'; 

export function updateInterestTable(tableBody, principalTotalElement, interestTotalElement, resultState, principalTotalForFooter) {
    if (!tableBody || !interestTotalElement || !resultState) {
        console.error("Missing required table elements or result state for updateInterestTable in core");
        return;
    }

    const { details = [], total: interestTotal = 0, finalPeriodDamageInterestDetails = [] } = resultState;
    // principalTotal is derived from principalTotalForFooter for the footer display
    const principalTotal = principalTotalForFooter;

    // Determine if this is the prejudgment table
    const isPrejudgmentTable = tableBody.id === 'prejudgmentTableBody' ||
                              tableBody.closest('table')?.id === 'prejudgmentTable';

    // Clear previous rows
    tableBody.innerHTML = '';

    // 1. Render initial interest calculation rows
    // This function will handle the main loop through `details` for standard interest periods.
    // It will need `details`, `isPrejudgmentTable`, and potentially `principalTotal` (for postjudgment).
    renderInitialInterestRows(tableBody, details, isPrejudgmentTable, principalTotal);

    // 2. Collect, sort, and insert special damages and payments
    // This function will handle fetching existing special damages/payments, sorting all items,
    // and inserting them into the table at correct positions.
    // It needs `tableBody`, `details` (for period dates), `resultState` (for store access if needed, or pass store data),
    // `isPrejudgmentTable`, `finalPeriodDamageInterestDetails`.
    // The original function also used `finalPeriodStartDate` derived from `details`.
    let finalPeriodStartDateStr = null;
    if (details.length > 0) {
        const lastDetail = details[details.length - 1];
        // Pass the string date; rowSorting.js will parse it.
        finalPeriodStartDateStr = lastDetail.start; 
    }
    
    // Pass finalPeriodDamageInterestDetails from resultState
    collectAndSortRows(tableBody, details, resultState, isPrejudgmentTable, finalPeriodStartDateStr, resultState.finalPeriodDamageInterestDetails);

    // 3. Update totals in the footer
    // This function will handle updating principal, interest totals, dates, and total days.
    // It needs `tableBody`, `principalTotalElement`, `interestTotalElement`, `resultState` (or specific totals),
    // `principalTotalForFooter`, `isPrejudgmentTable`, and `details` (for total days).
    updateTableFooter(tableBody, principalTotalElement, interestTotalElement, resultState, principalTotalForFooter, isPrejudgmentTable, details);

    console.log('updateInterestTable in core.js finished orchestration');
}
