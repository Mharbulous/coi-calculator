import elements from './elements.js';

const SCREEN_ONLY_CLASS = 'screen-only'; // Class for elements visible only on screen

// --- Helper Functions ---

/**
 * Gets the computed top padding of an element in pixels.
 * @param {HTMLElement} element - The element to measure.
 * @returns {number} Top padding in pixels.
 */
function getElementTopPadding(element) {
    if (!element) return 0;
    const styles = window.getComputedStyle(element);
    return parseFloat(styles.paddingTop) || 0;
}

/**
 * Gets the height of an element, including padding and border.
 * @param {HTMLElement} element - The element to measure.
 * @returns {number} Height in pixels.
 */
function getElementOuterHeight(element) {
    if (!element) return 0;
    return element.offsetHeight; // Includes padding and border
}

/**
 * Gets the absolute vertical position (top offset) of an element relative to the document.
 * @param {HTMLElement} element - The element to measure.
 * @returns {number} Top offset in pixels.
 */
function getElementAbsoluteTop(element) {
    if (!element) return 0;
    const rect = element.getBoundingClientRect();
    return rect.top + window.scrollY;
}

/**
 * Creates and inserts a blank row for spacing.
 * @param {HTMLElement} referenceRow - The row to insert the blank row before.
 * @param {number} height - The height of the blank row.
 */
function insertBlankRow(referenceRow, height) {
    if (!referenceRow || height <= 0) return;
    const blankRow = document.createElement('tr');
    blankRow.classList.add(SCREEN_ONLY_CLASS);
    const cell = document.createElement('td');
    cell.setAttribute('colspan', '5'); // Span all columns
    cell.style.height = `${height}px`;
    cell.style.padding = '0';
    cell.style.border = 'none';
    blankRow.appendChild(cell);
    referenceRow.parentNode.insertBefore(blankRow, referenceRow);
}

/**
 * Creates and inserts a cloned table header row.
 * @param {HTMLElement} referenceRow - The row to insert the header row before.
 * @param {HTMLElement} originalHeaderRow - The original header row to clone.
 * @returns {number} The height of the inserted header row.
 */
function insertHeaderRow(referenceRow, originalHeaderRow) {
    if (!referenceRow || !originalHeaderRow) return 0;
    const clonedHeader = originalHeaderRow.cloneNode(true);
    clonedHeader.classList.add(SCREEN_ONLY_CLASS);
    referenceRow.parentNode.insertBefore(clonedHeader, referenceRow);
    return getElementOuterHeight(clonedHeader);
}

/**
 * Creates and inserts blank space (div) before an element.
 * @param {HTMLElement} referenceElement - The element to insert space before.
 * @param {number} height - The height of the blank space.
 */
function insertBlankSpace(referenceElement, height) {
    if (!referenceElement || height <= 0) return;
    const blankSpace = document.createElement('div');
    blankSpace.classList.add(SCREEN_ONLY_CLASS);
    blankSpace.style.height = `${height}px`;
    referenceElement.parentNode.insertBefore(blankSpace, referenceElement);
}

/**
 * Removes all elements with the screen-only class.
 */
function clearScreenOnlyElements() {
    document.querySelectorAll(`.${SCREEN_ONLY_CLASS}`).forEach(el => el.remove());
}

// --- Main Pagination Logic ---

/**
 * Implements WYSIWYG pagination by synchronizing ink and paper layers.
 */
