/**
 * Calculates the approximate height of a printable page area in pixels.
 * This is based on standard letter size (11 inches) minus top/bottom margins (0.75in each).
 * @returns {number} Approximate printable page height in pixels.
 */
export function getPrintablePageHeightPx() {
    // Printable area height = 11in - (2 * 0.75in) = 9.5in
    const pageHeightInches = 9.5;
    // Assume standard screen DPI. 96 is a common default, but this is an approximation.
    const dpi = 96;
    return pageHeightInches * dpi;
}

/**
 * Adds or updates visual page break indicator labels within the '.paper' element.
 * These indicators provide a rough guide for where page breaks might occur when printing.
 */
export function updatePageBreakIndicators() {
    const paper = document.querySelector('.paper');
    if (!paper) {
        console.warn("Could not find '.paper' element to add page break indicators.");
        return;
    }

    // Clear any existing indicators first to prevent duplicates
    const existingIndicators = paper.querySelectorAll('.page-break-indicator');
    existingIndicators.forEach(el => el.remove());

    const pageHeightPx = getPrintablePageHeightPx();
    if (pageHeightPx <= 0) {
        console.warn("Calculated printable page height is invalid.");
        return;
    }

    // Calculate the total scroll height of the content within the paper element
    const paperHeight = paper.scrollHeight;
    // Determine how many approximate pages the content spans
    const numPages = Math.ceil(paperHeight / pageHeightPx);

    // Add indicator labels just above each calculated page break line
    // Start from the first break (end of page 1)
    for (let i = 1; i < numPages; i++) {
        const breakPositionPx = i * pageHeightPx;
        const indicator = document.createElement('div');
        indicator.className = 'page-break-indicator';
        // Label indicates the start of the next page
        indicator.textContent = `~ Page ${i + 1} ~`;
        // Position the indicator vertically centered on the calculated break line
        indicator.style.top = `${breakPositionPx}px`;
        paper.appendChild(indicator);
    }

    // After adding the general page break indicators, handle tables
    insertTablePageBreakRows(pageHeightPx);
}

/**
 * Inserts special "page break" rows into tables that would span across page boundaries.
 * These rows create a visual representation of page breaks within tables.
 * @param {number} pageHeightPx - The height of a printable page in pixels.
 */
function insertTablePageBreakRows(pageHeightPx) {
    // First, remove any existing page break rows to avoid duplicates
    const existingBreakRows = document.querySelectorAll('tr.page-break-row');
    existingBreakRows.forEach(row => row.remove());

    // Get the paper element for position calculations
    const paper = document.querySelector('.paper');
    if (!paper) return;
    
    const paperRect = paper.getBoundingClientRect();
    const paperTop = paperRect.top;
    const paperLeft = paperRect.left;
    
    // Find all tables that might need page break rows
    const tables = document.querySelectorAll('.interest-table');
    
    tables.forEach(table => {
        // Get the table's position relative to the paper
        const tableRect = table.getBoundingClientRect();
        const tableTop = tableRect.top - paperTop;
        
        // Calculate which page the table starts on
        const startPage = Math.floor(tableTop / pageHeightPx);
        
        // Get all rows in the table body (excluding any existing page break rows)
        const tbody = table.querySelector('tbody');
        if (!tbody) return;
        
        const rows = Array.from(tbody.querySelectorAll('tr:not(.page-break-row)'));
        if (rows.length === 0) return;
        
        // Track our current position as we go through rows
        let currentPosition = tableTop;
        
        // Calculate page boundaries
        const pageBreakPositions = [];
        for (let i = 1; i < 10; i++) { // Support up to 10 pages
            pageBreakPositions.push(i * pageHeightPx);
        }
        
        // Check each row to see if it crosses a page boundary
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowRect = row.getBoundingClientRect();
            const rowHeight = rowRect.height;
            const rowTop = rowRect.top - paperTop;
            const rowBottom = rowTop + rowHeight;
            
            // Find if this row crosses any page boundary
            for (const breakPosition of pageBreakPositions) {
                // If the row spans across this page break
                if (rowTop < breakPosition && rowBottom > breakPosition) {
                    // Calculate which pages this row spans
                    const startPage = Math.floor(rowTop / pageHeightPx) + 1;
                    const endPage = Math.floor(rowBottom / pageHeightPx) + 1;
                    
                    // Create a page break row
                    const pageBreakRow = document.createElement('tr');
                    pageBreakRow.className = 'page-break-row';
                    
                    // Create a cell that spans all columns
                    const cell = document.createElement('td');
                    const columnCount = row.cells.length || 5; // Default to 5 if can't determine
                    cell.colSpan = columnCount;
                    
                    // Add the page break label
                    const label = document.createElement('div');
                    label.className = 'page-break-label';
                    label.textContent = `Page ${startPage} End / Page ${endPage} Start`;
                    cell.appendChild(label);
                    
                    pageBreakRow.appendChild(cell);
                    
                    // Insert the page break row after the current row
                    if (row.nextSibling) {
                        tbody.insertBefore(pageBreakRow, row.nextSibling);
                    } else {
                        tbody.appendChild(pageBreakRow);
                    }
                    
                    // Skip ahead in our loop since we've added a row
                    // and need to recalculate positions
                    break;
                }
            }
        }
    });
}

/**
 * Sets up event listeners to automatically update page break indicators
 * on initial page load and window resize events (debounced).
 */
export function setupPageBreakIndicatorListeners() {
    // Initial update on load
    window.addEventListener('load', updatePageBreakIndicators);

    // Update on resize, but debounce to avoid performance issues
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        // Wait 250ms after the last resize event before updating
        resizeTimeout = setTimeout(updatePageBreakIndicators, 250);
    });
}
