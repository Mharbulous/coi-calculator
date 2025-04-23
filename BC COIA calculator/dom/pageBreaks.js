/**
 * Calculates the approximate height of a printable page area in pixels.
 * This is based on standard letter size (11 inches) minus top/bottom margins (0.75in each).
 * @returns {number} Approximate printable page height in pixels.
 */
export function getPrintablePageHeightPx() {
    // Printable area height = 11in - (2 * 0.75in) = 9.5in
    // Adding 2.5 inches to make the online pages taller as requested
    const pageHeightInches = 12.0; // 9.5 + 2.5 = 12.0
    // Assume standard screen DPI. 96 is a common default, but this is an approximation.
    const dpi = 96;
    
    // Calculate the base height
    const baseHeight = pageHeightInches * dpi;
    
    // Return the base height without any adjustment
    return baseHeight;
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
    
    // Add indicators between tables if needed
    insertBetweenTableIndicators(pageHeightPx);
}

/**
 * Inserts page break indicators between tables or at table boundaries when needed.
 * This handles cases where page breaks occur in gaps between tables or at table edges.
 * @param {number} pageHeightPx - The height of a printable page in pixels.
 */
function insertBetweenTableIndicators(pageHeightPx) {
    const paper = document.querySelector('.paper');
    if (!paper) return;
    
    const paperRect = paper.getBoundingClientRect();
    const paperTop = paperRect.top;
    
    // Get all table elements (including headers, footers, etc.)
    const tableElements = paper.querySelectorAll('.interest-table, .interest-table caption, .interest-table thead, .interest-table tfoot, h2');
    
    // Calculate page boundaries
    const pageBreakPositions = [];
    for (let i = 1; i < 10; i++) { // Support up to 10 pages
        pageBreakPositions.push(i * pageHeightPx);
    }
    
    // Track which page boundaries we've already inserted indicators for
    const insertedBreakPositions = new Set();
    
    // First, handle table footers and total rows specifically to prevent them from being split
    handleTableFooters(paper, paperTop, pageHeightPx, insertedBreakPositions);
    
    // Check each table element to see if a page break occurs at its boundary
    tableElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top - paperTop;
        const elementBottom = rect.bottom - paperTop;
        
        // Check if the top or bottom edge of the element is near a page break
        for (const breakPosition of pageBreakPositions) {
            // Skip if we've already inserted an indicator for this position
            if (insertedBreakPositions.has(breakPosition)) continue;
            
            // Check if the element's top or bottom edge is very close to a page break
            // (within 20 pixels)
            const topNearBreak = Math.abs(elementTop - breakPosition) < 20;
            const bottomNearBreak = Math.abs(elementBottom - breakPosition) < 20;
            
            // Also check if a page break occurs within the element (not just at edges)
            const breakWithinElement = elementTop < breakPosition && elementBottom > breakPosition;
            
            if (topNearBreak || bottomNearBreak || breakWithinElement) {
                // Calculate which page this break is on
                const pageNum = Math.floor(breakPosition / pageHeightPx);
                
                // Create a special indicator for this boundary
                const indicator = document.createElement('div');
                indicator.className = 'page-break-indicator table-boundary';
                indicator.textContent = `~ Page ${pageNum} End / Page ${pageNum + 1} Start ~`;
                indicator.style.top = `${breakPosition}px`;
                
                // Add a special class to make it more visible
                indicator.style.backgroundColor = 'rgba(255, 200, 0, 0.2)';
                indicator.style.fontWeight = 'bold';
                
                paper.appendChild(indicator);
                
                // Mark this position as handled
                insertedBreakPositions.add(breakPosition);
            }
        }
    });
}

/**
 * Specifically handles table footers and total rows to prevent them from being split across pages.
 * @param {HTMLElement} paper - The paper element containing all content
 * @param {number} paperTop - The top position of the paper element
 * @param {number} pageHeightPx - The height of a printable page in pixels
 * @param {Set} insertedBreakPositions - Set to track which break positions have been handled
 */
