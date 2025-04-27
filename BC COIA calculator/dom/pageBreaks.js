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
    
    // Add a visible marker for debugging
    cell.style.position = 'relative';
    const marker = document.createElement('div');
    marker.textContent = `Row Break (${height}px)`;
    marker.style.position = 'absolute';
    marker.style.top = '0';
    marker.style.left = '0';
    marker.style.backgroundColor = 'rgba(0, 0, 255, 0.2)';
    marker.style.color = 'blue';
    marker.style.padding = '2px';
    marker.style.fontSize = '10px';
    marker.style.fontWeight = 'bold';
    marker.style.zIndex = '1000';
    marker.style.pointerEvents = 'none';
    marker.classList.add(SCREEN_ONLY_CLASS);
    cell.appendChild(marker);
    
    blankRow.appendChild(cell);
    referenceRow.parentNode.insertBefore(blankRow, referenceRow);
    return blankRow;
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
    
    // What does this do?
    const firstCell = clonedHeader.querySelector('th');    
    
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
    
    // Add a visible marker for debugging
    blankSpace.style.position = 'relative';
    const marker = document.createElement('div');
    marker.textContent = `Page Break (${height}px)`;
    marker.style.position = 'absolute';
    marker.style.top = '0';
    marker.style.left = '0';
    marker.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
    marker.style.color = 'red';
    marker.style.padding = '2px';
    marker.style.fontSize = '10px';
    marker.style.fontWeight = 'bold';
    marker.style.zIndex = '1000';
    marker.style.pointerEvents = 'none';
    marker.classList.add(SCREEN_ONLY_CLASS);
    blankSpace.appendChild(marker);
    
    referenceElement.parentNode.insertBefore(blankSpace, referenceElement);
    return blankSpace;
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
        
        // Add visual indicators for page boundaries (for debugging)
        const topIndicator = document.createElement('div');
        topIndicator.classList.add(SCREEN_ONLY_CLASS);
        topIndicator.style.position = 'absolute';
        topIndicator.style.left = '0';
        topIndicator.style.right = '0';
        topIndicator.style.top = `${workspaceTop[index]}px`;
        topIndicator.style.height = '2px';
        topIndicator.style.backgroundColor = 'rgba(0, 255, 0, 0.5)';
        topIndicator.style.zIndex = '1000';
        topIndicator.style.pointerEvents = 'none';
        
        const topLabel = document.createElement('div');
        topLabel.textContent = `Page ${index + 1} Top`;
        topLabel.style.position = 'absolute';
        topLabel.style.left = '5px';
        topLabel.style.top = '0';
        topLabel.style.fontSize = '10px';
        topLabel.style.fontWeight = 'bold';
        topLabel.style.color = 'green';
        topLabel.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
        topLabel.style.padding = '2px';
        topLabel.style.borderRadius = '2px';
        topLabel.style.pointerEvents = 'none';
        topLabel.classList.add(SCREEN_ONLY_CLASS);
        topIndicator.appendChild(topLabel);
        
        document.body.appendChild(topIndicator);
        
        const bottomIndicator = document.createElement('div');
        bottomIndicator.classList.add(SCREEN_ONLY_CLASS);
        bottomIndicator.style.position = 'absolute';
        bottomIndicator.style.left = '0';
        bottomIndicator.style.right = '0';
        bottomIndicator.style.top = `${workspaceBottom[index]}px`;
        bottomIndicator.style.height = '2px';
        bottomIndicator.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
        bottomIndicator.style.zIndex = '1000';
        bottomIndicator.style.pointerEvents = 'none';
        
        const bottomLabel = document.createElement('div');
        bottomLabel.textContent = `Page ${index + 1} Bottom`;
        bottomLabel.style.position = 'absolute';
        bottomLabel.style.left = '5px';
        bottomLabel.style.top = '0';
        bottomLabel.style.fontSize = '10px';
        bottomLabel.style.fontWeight = 'bold';
        bottomLabel.style.color = 'red';
        bottomLabel.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
        bottomLabel.style.padding = '2px';
        bottomLabel.style.borderRadius = '2px';
        bottomLabel.style.pointerEvents = 'none';
        bottomLabel.classList.add(SCREEN_ONLY_CLASS);
        bottomIndicator.appendChild(bottomLabel);
        
        document.body.appendChild(bottomIndicator);
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
    
    // Debug the postjudgment table and its container
    const postjudgmentTableContainer = postjudgmentTable.closest('[data-display="postjudgmentSection"]');
    const postjudgmentHeader = postjudgmentTable.querySelector('thead');
    
    if (postjudgmentTableContainer) {
        const containerTop = getElementAbsoluteTop(postjudgmentTableContainer);
        const containerHeight = getElementOuterHeight(postjudgmentTableContainer);
        const containerBottom = containerTop + containerHeight;
    }
    
    if (postjudgmentHeader) {
        const headerTop = getElementAbsoluteTop(postjudgmentHeader);
        const headerHeight = getElementOuterHeight(postjudgmentHeader);
        const headerBottom = headerTop + headerHeight;
    }

    if (postjudgmentTitle) {
        const titleTop = getElementAbsoluteTop(postjudgmentTitle);
        const titleHeight = getElementOuterHeight(postjudgmentTitle);
        const titleBottom = titleTop + titleHeight;
        
        // Get the parent container of the title
        const titleParent = postjudgmentTitle.parentElement;
        const titleParentTop = getElementAbsoluteTop(titleParent);
        const titleParentHeight = getElementOuterHeight(titleParent);
        const titleParentBottom = titleParentTop + titleParentHeight;
        
        // Check computed styles for margins and padding
        const titleStyles = window.getComputedStyle(postjudgmentTitle);
        
        // Check if there's a next sibling element after the title
        const nextSibling = postjudgmentTitle.nextElementSibling;
        if (nextSibling) {
            const nextSiblingTop = getElementAbsoluteTop(nextSibling);
            const nextSiblingHeight = getElementOuterHeight(nextSibling);
            const nextSiblingBottom = nextSiblingTop + nextSiblingHeight;
            
            // Check computed styles for the next sibling
            const nextSiblingStyles = window.getComputedStyle(nextSibling);
        }

        // Log all workspace boundaries for comparison
        for (let i = 0; i < workspaceBottom.length; i++) {
        }

             
        let breakInserted = false;
        
        // Check if the title is within a specific distance from the bottom of any page
        // or if the title plus table header would overflow the page
        for (let p = 0; p < workspaceBottom.length; p++) {
            const distanceToBottom = workspaceBottom[p] - titleTop;
            if (distanceToBottom > 0 && distanceToBottom < titleHeight * 2) {
                
                // Ensure there's a next page to calculate the gap against
                if (p + 1 < workspaceTop.length) {
                    const blankSpaceHeight = workspaceTop[p + 1] - titleTop;
                    
                    // Insert the blank space
                    const blankSpace = insertBlankSpace(postjudgmentTitle, blankSpaceHeight);
                    
                    // Add a special class to the blank space for debugging
                    if (blankSpace) {
                        blankSpace.classList.add('title-page-break');
                        blankSpace.style.border = '2px dashed purple';
                        blankSpace.style.backgroundColor = 'rgba(255, 0, 255, 0.1)';
                    }
                    
                    inkLayerHeight += blankSpaceHeight;
                    
                    // Update current page index
                    if (p >= currentPageIndex) {
                        currentPageIndex = p + 1;
                    }
                    
                    breakInserted = true;
                    break;
                }
            }
            
            // Check if the title plus table header would overflow
            if (!breakInserted && postjudgmentHeader && distanceToBottom > 0) {
                const headerHeight = getElementOuterHeight(postjudgmentHeader);
                if (titleTop + titleHeight + headerHeight > workspaceBottom[p]) {
                    
                    // Ensure there's a next page to calculate the gap against
                    if (p + 1 < workspaceTop.length) {
                        const blankSpaceHeight = workspaceTop[p + 1] - titleTop;
                        
                        // Insert the blank space
                        const blankSpace = insertBlankSpace(postjudgmentTitle, blankSpaceHeight);
                        
                        // Add a special class to the blank space for debugging
                        if (blankSpace) {
                            blankSpace.classList.add('title-page-break');
                            blankSpace.style.border = '2px dashed purple';
                            blankSpace.style.backgroundColor = 'rgba(255, 0, 255, 0.1)';
                        }
                        
                        inkLayerHeight += blankSpaceHeight;
                        
                        // Update current page index
                        if (p >= currentPageIndex) {
                            currentPageIndex = p + 1;
                        }
                        
                        breakInserted = true;
                        break;
                    }
                }
            }
        }
        
        // If no break was inserted by the improved logic, try the original logic
        if (!breakInserted) {
        for (let p = 0; p < workspaceBottom.length; p++) {
            // Check if the title starts near the bottom of page p, using the new threshold
            if (workspaceBottom[p] > titleTop && workspaceBottom[p] < titleTop + (3 * titleHeight + inkLayerMargin)) {
                
                // Ensure there's a next page to calculate the gap against
                if (p + 1 < workspaceTop.length) {
                    const blankSpaceHeight = workspaceTop[p + 1] - titleTop;
                    
                    // Insert the blank space
                    const blankSpace = insertBlankSpace(postjudgmentTitle, blankSpaceHeight);
                    
                    // Add a special class to the blank space for debugging
                    if (blankSpace) {
                        blankSpace.classList.add('title-page-break');
                        blankSpace.style.border = '2px dashed purple';
                        blankSpace.style.backgroundColor = 'rgba(255, 0, 255, 0.1)';
                    }
                    
                    inkLayerHeight += blankSpaceHeight;
                    // Update current page index if the break happens before the current page
                    if (p >= currentPageIndex) {
                       currentPageIndex = p + 1;
                    }
                    
                    // Log the title position after inserting the blank space
                    setTimeout(() => {
                        const newTitleTop = getElementAbsoluteTop(postjudgmentTitle);
                        const newTitleBottom = newTitleTop + getElementOuterHeight(postjudgmentTitle);
                        
                        // Check which page the title is on now
                        for (let i = 0; i < workspaceBottom.length; i++) {
                            if (newTitleTop >= workspaceTop[i] && newTitleTop < workspaceBottom[i]) {
                                break;
                            }
                        }
                    }, 0);
                    breakInserted = true;
                    break; // Found a break, no need to check other pages
                } else {
                    console.warn("Title break needed, but no next page exists.");
                }
            }
        }
        
        if (!breakInserted) {
            
            // Check if title is at the top of a page
            for (let i = 0; i < workspaceTop.length; i++) {
                const distanceFromPageTop = titleTop - workspaceTop[i];
                if (distanceFromPageTop >= 0 && distanceFromPageTop < titleHeight * 2) {
                }
            }
            
            // Check if title is in the middle of a page
            for (let i = 0; i < workspaceTop.length; i++) {
                if (titleTop > workspaceTop[i] && titleBottom < workspaceBottom[i]) {
                    const pageMiddle = workspaceTop[i] + (workspaceBottom[i] - workspaceTop[i]) / 2;
                }
            }
        }
    }
}


    // 17. Cycle through postjudgment rows
    const postjudgmentRows = postjudgmentTableBody.querySelectorAll('tr');
    
    // Debug the first row of the postjudgment table
    if (postjudgmentRows.length > 0) {
        const firstRow = postjudgmentRows[0];
        const firstRowTop = getElementAbsoluteTop(firstRow);
        const firstRowHeight = getElementOuterHeight(firstRow);
        const firstRowBottom = firstRowTop + firstRowHeight;
        
        // Check if there's a gap between the title and the first row
        if (postjudgmentTitle) {
            const titleBottom = getElementAbsoluteTop(postjudgmentTitle) + getElementOuterHeight(postjudgmentTitle);
            const gapBetweenTitleAndFirstRow = firstRowTop - titleBottom;
            
            
            // Check if this gap crosses a page boundary
            for (let i = 0; i < workspaceBottom.length; i++) {
                if (titleBottom < workspaceBottom[i] && firstRowTop > workspaceTop[i + 1]) {
                }
            }
        }
        
        // Check if the first row is at the top of a page
        for (let i = 0; i < workspaceTop.length; i++) {
            const distanceFromPageTop = firstRowTop - workspaceTop[i];
            if (distanceFromPageTop >= 0 && distanceFromPageTop < firstRowHeight) {
            }
        }
    }
    
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

    // 18. Final check: Adjust page count based on final content position
    const postjudgmentFooterRow = postjudgmentTable.querySelector('tfoot tr.total');
    if (postjudgmentFooterRow) {
        const footerTop = getElementAbsoluteTop(postjudgmentFooterRow);
        const footerHeight = getElementOuterHeight(postjudgmentFooterRow);
        const footerBottom = footerTop + footerHeight;

        let currentRenderedPageCount = paperLayer.querySelectorAll('.page-card').length;
        if (currentRenderedPageCount > 0) {
            const lastPageIndex = currentRenderedPageCount - 1;
            const lastPageWorkspaceTop = workspaceTop[lastPageIndex];
            const lastPageWorkspaceBottom = workspaceBottom[lastPageIndex];

            // Check if content overflows the last page's workspace
            if (footerBottom > lastPageWorkspaceBottom) {
                const pageCard = document.createElement('div');
                pageCard.className = 'page-card';
                pageCard.innerHTML = `<div class="page-number">Page ${currentRenderedPageCount + 1}</div>`;
                paperLayer.appendChild(pageCard);
            }
            // Check if the last page is unnecessary (content ends before its workspace starts)
            // Only remove if there's more than one page
            else if (currentRenderedPageCount > 1 && footerBottom < lastPageWorkspaceTop) {
                 const lastPageCardElement = paperLayer.lastElementChild;
                 if (lastPageCardElement && lastPageCardElement.classList.contains('page-card')) {
                     lastPageCardElement.remove();
                 }
            }
        } else {
             // Handle edge case where there are no pages rendered initially (shouldn't happen if inkLayerHeight > 0)
             console.warn("No pages rendered initially during final check.");
        }

    } else {
        console.warn("Postjudgment footer row not found for final page check.");
    }
}

// Placeholder for setup function if needed later
export function setupPaginationListeners() {
    // Example: Trigger updatePagination on relevant state changes or events
    // This needs to be integrated into the main application flow (e.g., in calculator.ui.js)
    // window.addEventListener('some-update-event', updatePagination);
}
