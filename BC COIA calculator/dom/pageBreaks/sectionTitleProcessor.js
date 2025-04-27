/**
 * Section title processor for pagination.
 */

import { 
    getElementAbsoluteTop, 
    getElementOuterHeight, 
    insertBlankSpace 
} from './utils.js';

/**
 * Processes a section title for pagination, determining if it needs to be pushed to the next page.
 * 
 * @param {HTMLElement} titleElement - The section title element to process
 * @param {Object} context - The pagination context
 * @param {number} context.currentPageIndex - Current page index
 * @param {Array<number>} context.workspaceBottom - Array of workspace bottom boundaries
 * @param {Array<number>} context.workspaceTop - Array of workspace top boundaries
 * @param {number} context.inkLayerMargin - Ink layer margin (top padding)
 * @param {HTMLElement} [context.headerElement] - Optional header element that follows the title
 * @returns {Object|null} Break information if a break is needed, null otherwise
 */
export function processSectionTitle(titleElement, context) {
    const { 
        currentPageIndex, 
        workspaceBottom, 
        workspaceTop, 
        inkLayerMargin,
        headerElement
    } = context;
    
    if (!titleElement) return null;
    
    // Get title dimensions
    const titleTop = getElementAbsoluteTop(titleElement);
    const titleHeight = getElementOuterHeight(titleElement);
    
    // Track if a break was inserted
    let breakInserted = false;
    let heightAdded = 0;
    let newPageIndex = currentPageIndex;
    
    // Check if the title is within a specific distance from the bottom of any page
    // or if the title plus table header would overflow the page
    for (let p = 0; p < workspaceBottom.length; p++) {
        const distanceToBottom = workspaceBottom[p] - titleTop;
        
        // Check if title is too close to bottom of page
        if (distanceToBottom > 0 && distanceToBottom < titleHeight * 2) {
            // Ensure there's a next page to calculate the gap against
            if (p + 1 < workspaceTop.length) {
                const blankSpaceHeight = workspaceTop[p + 1] - titleTop;
                
                // Insert the blank space
                const blankSpace = insertBlankSpace(titleElement, blankSpaceHeight);
                
                // Add a special class to the blank space for debugging
                if (blankSpace) {
                    blankSpace.classList.add('title-page-break');
                    blankSpace.style.border = '2px dashed purple';
                    blankSpace.style.backgroundColor = 'rgba(255, 0, 255, 0.1)';
                }
                
                heightAdded = blankSpaceHeight;
                
                // Update page index
                if (p >= currentPageIndex) {
                    newPageIndex = p + 1;
                }
                
                breakInserted = true;
                break;
            }
        }
        
        // Check if the title plus header would overflow
        if (!breakInserted && headerElement && distanceToBottom > 0) {
            const headerHeight = getElementOuterHeight(headerElement);
            if (titleTop + titleHeight + headerHeight > workspaceBottom[p]) {
                // Ensure there's a next page to calculate the gap against
                if (p + 1 < workspaceTop.length) {
                    const blankSpaceHeight = workspaceTop[p + 1] - titleTop;
                    
                    // Insert the blank space
                    const blankSpace = insertBlankSpace(titleElement, blankSpaceHeight);
                    
                    // Add a special class to the blank space for debugging
                    if (blankSpace) {
                        blankSpace.classList.add('title-page-break');
                        blankSpace.style.border = '2px dashed purple';
                        blankSpace.style.backgroundColor = 'rgba(255, 0, 255, 0.1)';
                    }
                    
                    heightAdded = blankSpaceHeight;
                    
                    // Update page index
                    if (p >= currentPageIndex) {
                        newPageIndex = p + 1;
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
            // Check if the title starts near the bottom of page p, using the threshold
            if (workspaceBottom[p] > titleTop && workspaceBottom[p] < titleTop + (3 * titleHeight + inkLayerMargin)) {
                // Ensure there's a next page to calculate the gap against
                if (p + 1 < workspaceTop.length) {
                    const blankSpaceHeight = workspaceTop[p + 1] - titleTop;
                    
                    // Insert the blank space
                    const blankSpace = insertBlankSpace(titleElement, blankSpaceHeight);
                    
                    // Add a special class to the blank space for debugging
                    if (blankSpace) {
                        blankSpace.classList.add('title-page-break');
                        blankSpace.style.border = '2px dashed purple';
                        blankSpace.style.backgroundColor = 'rgba(255, 0, 255, 0.1)';
                    }
                    
                    heightAdded = blankSpaceHeight;
                    
                    // Update page index
                    if (p >= currentPageIndex) {
                        newPageIndex = p + 1;
                    }
                    
                    breakInserted = true;
                    break; // Found a break, no need to check other pages
                } else {
                    console.warn("Title break needed, but no next page exists.");
                }
            }
        }
    }
    
    // Return break information if a break was inserted
    if (breakInserted) {
        return {
            pageBreakInserted: true,
            heightAdded: heightAdded,
            newPageIndex: newPageIndex
        };
    }
    
    // No break needed
    return null;
}
