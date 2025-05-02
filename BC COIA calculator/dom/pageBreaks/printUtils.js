/**
 * Utilities for managing print-specific page breaks using the "Clone for Print" method.
 */

const PRINT_CONTAINER_ID = 'print-container';
const PRINT_BREAK_ATTR = 'data-print-break-before';
const PRINT_BREAK_CLASS = 'print-page-break';
const INK_LAYER_SELECTOR = '.ink-layer'; // Selector for the main content area

/**
 * Clones the main content, processes it for printing (splits tables, adds breaks),
 * and prepares it for the browser's print rendering.
 */
function prepareContentForPrinting() {
    // 1. Get the original content area
    const inkLayer = document.querySelector(INK_LAYER_SELECTOR);
    if (!inkLayer) {
        console.error('Ink layer not found for printing.');
        return;
    }

    // 2. Create or clear the print container
    let printContainer = document.getElementById(PRINT_CONTAINER_ID);
    if (printContainer) {
        printContainer.innerHTML = ''; // Clear previous content if any
    } else {
        printContainer = document.createElement('div');
        printContainer.id = PRINT_CONTAINER_ID;
        printContainer.style.display = 'none'; // Keep hidden until print media query activates
        document.body.appendChild(printContainer);
    }

    // 3. Clone the content into the print container
    const clonedInkLayer = inkLayer.cloneNode(true);
    printContainer.appendChild(clonedInkLayer);

    // 4. Process the *cloned* content
    const elementsToBreak = clonedInkLayer.querySelectorAll(`[${PRINT_BREAK_ATTR}="true"]`);

    elementsToBreak.forEach(element => {
        if (element.tagName === 'TR') {
            // Handle table row breaks by splitting the table
            splitTableAtRow(element);
        } else {
            // Handle non-table element breaks
            insertPrintBreakMarker(element);
        }
        // Optional: Remove the attribute from the cloned element if desired
        // element.removeAttribute(PRINT_BREAK_ATTR);
    });

    // 5. Add print-specific class to body (optional, can be useful for CSS)
    document.body.classList.add('is-printing');
}

/**
 * Splits a table within the cloned print container before a specified row.
 * @param {HTMLTableRowElement} rowElement - The row element (within the clone) marked for a break.
 */
function splitTableAtRow(rowElement) {
    const table = rowElement.closest('table');
    const tbody = rowElement.closest('tbody');
    if (!table || !tbody) return;

    const rowIndex = Array.from(tbody.children).indexOf(rowElement);
    if (rowIndex === -1) return;

    // Don't split if it's the very first row
    if (rowIndex === 0) {
        insertPrintBreakMarker(table); // Break before the whole table instead
        return;
    }

    // 1. Clone the table structure for the second part
    const secondTable = table.cloneNode(false); // Clone table element without children
    const secondTbody = tbody.cloneNode(false); // Clone tbody element without children
    secondTable.appendChild(secondTbody);

    // Clone the thead if it exists and append to second table
    const thead = table.querySelector('thead');
    if (thead) {
        secondTable.insertBefore(thead.cloneNode(true), secondTbody);
    }
    
    // Clone the tfoot if it exists and append to second table
    const tfoot = table.querySelector('tfoot');
     if (tfoot) {
         secondTable.appendChild(tfoot.cloneNode(true));
     }


    // 2. Move rows from the split point onwards to the second table's tbody
    const rows = Array.from(tbody.children); // Get rows from the *original* tbody within the clone
    for (let i = rowIndex; i < rows.length; i++) {
        secondTbody.appendChild(rows[i]); // Move the actual row element
    }

    // 3. Insert a break marker and the second table after the first one
    const breakMarker = document.createElement('div');
    breakMarker.className = PRINT_BREAK_CLASS + ' table-split'; // Add specific class for table splits

    table.parentNode.insertBefore(breakMarker, table.nextSibling);
    table.parentNode.insertBefore(secondTable, breakMarker.nextSibling);
}

/**
 * Inserts a print-specific page break marker before a non-table element.
 * @param {HTMLElement} element - The element (within the clone) before which to insert the break.
 */
function insertPrintBreakMarker(element) {
    const breakMarker = document.createElement('div');
    breakMarker.className = PRINT_BREAK_CLASS;
    element.parentNode.insertBefore(breakMarker, element);
}


/**
 * Cleans up after printing by removing the print container.
 */
function cleanupAfterPrinting() {
    const printContainer = document.getElementById(PRINT_CONTAINER_ID);
    if (printContainer) {
        printContainer.remove();
    }
    // Remove print-specific class from body
    document.body.classList.remove('is-printing');
}

/**
 * Initialize print event handlers.
 */
export function initPrintHandlers() {
    // Ensure handlers are not added multiple times
    window.removeEventListener('beforeprint', prepareContentForPrinting);
    window.removeEventListener('afterprint', cleanupAfterPrinting);

    window.addEventListener('beforeprint', prepareContentForPrinting);
    window.addEventListener('afterprint', cleanupAfterPrinting);

    // Optional: Handle matchMedia changes if needed, though before/afterprint is generally sufficient
    // const mediaQueryList = window.matchMedia('print');
    // mediaQueryList.addListener((mql) => {
    //     if (mql.matches) {
    //         // prepareContentForPrinting(); // Usually handled by beforeprint
    //     } else {
    //         // cleanupAfterPrinting(); // Usually handled by afterprint
    //     }
    // });
}
