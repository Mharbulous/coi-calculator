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
    // Import logger for debugging
    return import('../util.logger.js').then((logger) => {
        if (!tableBody || !interestTotalElement || !resultState) {
            logger.error("Missing required table elements or result state for updateInterestTable in core");
            return;
        }

        const tableId = tableBody.id || (tableBody.closest('table')?.id || 'unknown');
        logger.debug(`Starting updateInterestTable for ${tableId}`);

        const { details = [], total: interestTotal = 0, finalPeriodDamageInterestDetails = [] } = resultState;
        // principalTotal is derived from principalTotalForFooter for the footer display
        const principalTotal = principalTotalForFooter;

        // Determine if this is the prejudgment table
        const isPrejudgmentTable = tableBody.id === 'prejudgmentTableBody' ||
                                tableBody.closest('table')?.id === 'prejudgmentTable';

        // Check if resultState has payment records
        const storeState = useStore.getState();
        const paymentRecords = storeState.results.payments || [];
        
        logger.debug("Table info before update:", {
            tableId,
            isPrejudgmentTable,
            detailsLength: details.length,
            hasPayments: paymentRecords.length > 0,
            paymentRecords,
            existingRows: tableBody.rows.length
        });

        // Clear previous rows
        logger.debug(`Clearing previous rows from ${tableId}`);
        tableBody.innerHTML = '';

        // 1. Render initial interest calculation rows
        logger.debug("Rendering initial interest calculation rows");
        renderInitialInterestRows(tableBody, details, isPrejudgmentTable, principalTotal);
        logger.debug(`After renderInitialInterestRows: ${tableBody.rows.length} rows`);

        // 2. Collect, sort, and insert special damages and payments
        let finalPeriodStartDateStr = null;
        if (details.length > 0) {
            const lastDetail = details[details.length - 1];
            // Pass the string date; rowSorting.js will parse it.
            finalPeriodStartDateStr = lastDetail.start; 
            logger.debug(`Final period start date: ${finalPeriodStartDateStr}`);
        }
        
        // Count payment rows in details before sorting
        const paymentRowsInDetails = details.filter(item => item.isPayment).length;
        logger.debug(`Payment rows in details before sorting: ${paymentRowsInDetails}`);
        
        logger.debug("Starting collectAndSortRows");
        // Pass finalPeriodDamageInterestDetails from resultState
        collectAndSortRows(tableBody, details, resultState, isPrejudgmentTable, finalPeriodStartDateStr, resultState.finalPeriodDamageInterestDetails);
        
        // Count payment rows after sorting
        const paymentRowsAfterSorting = tableBody.querySelectorAll('.payment-row').length;
        logger.debug(`Payment rows after sorting: ${paymentRowsAfterSorting}`);

        // 3. Update totals in the footer
        logger.debug("Updating table footer");
        updateTableFooter(tableBody, principalTotalElement, interestTotalElement, resultState, principalTotalForFooter, isPrejudgmentTable, details);

        // Final counts and checks
        const finalRows = tableBody.rows.length;
        const finalPaymentRows = tableBody.querySelectorAll('.payment-row').length;
        logger.debug("Final table state:", {
            totalRows: finalRows,
            paymentRows: finalPaymentRows,
            detailsLength: details.length,
            storePaymentsLength: paymentRecords.length
        });
        
        logger.info('updateInterestTable in core.js finished orchestration');
        
        // For completeness, return the result to allow chaining
        return {
            totalRows: finalRows,
            paymentRows: finalPaymentRows
        };
    }).catch(error => {
        console.error("Error in updateInterestTable:", error);
        
        // Fallback to non-instrumented version if logger fails
        if (!tableBody || !interestTotalElement || !resultState) {
            console.error("Missing required table elements or result state for updateInterestTable in core");
            return;
        }

        const { details = [], total: interestTotal = 0, finalPeriodDamageInterestDetails = [] } = resultState;
        const principalTotal = principalTotalForFooter;

        const isPrejudgmentTable = tableBody.id === 'prejudgmentTableBody' ||
                                tableBody.closest('table')?.id === 'prejudgmentTable';

        tableBody.innerHTML = '';
        renderInitialInterestRows(tableBody, details, isPrejudgmentTable, principalTotal);

        let finalPeriodStartDateStr = null;
        if (details.length > 0) {
            const lastDetail = details[details.length - 1];
            finalPeriodStartDateStr = lastDetail.start; 
        }
        
        collectAndSortRows(tableBody, details, resultState, isPrejudgmentTable, finalPeriodStartDateStr, resultState.finalPeriodDamageInterestDetails);
        updateTableFooter(tableBody, principalTotalElement, interestTotalElement, resultState, principalTotalForFooter, isPrejudgmentTable, details);

        console.log('updateInterestTable in core.js finished orchestration');
    });
}
