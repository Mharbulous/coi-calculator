/**
 * Table row processor for pagination.
 */

import { 
    getElementAbsoluteTop, 
    getElementOuterHeight, 
    insertBlankRow, 
    insertHeaderRow 
} from './utils.js';

/**
 * Processes a table row for pagination, determining if it needs to be pushed to the next page.
 * 
 * @param {HTMLElement} row - The table row to process
 * @param {Object} context - The pagination context
 * @param {number} context.currentPageIndex - Current page index
 * @param {Array<number>} context.workspaceBottom - Array of workspace bottom boundaries
 * @param {Array<number>} context.workspaceTop - Array of workspace top boundaries
 * @param {number} context.tableFootHeight - Height of the table footer
 * @param {HTMLElement} context.headerRow - The header row to clone if a break is needed
 * @returns {Object|null} Break information if a break is needed, null otherwise
 */
export function processTableRow(row, context) {
    const { 
        currentPageIndex, 
        workspaceBottom, 
        workspaceTop, 
        tableFootHeight,
        headerRow
    } = context;
    
    // Get row dimensions
    const rowTop = getElementAbsoluteTop(row);
    const rowHeight = getElementOuterHeight(row);
    const rowBottom = rowTop + rowHeight;

    // Ensure we don't check against a non-existent page
    if (currentPageIndex >= workspaceBottom.length) {
        console.warn(`Attempting to check against page index ${currentPageIndex}, but only ${workspaceBottom.length} pages exist.`);
        return null;
    }

    // Check if row bottom (plus footer) exceeds current page's workspace bottom
    if (rowBottom + tableFootHeight > workspaceBottom[currentPageIndex]) {
        // Ensure there's a next page to calculate the gap against
        if (currentPageIndex + 1 < workspaceTop.length) {
            // Calculate break height
            const blankRowHeight = workspaceTop[currentPageIndex + 1] - rowTop;
            
            // Insert break
            insertBlankRow(row, blankRowHeight);
            const headerHeight = insertHeaderRow(row, headerRow);

            // Return break information
            return {
                pageBreakInserted: true,
                heightAdded: blankRowHeight + headerHeight,
                newPageIndex: currentPageIndex + 1
            };
        } else {
            console.warn("Row overflow detected, but no next page exists to calculate break space.");
            return null;
        }
    }
    
    // No break needed
    return null;
}