function handleTableFooters(paper, paperTop, pageHeightPx, insertedBreakPositions) {
    // Find all table footers and total rows
    const footerElements = paper.querySelectorAll('.interest-table tfoot, .interest-table tr.total');
    
    // Also find rows that contain "Total:" text (since we can't use :contains in standard JS)
    const allTableRows = paper.querySelectorAll('.interest-table tr');
    const totalRows = Array.from(allTableRows).filter(row => {
        return row.textContent.includes('Total:');
    });
    
    // Combine the footer elements with the total rows
    const allFooterElements = [...footerElements, ...totalRows];
    
    allFooterElements.forEach(footer => {
        const rect = footer.getBoundingClientRect();
        const footerTop = rect.top - paperTop;
        const footerBottom = rect.bottom - paperTop;
        const footerHeight = rect.height;
        
        // Calculate which page the footer starts on
        const startPage = Math.floor(footerTop / pageHeightPx);
        // Calculate which page the footer ends on
        const endPage = Math.floor(footerBottom / pageHeightPx);
        
        // If the footer spans across pages, we need to insert a page break before it
        if (startPage !== endPage) {
            // Calculate the position for the page break (just before the footer)
            const breakPosition = startPage * pageHeightPx;
            
            // Create a special indicator for this footer break
            const indicator = document.createElement('div');
            indicator.className = 'page-break-indicator table-boundary footer-break';
            indicator.textContent = `~ Page ${startPage} End / Page ${startPage + 1} Start (Footer Protected) ~`;
            indicator.style.top = `${footerTop - 5}px`; // Position just above the footer
            
            // Make it very visible
            indicator.style.backgroundColor = 'rgba(255, 100, 0, 0.2)';
            indicator.style.fontWeight = 'bold';
            indicator.style.zIndex = '200'; // Ensure it's above other indicators
            
            paper.appendChild(indicator);
            
            // Mark this position as handled
            insertedBreakPositions.add(breakPosition);
        }
    });
    
    // Special handling for the last row of each table
    const tables = paper.querySelectorAll('.interest-table');
    tables.forEach(table => {
        const tbody = table.querySelector('tbody');
        if (!tbody) return;
        
        const rows = tbody.querySelectorAll('tr');
        if (rows.length === 0) return;
        
        // Get the last row of the table body
        const lastRow = rows[rows.length - 1];
        const rect = lastRow.getBoundingClientRect();
        const rowTop = rect.top - paperTop;
        const rowBottom = rect.bottom - paperTop;
        
        // Calculate which page the row starts and ends on
        const startPage = Math.floor(rowTop / pageHeightPx);
        const endPage = Math.floor(rowBottom / pageHeightPx);
        
        // If the last row spans across pages, insert a break before it
        if (startPage !== endPage) {
            const breakPosition = startPage * pageHeightPx;
            
            // Create a special indicator
            const indicator = document.createElement('div');
            indicator.className = 'page-break-indicator table-boundary last-row-break';
            indicator.textContent = `~ Page ${startPage} End / Page ${startPage + 1} Start (Last Row Protected) ~`;
            indicator.style.top = `${rowTop - 5}px`;
            
            indicator.style.backgroundColor = 'rgba(100, 255, 100, 0.2)';
            indicator.style.fontWeight = 'bold';
            
            paper.appendChild(indicator);
            
            // Mark this position as handled
            insertedBreakPositions.add(breakPosition);
        }
    });
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
    
    // Find all tables that might need page break rows
    const tables = document.querySelectorAll('.interest-table');
    
    tables.forEach(table => {
        // Get the table's position relative to the paper
        const tableRect = table.getBoundingClientRect();
        const tableTop = tableRect.top - paperTop;
        
        // Get all rows in the table body (excluding any existing page break rows)
        const tbody = table.querySelector('tbody');
        if (!tbody) return;
        
        const rows = Array.from(tbody.querySelectorAll('tr:not(.page-break-row)'));
        if (rows.length === 0) return;
        
        // Calculate page boundaries with an offset to move the cut-off point lower
        // Estimate about 3 rows worth of height (approximately 90px)
        const rowOffsetPx = 90; // Approximately 3 rows
        const pageBreakPositions = [];
        for (let i = 1; i < 10; i++) { // Support up to 10 pages
            pageBreakPositions.push((i * pageHeightPx) + rowOffsetPx);
        }
        
        // Track which page boundaries we've already inserted break rows for
        const insertedBreakPositions = new Set();
        
        // First pass: identify all page boundaries that need break rows
        const breakPositionsNeeded = new Map(); // Maps break position to the row after which to insert
        
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowRect = row.getBoundingClientRect();
            const rowHeight = rowRect.height;
            const rowTop = rowRect.top - paperTop;
            const rowBottom = rowTop + rowHeight;
            
            // Find if this row crosses any page boundary
            for (const breakPosition of pageBreakPositions) {
                // If the row spans across this page break and we haven't already 
                // planned to insert a break row for this position
                if (rowTop < breakPosition && rowBottom > breakPosition && 
                    !insertedBreakPositions.has(breakPosition)) {
                    
                    // Store this row as the one after which to insert the break
                    breakPositionsNeeded.set(breakPosition, row);
                    insertedBreakPositions.add(breakPosition);
                    break; // Only handle one page break per row
                }
            }
        }
        
        // Second pass: insert the break rows
        for (const [breakPosition, row] of breakPositionsNeeded.entries()) {
            // Calculate which pages this break spans
            const startPage = Math.floor(breakPosition / pageHeightPx);
            const endPage = startPage + 1;
            
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
