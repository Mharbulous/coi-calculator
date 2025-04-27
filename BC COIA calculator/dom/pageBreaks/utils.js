/**
 * Utility functions for pagination.
 */

// Class for elements visible only on screen
export const SCREEN_ONLY_CLASS = 'screen-only';

/**
 * Gets the computed top padding of an element in pixels.
 * @param {HTMLElement} element - The element to measure.
 * @returns {number} Top padding in pixels.
 */
export function getElementTopPadding(element) {
    if (!element) return 0;
    const styles = window.getComputedStyle(element);
    return parseFloat(styles.paddingTop) || 0;
}

/**
 * Gets the height of an element, including padding and border.
 * @param {HTMLElement} element - The element to measure.
 * @returns {number} Height in pixels.
 */
export function getElementOuterHeight(element) {
    if (!element) return 0;
    return element.offsetHeight; // Includes padding and border
}

/**
 * Gets the absolute vertical position (top offset) of an element relative to the document.
 * @param {HTMLElement} element - The element to measure.
 * @returns {number} Top offset in pixels.
 */
export function getElementAbsoluteTop(element) {
    if (!element) return 0;
    const rect = element.getBoundingClientRect();
    return rect.top + window.scrollY;
}

/**
 * Creates and inserts a blank row for spacing.
 * @param {HTMLElement} referenceRow - The row to insert the blank row before.
 * @param {number} height - The height of the blank row.
 */
export function insertBlankRow(referenceRow, height) {
    if (!referenceRow || height <= 0) return;
    const blankRow = document.createElement('tr');
    blankRow.classList.add(SCREEN_ONLY_CLASS, 'page-break-spacer'); // Add spacer class
    const cell = document.createElement('td');
    // Attempt to find the number of columns from the table header or the reference row
    let colspan = 5; // Default colspan
    const table = referenceRow.closest('table');
    if (table) {
        const header = table.querySelector('thead tr');
        if (header) {
            colspan = header.cells.length;
        } else {
             // Fallback to reference row if no header
             colspan = referenceRow.cells.length;
        }
    } else {
        colspan = referenceRow.cells.length;
    }
    cell.setAttribute('colspan', colspan.toString());
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
export function insertHeaderRow(referenceRow, originalHeaderRow) {
    if (!referenceRow || !originalHeaderRow) return 0;
    const clonedHeader = originalHeaderRow.cloneNode(true);
    clonedHeader.classList.add(SCREEN_ONLY_CLASS, 'repeated-header'); // Add repeated-header class

    // Optional: Add styling or markers to distinguish repeated headers
    clonedHeader.style.backgroundColor = 'rgba(200, 200, 200, 0.1)'; // Subtle background

    referenceRow.parentNode.insertBefore(clonedHeader, referenceRow);
    return getElementOuterHeight(clonedHeader);
}

/**
 * Creates and inserts blank space (div) before an element.
 * @param {HTMLElement} referenceElement - The element to insert space before.
 * @param {number} height - The height of the blank space.
 */
export function insertBlankSpace(referenceElement, height) {
    if (!referenceElement || height <= 0) return;
    const blankSpace = document.createElement('div');
    blankSpace.classList.add(SCREEN_ONLY_CLASS, 'page-break-spacer'); // Add spacer class
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
 * Inserts a page break (spacer and potentially repeated header) before a given element.
 * @param {HTMLElement} element - The .breakable element requiring a page break before it.
 * @param {number} requiredSpacerHeight - The calculated height needed for the spacer.
 */
export function insertPageBreakBeforeElement(element, requiredSpacerHeight) {
    if (!element || requiredSpacerHeight <= 0) return;

    if (element.tagName === 'TR') {
        // Handle table rows: insert blank row spacer and repeat header
        const table = element.closest('table');
        const originalHeaderRow = table ? table.querySelector('thead tr') : null;

        // Insert the main spacer row
        const spacerRow = insertBlankRow(element, requiredSpacerHeight);

        // Insert the repeated header *after* the spacer, *before* the element
        if (originalHeaderRow) {
            const headerHeight = insertHeaderRow(element, originalHeaderRow);
            // Adjust spacer height if needed? For now, assume spacer height is primary.
            // If header repetition needs to be *part* of the space, this logic needs refinement.
        }

    } else {
        // Handle other elements: insert a generic div spacer
        insertBlankSpace(element, requiredSpacerHeight);
    }
}


/**
 * Removes all elements with the screen-only class.
 */
export function clearScreenOnlyElements() {
    // Include spacers and repeated headers in removal
    document.querySelectorAll(`.${SCREEN_ONLY_CLASS}`).forEach(el => el.remove());
}
