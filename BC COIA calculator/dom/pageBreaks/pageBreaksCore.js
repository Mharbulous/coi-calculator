/**
 * Core pagination framework.
 */

import elements from '../elements.js';
import {
    clearScreenOnlyElements,
    getElementTopPadding,
    getElementOuterHeight,
    getElementAbsoluteTop,
    insertPageBreakBeforeElement // Assuming this new utility function will be created
} from './utils.js';
// Remove imports for specific processors as logic will be integrated or handled differently
// import { processTableRow } from './tableRowProcessor.js';
// import { processSectionTitle } from './sectionTitleProcessor.js';

/**
 * Implements WYSIWYG pagination using a generalized ".breakable" class approach.
 */
export function updatePagination() {
    clearScreenOnlyElements(); // Clear previous breaks and spacers

    // Get DOM elements
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

    // --- Initial Measurements ---
    
    // Get ink-layer height and margin
    let inkLayerHeight = getElementOuterHeight(inkLayer);
    const inkLayerMargin = getElementTopPadding(inkLayer);

    // --- Paper Layer Calculation ---
    
    // Render first page card for measurement
    paperLayer.innerHTML = '<div class="page-card"><div class="page-number">1</div></div>';
    const firstPageCard = paperLayer.querySelector('.page-card');
    if (!firstPageCard) {
        console.error("Failed to render or find first page card for measurement.");
        return;
    }
    
    // Get page-card height
    const pageCardHeight = getElementOuterHeight(firstPageCard);
    if (pageCardHeight <= 0) {
        console.error("Page card height is invalid.");
        return;
    }
    
    // Calculate workspace height per page
    const workspaceHeightPerPage = pageCardHeight - (2 * inkLayerMargin);
    if (workspaceHeightPerPage <= 0) {
        console.error("Workspace height per page is invalid.");
        return;
    }
    
    // Calculate initial page count
    const initialPageCount = Math.ceil(inkLayerHeight / workspaceHeightPerPage);

    // Render all paper pages
    paperLayer.innerHTML = '';
    for (let i = 0; i < initialPageCount; i++) {
        const pageCard = document.createElement('div');
        pageCard.className = 'page-card';
        pageCard.innerHTML = `<div class="page-number">Page ${i + 1}</div>`;
        paperLayer.appendChild(pageCard);
    }

    // Calculate page gap
    const paperLayerHeight = getElementOuterHeight(paperLayer);
    const pageGap = initialPageCount > 1
        ? (paperLayerHeight - (initialPageCount * pageCardHeight)) / (initialPageCount - 1)
        : 0;

    // --- Calculate Workspace Boundaries ---
    
    const workspaceTop = [];
    const workspaceBottom = [];
    const pageCards = paperLayer.querySelectorAll('.page-card');

    // Calculate workspace boundaries for each page
    pageCards.forEach((card, index) => {
        const pageCardTop = getElementAbsoluteTop(card);
        workspaceTop[index] = pageCardTop + inkLayerMargin;
        workspaceBottom[index] = pageCardTop + inkLayerMargin + workspaceHeightPerPage;
        
        // Add visual indicators for page boundaries (for debugging)
        const topIndicator = document.createElement('div');
        topIndicator.classList.add('screen-only');
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
        topLabel.classList.add('screen-only');
        topIndicator.appendChild(topLabel);
        
        document.body.appendChild(topIndicator);
        
        const bottomIndicator = document.createElement('div');
        bottomIndicator.classList.add('screen-only');
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
        bottomLabel.classList.add('screen-only');
        bottomIndicator.appendChild(bottomLabel);
        
        document.body.appendChild(bottomIndicator);
    });

    // --- Process Elements using .breakable class ---

    const breakableElements = Array.from(inkLayer.querySelectorAll('.breakable'));

    for (let i = 0; i < breakableElements.length; i++) {
        const currentElement = breakableElements[i];
        const nextElement = breakableElements[i + 1] || null; // Get the next breakable element

        const currentElementTop = getElementAbsoluteTop(currentElement);

        // Calculate block height (from current top to next top, or just current height if it's the last)
        let blockHeight;
        if (nextElement) {
            const nextElementTop = getElementAbsoluteTop(nextElement);
            blockHeight = nextElementTop - currentElementTop;
        } else {
            // If it's the last breakable element, measure its own height as the block
            // This might need refinement depending on how trailing content is handled
            blockHeight = getElementOuterHeight(currentElement);
        }

        // Check for oversized blocks
        if (blockHeight > workspaceHeightPerPage) {
            console.error("Oversized breakable block detected. Content may overflow.", currentElement);
            // Decide how to handle this - skip break check? For now, continue processing.
        }

        // Determine current page index based on element's position
        let currentPageIndex = 0;
        for (let pageIdx = 0; pageIdx < workspaceTop.length; pageIdx++) {
            // Find the page where the element starts
            if (currentElementTop >= workspaceTop[pageIdx]) {
                currentPageIndex = pageIdx;
            } else {
                break; // Element starts before this page, so it belongs to the previous one
            }
        }

        const currentPageBottom = workspaceBottom[currentPageIndex];
        const elementBottom = currentElementTop + blockHeight;

        // Check if the element block overflows the current page
        if (elementBottom > currentPageBottom) {
            // Ensure there's a next page boundary to calculate against
            if (currentPageIndex + 1 < workspaceTop.length) {
                const nextPageTop = workspaceTop[currentPageIndex + 1];
                const requiredSpacerHeight = nextPageTop - currentElementTop;

                if (requiredSpacerHeight > 0) {
                    insertPageBreakBeforeElement(currentElement, requiredSpacerHeight);
                    // Recalculate inkLayerHeight potentially? Or handle in final adjustments.
                    // For now, rely on final adjustment phase.
                } else {
                     console.warn("Calculated negative or zero spacer height. Skipping break.", currentElement);
                }
            } else {
                // This case means the element overflows the *last calculated page*.
                // The final adjustment phase should handle adding a new page if needed.
                console.warn("Element overflows last calculated page. Final adjustments should handle this.", currentElement);
            }
        }
    }

    // --- Final Page Adjustments ---
    // This logic remains largely the same, checking the final content position
    // (e.g., the postjudgment footer) against the initially calculated page boundaries
    // and adding/removing pages as needed.

    const postjudgmentFooterRow = postjudgmentTable.querySelector('tfoot tr.total'); // Assuming footer isn't 'breakable'
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
            // Check if the last page is unnecessary
            else if (currentRenderedPageCount > 1 && footerBottom < lastPageWorkspaceTop) {
                const lastPageCardElement = paperLayer.lastElementChild;
                if (lastPageCardElement && lastPageCardElement.classList.contains('page-card')) {
                    lastPageCardElement.remove();
                }
            }
        } else {
            console.warn("No pages rendered initially during final check.");
        }
    } else {
        console.warn("Postjudgment footer row not found for final page check.");
    }
}

/**
 * Sets up pagination event listeners.
 * Centralizes all pagination update triggers to a single event listener.
 */
export function setupPaginationListeners() {
    // Listen for a custom "content-changed" event that will trigger pagination updates
    document.addEventListener('content-changed', () => {
        // Optional: Add debouncing here if needed for performance
        updatePagination();
    });
    
    console.log("Pagination listeners initialized");
}
