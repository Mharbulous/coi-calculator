/**
 * Core pagination framework.
 */

import elements from '../elements.js';
import { 
    clearScreenOnlyElements, 
    getElementTopPadding, 
    getElementOuterHeight, 
    getElementAbsoluteTop 
} from './utils.js';
import { processTableRow } from './tableRowProcessor.js';
import { processSectionTitle } from './sectionTitleProcessor.js';

/**
 * Implements WYSIWYG pagination by synchronizing ink and paper layers.
 */
export function updatePagination() {
    clearScreenOnlyElements(); // Clear previous breaks

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

    // Get table footer height
    const prejudgmentFooterRow = prejudgmentTable.querySelector('tfoot tr.total');
    const tableFootHeight = getElementOuterHeight(prejudgmentFooterRow);

    // --- Process Elements ---
    
    let currentPageIndex = 0;
    const originalPrejudgmentHeader = prejudgmentTable.querySelector('thead tr');
    const originalPostjudgmentHeader = postjudgmentTable.querySelector('thead tr');

    // Process prejudgment rows
    const prejudgmentRows = prejudgmentTableBody.querySelectorAll('tr');
    for (const row of prejudgmentRows) {
        const context = {
            currentPageIndex,
            workspaceBottom,
            workspaceTop,
            tableFootHeight,
            headerRow: originalPrejudgmentHeader
        };
        
        const result = processTableRow(row, context);
        
        if (result && result.pageBreakInserted) {
            inkLayerHeight += result.heightAdded;
            currentPageIndex = result.newPageIndex;
        }
    }

    // Process postjudgment title
    const postjudgmentTitle = Array.from(document.querySelectorAll('.section-title'))
                                   .find(el => el.textContent.includes('Postjudgment Interest Calculations'));
    
    const postjudgmentHeader = postjudgmentTable.querySelector('thead');
    
    if (postjudgmentTitle) {
        const context = {
            currentPageIndex,
            workspaceBottom,
            workspaceTop,
            inkLayerMargin,
            headerElement: postjudgmentHeader
        };
        
        const result = processSectionTitle(postjudgmentTitle, context);
        
        if (result && result.pageBreakInserted) {
            inkLayerHeight += result.heightAdded;
            currentPageIndex = result.newPageIndex;
        }
    }

    // Process postjudgment rows
    const postjudgmentRows = postjudgmentTableBody.querySelectorAll('tr');
    for (const row of postjudgmentRows) {
        const context = {
            currentPageIndex,
            workspaceBottom,
            workspaceTop,
            tableFootHeight,
            headerRow: originalPostjudgmentHeader
        };
        
        const result = processTableRow(row, context);
        
        if (result && result.pageBreakInserted) {
            inkLayerHeight += result.heightAdded;
            currentPageIndex = result.newPageIndex;
        }
    }

    // --- Final Page Adjustments ---
    
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
 */
export function setupPaginationListeners() {
    // Example: Trigger updatePagination on relevant state changes or events
    // This needs to be integrated into the main application flow (e.g., in calculator.ui.js)
    // window.addEventListener('some-update-event', updatePagination);
}
