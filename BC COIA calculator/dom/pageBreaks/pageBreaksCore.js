/**
 * Core pagination framework using ResizeObserver for content change detection.
 */

import elements from '../elements.js';
import {
    clearScreenOnlyElements,
    getElementTopPadding,
    getElementOuterHeight,
    getElementAbsoluteTop,
    insertPageBreakBeforeElement
} from './utils.js';

// State variables to manage pagination process
let isUpdatingPagination = false;
let previousInkLayerHeight = 0;
let cleanupObservers = null;
let resizeTimeout; // Timeout for throttling ResizeObserver callbacks

/**
 * Main pagination function that calculates and applies page breaks.
 * This is wrapped with protection against recursive calls.
 */
export function updatePagination() {
    // Prevent recursive calls
    if (isUpdatingPagination) {
        return;
    }
    
    // Set the flag at the entry point
    isUpdatingPagination = true;
    
    try {
        // Core pagination implementation
        clearScreenOnlyElements(); // Clear previous breaks and spacers

        // Get DOM elements
        const inkLayer = document.querySelector('.ink-layer');
        
        // *** ADDED: Attempt to force browser reflow before measurements ***
        // Reading offsetHeight can trigger layout calculation, potentially ensuring
        // measurements later in the function are based on the updated layout.
        if (inkLayer) inkLayer.offsetHeight; 
        // *** END ADDED ***

        // Get DOM elements (inkLayer already declared above)
        const paperLayer = document.querySelector('.paper-layer');
        const prejudgmentTableBody = elements.prejudgmentTableBody;
        const postjudgmentTableBody = elements.postjudgmentTableBody;
        const prejudgmentTable = document.getElementById('prejudgmentTable');
        const postjudgmentTable = document.getElementById('postjudgmentTable');

        if (!inkLayer || !paperLayer) {
             console.error("Ink or Paper layer not found. Aborting pagination.");
             return; // Exit early if essential layers are missing
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
            return; // Exit early
        }
        
        // Get page-card height
        const pageCardHeight = getElementOuterHeight(firstPageCard);
        if (pageCardHeight <= 0) {
            console.error("Page card height is invalid.");
            return; // Exit early
        }
        
        // Calculate workspace height per page
        const workspaceHeightPerPage = pageCardHeight - (2 * inkLayerMargin);
        if (workspaceHeightPerPage <= 0) {
            console.error("Workspace height per page is invalid.");
            return; // Exit early
        }
        
        // Calculate initial page count based on *current* ink layer height
        // Ensure at least one page is calculated even if inkLayerHeight is 0
        const currentInkLayerHeight = getElementOuterHeight(inkLayer);
        const initialPageCount = Math.max(1, Math.ceil(currentInkLayerHeight / workspaceHeightPerPage));


        // Render all paper pages
        paperLayer.innerHTML = '';
        for (let i = 0; i < initialPageCount; i++) {
            const pageCard = document.createElement('div');
            pageCard.className = 'page-card';
            pageCard.innerHTML = `<div class="page-number">Page ${i + 1}</div>`;
            paperLayer.appendChild(pageCard);
        }

        // Calculate page gap (only relevant if multiple pages exist)
        let pageGap = 0;
        if (initialPageCount > 1) {
             const paperLayerHeight = getElementOuterHeight(paperLayer);
             pageGap = (paperLayerHeight - (initialPageCount * pageCardHeight)) / (initialPageCount - 1);
        }


        // --- Calculate Workspace Boundaries ---
        
        const workspaceTop = [];
        const workspaceBottom = [];
        const pageCards = paperLayer.querySelectorAll('.page-card');

        // Calculate workspace boundaries for each page
        pageCards.forEach((card, index) => {
            const pageCardTop = getElementAbsoluteTop(card);
            workspaceTop[index] = pageCardTop + inkLayerMargin;
            workspaceBottom[index] = pageCardTop + inkLayerMargin + workspaceHeightPerPage;
        });

        // --- Process Elements using .breakable class ---

        // Filter for visible breakable elements upfront instead of checking inside the loop
        const breakableElements = Array.from(inkLayer.querySelectorAll('.breakable'))
            .filter(element => element.offsetParent !== null && getElementOuterHeight(element) > 0);

        for (let i = 0; i < breakableElements.length; i++) {
            const currentElement = breakableElements[i];
            // No need to check visibility here as all elements are already filtered

            // Since our array only contains visible elements now, we can simply take the next element
            const nextElement = breakableElements[i + 1]; // Next element is already guaranteed to be visible

            const currentElementTop = getElementAbsoluteTop(currentElement);

            // Calculate block height (from current top to next visible top, or just current height if it's the last visible)
            let blockHeight;
            if (nextElement) {
                const nextElementTop = getElementAbsoluteTop(nextElement);
                blockHeight = nextElementTop - currentElementTop;
            } else {
                // If it's the last visible breakable element, measure its own height as the block
                // If it's the last visible breakable element, measure the actual height
                // of all content from this element until the end of the visible content.
                
                // First, get the height of the element itself (minimum height)
                blockHeight = getElementOuterHeight(currentElement);
                
                // Then find the furthest visible descendant element after this one
                let maxBottom = currentElementTop + blockHeight;
                
                // Only check non-breakable elements that come after this one
                const allElements = Array.from(inkLayer.querySelectorAll('*:not(.screen-only):not(.page-break-spacer)'));
                
                // Start after the current element in the DOM
                let foundCurrent = false;
                for (const el of allElements) {
                    if (!foundCurrent) {
                        // Skip until we find the current element
                        if (el === currentElement) {
                            foundCurrent = true;
                        }
                        continue;
                    }
                    
                    // Skip elements inside the current element (already accounted for by its height)
                    if (currentElement.contains(el)) {
                        continue;
                    }
                    
                    // Skip hidden elements
                    if (el.offsetParent === null || getElementOuterHeight(el) === 0) {
                        continue;
                    }
                    
                    // Skip any subsequent breakable elements (we only want non-breakable elements)
                    if (el.classList.contains('breakable')) {
                        continue;
                    }
                    
                    // Calculate the bottom edge of this element
                    const elTop = getElementAbsoluteTop(el);
                    const elHeight = getElementOuterHeight(el);
                    const elBottom = elTop + elHeight;
                    
                    // Update maximum bottom if this element extends further
                    if (elBottom > maxBottom) {
                        maxBottom = elBottom;
                    }
                }
                
                // Final block height is from currentElement to the furthest visible element
                blockHeight = maxBottom - currentElementTop;
            }
             
            // Ensure blockHeight is positive
            blockHeight = Math.max(0, blockHeight);

            // Check for oversized blocks
            if (blockHeight > workspaceHeightPerPage) {
                console.error("Oversized breakable block detected. Content may overflow.");
            }

            // Determine current page index based on element's position
            let currentPageIndex = -1; // Initialize to -1
            for (let pageIdx = 0; pageIdx < workspaceTop.length; pageIdx++) {
                // Element starts on or after this page's top boundary
                if (currentElementTop >= workspaceTop[pageIdx]) {
                    // Check if it also starts before the *next* page's top boundary (if one exists)
                    // or if it's the last page
                    if (pageIdx + 1 >= workspaceTop.length || currentElementTop < workspaceTop[pageIdx + 1]) {
                        currentPageIndex = pageIdx;
                        break;
                    }
                }
            }

            // Check if workspace boundaries exist for the determined index
            if (currentPageIndex === -1 || currentPageIndex >= workspaceBottom.length) {
                continue; // Skip processing if page index is invalid
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
                    }
                }
            }
        }

        // --- Final Page Adjustments ---
        // Check the actual bottom of the content against the last page boundaries.

        // Find the bottom-most position of any visible content in the ink layer
        let contentBottom = 0;
        const visibleElements = inkLayer.querySelectorAll('*:not(.screen-only)'); // Select all non-screen-only descendants
        visibleElements.forEach(el => {
            // Check if element is actually visible (takes up space)
            if (el.offsetParent !== null && getElementOuterHeight(el) > 0) {
                const elTop = getElementAbsoluteTop(el);
                const elHeight = getElementOuterHeight(el);
                const elBottom = elTop + elHeight;
                if (elBottom > contentBottom) {
                    contentBottom = elBottom;
                }
            }
        });
        
        let currentRenderedPageCount = paperLayer.querySelectorAll('.page-card').length;

        if (currentRenderedPageCount > 0) {
            const lastPageIndex = currentRenderedPageCount - 1;
            
            // Ensure workspace boundaries exist for the last page index
            if (lastPageIndex < workspaceTop.length && lastPageIndex < workspaceBottom.length) {
                const lastPageWorkspaceTop = workspaceTop[lastPageIndex];
                const lastPageWorkspaceBottom = workspaceBottom[lastPageIndex];
                
                // Check if content overflows the last page's workspace
                if (contentBottom > lastPageWorkspaceBottom) {
                    // Content overflows, add a new page card
                    const pageCard = document.createElement('div');
                    pageCard.className = 'page-card';
                    pageCard.innerHTML = `<div class="page-number">Page ${currentRenderedPageCount + 1}</div>`;
                    paperLayer.appendChild(pageCard);
                }
                // Check if the last page is unnecessary (content ends before the last page starts)
                else if (currentRenderedPageCount > 1 && contentBottom < lastPageWorkspaceTop) {
                    // Content ends before the last page begins, remove the last page card
                    const lastPageCardElement = paperLayer.lastElementChild;
                    if (lastPageCardElement && lastPageCardElement.classList.contains('page-card')) {
                        lastPageCardElement.remove();
                    }
                }
            }
        }

    } finally {
        // Always reset the flag when done, even if an error occurred
        // Use requestAnimationFrame to reset the flag after the browser has painted
        requestAnimationFrame(() => {
            isUpdatingPagination = false;
        });
    }
}

