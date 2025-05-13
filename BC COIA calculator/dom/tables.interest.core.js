// BC COIA calculator/dom/tables.interest.core.js
// This module will serve as the main orchestrator and entry point for interest table updates.
// It will retain the primary updateInterestTable function signature for backward compatibility
// and will coordinate calls to the other new modules (rowRendering and rowSorting).

import useStore from '../store.js';
import { logger } from '../util.logger.js'; // Import for enhanced debugging
import {
    renderInitialInterestRows,
    updateTableFooter
} from './tables.interest.rowRendering.js';
import {
    collectAndSortRows
} from './tables.interest.rowSorting.js';
// We will need elements for the footer update, but let's pass it from here for now or let rowRendering handle it.
// import elements from './elements.js'; 

export function updateInterestTable(tableBody, principalTotalElement, interestTotalElement, resultState, principalTotalForFooter, interestRatesData) {
    console.log("[DEBUG] updateInterestTable in core.js starting orchestration");
    console.log("[DEBUG] tableBody ID:", tableBody ? tableBody.id : "undefined");
    
    if (!tableBody || !interestTotalElement || !resultState) {
        console.error("Missing required table elements or result state for updateInterestTable in core");
        return;
    }

    const { details = [], total: interestTotal = 0, finalPeriodDamageInterestDetails = [] } = resultState;
    console.log("[DEBUG] resultState details count:", details.length);
    console.log("[DEBUG] resultState contains payments:", 
                resultState.payments ? `Yes, ${resultState.payments.length} payments` : "No");
    
    // principalTotal is derived from principalTotalForFooter for the footer display
    const principalTotal = principalTotalForFooter;

    // Determine if this is the prejudgment table
    const isPrejudgmentTable = tableBody.id === 'prejudgmentTableBody' ||
                              tableBody.closest('table')?.id === 'prejudgmentTable';
    console.log("[DEBUG] isPrejudgmentTable:", isPrejudgmentTable);

    // Clear previous rows
    console.log("[DEBUG] Clearing previous table rows");
    tableBody.innerHTML = '';
    
    // Filter out any duplicative rows from details
    // This is an extra check to ensure no duplications in row data
    const filteredDetails = [];
    const seenDates = new Set();
    
    // First pass: identify payment dates that match end dates
    const paymentDates = new Set();
    if (resultState.payments && resultState.payments.length > 0) {
        resultState.payments.forEach(payment => {
            paymentDates.add(payment.date.toString());
        });
    }
    
    // Second pass: filter out rows that would cause duplication
    for (let i = 0; i < details.length; i++) {
        const detail = details[i];
        
        // Skip payment rows that were already processed
        if (detail.isPayment && seenDates.has(detail.start.toString())) {
            continue;
        }
        
        // Add the row to our filtered list
        filteredDetails.push(detail);
        
        // Mark this date as seen
        if (detail.start) {
            seenDates.add(detail.start.toString());
        }
    }
    
    console.log("[DEBUG] Filtered details count:", filteredDetails.length, 
                "Original count:", details.length);

    // 1. Render initial interest calculation rows
    console.log("[DEBUG] Calling renderInitialInterestRows with filtered details length:", filteredDetails.length);
    renderInitialInterestRows(tableBody, filteredDetails, isPrejudgmentTable, principalTotal);
    console.log("[DEBUG] After renderInitialInterestRows, tableBody row count:", tableBody.rows.length);

    // 2. Collect, sort, and insert special damages and payments
    let finalPeriodStartDateStr = null;
    if (details.length > 0) {
        const lastDetail = details[details.length - 1];
        // Pass the string date; rowSorting.js will parse it.
        finalPeriodStartDateStr = lastDetail.start; 
        console.log("[DEBUG] Set finalPeriodStartDateStr from last detail:", finalPeriodStartDateStr);
    }
    
    // Pass finalPeriodDamageInterestDetails from resultState and interestRatesData
    console.log("[DEBUG] Calling collectAndSortRows to insert special damages and payments");
    collectAndSortRows(tableBody, details, resultState, isPrejudgmentTable, finalPeriodStartDateStr, resultState.finalPeriodDamageInterestDetails, interestRatesData);
    console.log("[DEBUG] After collectAndSortRows, tableBody row count:", tableBody.rows.length);
    
    // List all payment rows to check if any were added
    const paymentRows = tableBody.querySelectorAll('.payment-row');
    console.log("[DEBUG] Payment rows found in table after collectAndSortRows:", paymentRows.length);
    
    // 3. Update totals in the footer
    console.log("[DEBUG] Updating table footer");
    updateTableFooter(tableBody, principalTotalElement, interestTotalElement, resultState, principalTotalForFooter, isPrejudgmentTable, details);

    console.log('[DEBUG] updateInterestTable in core.js finished orchestration');
}