export function updatePagination() {
    console.log("Starting pagination update...");
    clearScreenOnlyElements(); // Clear previous breaks

    const inkLayer = document.querySelector('.ink-layer');
    const paperLayer = document.querySelector('.paper-layer');
    const prejudgmentTableBody = elements.prejudgmentTableBody;
    const postjudgmentTableBody = elements.postjudgmentTableBody;
    const prejudgmentTable = document.getElementById('prejudgmentTable');
    const postjudgmentTable = document.getElementById('postjudgmentTable');

    if (!inkLayer || !paperLayer || !prejudgmentTableBody || !postjudgmentTableBody || !prejudgmentTable || !postjudgmentTable) {
        console.error("Pagination elements not found. Aborting.");
        return;
    }

    // 1. Render ink-layer (already done by browser)
    // 2. Get ink-layer height
    let inkLayerHeight = getElementOuterHeight(inkLayer); // Use outerHeight for consistency
    // 3. Get ink-layer margin (top padding)
    const inkLayerMargin = getElementTopPadding(inkLayer);

    // --- Paper Layer Calculation ---
    // 4. Render first page card (temporarily, just for measurement)
    paperLayer.innerHTML = '<div class="page-card"><div class="page-number">1</div></div>'; // Minimal render
    const firstPageCard = paperLayer.querySelector('.page-card');
    if (!firstPageCard) {
        console.error("Failed to render or find first page card for measurement.");
        return;
    }
    // 5. Get page-card height
    const pageCardHeight = getElementOuterHeight(firstPageCard);
    if (pageCardHeight <= 0) {
        console.error("Page card height is invalid.");
        return;
    }
    // 6. Calculate workspace height per page
    const workspaceHeightPerPage = pageCardHeight - (2 * inkLayerMargin);
    if (workspaceHeightPerPage <= 0) {
        console.error("Workspace height per page is invalid.");
        return;
    }
    // 7. Calculate initial page count
    const initialPageCount = Math.ceil(inkLayerHeight / workspaceHeightPerPage);

    // 8. Render all paper pages
    paperLayer.innerHTML = ''; // Clear temporary card
    for (let i = 0; i < initialPageCount; i++) {
        const pageCard = document.createElement('div');
        pageCard.className = 'page-card';
        pageCard.innerHTML = `<div class="page-number">Page ${i + 1}</div>`;
        paperLayer.appendChild(pageCard);
    }

    // 9. Get paper-layer height (after rendering all cards)
    const paperLayerHeight = getElementOuterHeight(paperLayer);
    // 10. Calculate page gap
    const pageGap = initialPageCount > 1
        ? (paperLayerHeight - (initialPageCount * pageCardHeight)) / (initialPageCount - 1)
        : 0;

    // 12. Create arrays for workspace boundaries
    const workspaceTop = [];
    const workspaceBottom = [];
    const pageCards = paperLayer.querySelectorAll('.page-card');

    // 13. Calculate workspace boundaries for each page
    pageCards.forEach((card, index) => {
        const pageCardTop = getElementAbsoluteTop(card);
        workspaceTop[index] = pageCardTop + inkLayerMargin;
        // Use calculated workspace height, not card bottom, to define the usable area
        workspaceBottom[index] = pageCardTop + inkLayerMargin + workspaceHeightPerPage;
    });

    // 14. Get table footer height (use prejudgment footer, assume postjudgment is same)
    const prejudgmentFooterRow = prejudgmentTable.querySelector('tfoot tr.total');
    const tableFootHeight = getElementOuterHeight(prejudgmentFooterRow);

    // --- Insert Breaks and Headers ---
    let currentPageIndex = 0;
    const originalPrejudgmentHeader = prejudgmentTable.querySelector('thead tr');
    const originalPostjudgmentHeader = postjudgmentTable.querySelector('thead tr');

    // 15. Cycle through prejudgment rows
    const prejudgmentRows = prejudgmentTableBody.querySelectorAll('tr');
    for (const row of prejudgmentRows) {
        const rowTop = getElementAbsoluteTop(row);
        const rowHeight = getElementOuterHeight(row);
        const rowBottom = rowTop + rowHeight;

        // Ensure we don't check against a non-existent page
        if (currentPageIndex >= workspaceBottom.length) {
             console.warn(`Attempting to check against page index ${currentPageIndex}, but only ${workspaceBottom.length} pages exist.`);
             break;
        }

        // Check if row bottom (plus footer) exceeds current page's workspace bottom
        if (rowBottom + tableFootHeight > workspaceBottom[currentPageIndex]) {
            // Ensure there's a next page to calculate the gap against
            if (currentPageIndex + 1 < workspaceTop.length) {
                // Insert break
                const blankRowHeight = workspaceTop[currentPageIndex + 1] - rowTop;
                insertBlankRow(row, blankRowHeight);
                const headerHeight = insertHeaderRow(row, originalPrejudgmentHeader);

                // Update total ink layer height
                inkLayerHeight += blankRowHeight + headerHeight;
                currentPageIndex++; // Move to the next page
            } else {
                 console.warn("Row overflow detected, but no next page exists to calculate break space.");
                 // Potentially handle this case - maybe force a final page add later?
            }
        }
    }

    // 16. Check postjudgment title position
    const postjudgmentTitle = Array.from(document.querySelectorAll('.section-title'))
                                   .find(el => el.textContent.includes('Postjudgment Interest Calculations'));

    if (postjudgmentTitle) {
        const titleTop = getElementAbsoluteTop(postjudgmentTitle);
        const titleHeight = getElementOuterHeight(postjudgmentTitle);

        for (let p = 0; p < workspaceBottom.length; p++) {
            // Check if the title starts near the bottom of page p, using the new threshold
            if (workspaceBottom[p] > titleTop && workspaceBottom[p] < titleTop + (3 * titleHeight + inkLayerMargin)) {
                 // Ensure there's a next page to calculate the gap against
                 if (p + 1 < workspaceTop.length) {
                    const blankSpaceHeight = workspaceTop[p + 1] - titleTop;
                    insertBlankSpace(postjudgmentTitle, blankSpaceHeight);
                    inkLayerHeight += blankSpaceHeight;
                    // Update current page index if the break happens before the current page
                    if (p >= currentPageIndex) {
                       currentPageIndex = p + 1;
                    }
                    break; // Found a break, no need to check other pages
                 } else {
                     console.warn("Title break needed, but no next page exists.");
                 }
            }
        }
    }


    // 17. Cycle through postjudgment rows
    const postjudgmentRows = postjudgmentTableBody.querySelectorAll('tr');
     for (const row of postjudgmentRows) {
        const rowTop = getElementAbsoluteTop(row);
        const rowHeight = getElementOuterHeight(row);
        const rowBottom = rowTop + rowHeight;

        // Ensure we don't check against a non-existent page
        if (currentPageIndex >= workspaceBottom.length) {
             console.warn(`Attempting to check against page index ${currentPageIndex}, but only ${workspaceBottom.length} pages exist.`);
             break;
        }

        // Check if row bottom (plus footer) exceeds current page's workspace bottom
        if (rowBottom + tableFootHeight > workspaceBottom[currentPageIndex]) {
             // Ensure there's a next page to calculate the gap against
            if (currentPageIndex + 1 < workspaceTop.length) {
                // Insert break
                const blankRowHeight = workspaceTop[currentPageIndex + 1] - rowTop;
                insertBlankRow(row, blankRowHeight);
                const headerHeight = insertHeaderRow(row, originalPostjudgmentHeader);

                // Update total ink layer height
                inkLayerHeight += blankRowHeight + headerHeight;
                currentPageIndex++; // Move to the next page
            } else {
                 console.warn("Row overflow detected, but no next page exists to calculate break space.");
            }
        }
    }

    // 18. Final check: Recalculate page count and add page if needed
    const finalPageCountCheck = Math.ceil(inkLayerHeight / workspaceHeightPerPage);
    const currentRenderedPageCount = paperLayer.querySelectorAll('.page-card').length;

    if (finalPageCountCheck > currentRenderedPageCount) {
        console.log(`Adding ${finalPageCountCheck - currentRenderedPageCount} extra page(s)...`);
        for (let i = currentRenderedPageCount; i < finalPageCountCheck; i++) {
            const pageCard = document.createElement('div');
            pageCard.className = 'page-card';
            pageCard.innerHTML = `<div class="page-number">Page ${i + 1}</div>`;
            paperLayer.appendChild(pageCard);
        }
    }

    console.log("Pagination update finished.");
}

// Placeholder for setup function if needed later
export function setupPaginationListeners() {
    // Example: Trigger updatePagination on relevant state changes or events
    // This needs to be integrated into the main application flow (e.g., in calculator.ui.js)
    // window.addEventListener('some-update-event', updatePagination);
    console.log("Pagination listeners setup (placeholder).");
}