/**
 * Sets up pagination observers using ResizeObserver.
 * Monitors the ink-layer height directly rather than relying on specific UI events.
 */
export function setupPaginationListeners() {
    // Clean up any previous observers to prevent duplicate listeners
    if (cleanupObservers) {
        cleanupObservers();
    }
    
    // Get the ink layer element
    const inkLayer = document.querySelector('.ink-layer');
    if (!inkLayer) {
        console.error("Could not find ink-layer element for pagination observer setup");
        return;
    }
    
    // Initialize the previous height
    previousInkLayerHeight = inkLayer.offsetHeight;
    
    // Create a ResizeObserver to monitor the ink-layer height
    const resizeObserver = new ResizeObserver(entries => {
        // Clear any pending timeout to prevent multiple queued updates
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }
        
        // Set a new timeout to throttle the update frequency
        resizeTimeout = setTimeout(() => {
            // Get the ink layer entry (should be the first one as we're only observing one element)
            const inkLayerEntry = entries[0];
            
            // Get the current height from borderBoxSize if available, fallback to contentRect
            let currentHeight;
            if (inkLayerEntry.borderBoxSize && inkLayerEntry.borderBoxSize.length > 0) {
                // Modern browsers with full ResizeObserver implementation
                currentHeight = inkLayerEntry.borderBoxSize[0].blockSize;
            } else {
                // Fallback for older browsers
                currentHeight = inkLayerEntry.contentRect.height;
            }
            
            // Only trigger if the height actually changed significantly and we're not already updating
            if (Math.abs(currentHeight - previousInkLayerHeight) > 1 && !isUpdatingPagination) {
                // Update the previous height tracker
                previousInkLayerHeight = currentHeight;
                
                // Call the pagination update function directly for general resizes.
                // Visibility toggles now trigger their own rAF update via visibility.js
                updatePagination();
            }
        }, 150); // 150ms throttle delay - adjust based on performance testing
    });
    
    // Start observing the ink-layer
    resizeObserver.observe(inkLayer);
    
    // Set up cleanup function
    cleanupObservers = () => {
        resizeObserver.disconnect();
    };
    
    // Keep the content-changed event listener as a manual trigger option
    document.addEventListener('content-changed', () => {
        // The updatePagination function will handle the isUpdatingPagination flag
        updatePagination();
    });
}
