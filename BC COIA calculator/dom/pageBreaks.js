/**
 * Calculates the height of a page in pixels.
 * Uses different heights for online viewing vs printing.
 * @param {boolean} forPrint - Whether the calculation is for print view
 * @returns {number} Page height in pixels.
 */
export function getPageHeightPx(forPrint = false) {
    const dpi = 96; // Standard screen DPI
    
    if (forPrint) {
        // Standard letter size for print
        const printHeightInches = 11.0;
        return printHeightInches * dpi; // 1056px
    } else {
        // Online view gets extra space (+0.75 inch)
        const onlineHeightInches = 11.75; // Standard letter size + 3/4 inch
        return onlineHeightInches * dpi; // 1128px
    }
}

/**
 * Adds simple page break bands at fixed intervals.
 * Creates gray horizontal bands to create a 3D illusion of page separation.
 */
export function updatePageBreakIndicators() {
    const paper = document.querySelector('.paper');
    if (!paper) {
        console.warn("Could not find '.paper' element for page break indicators.");
        return;
    }

    // Clear any existing bands
    const existingBands = paper.querySelectorAll('.page-break-band');
    existingBands.forEach(el => el.remove());

    const pageHeightPx = getPageHeightPx();
    if (pageHeightPx <= 0) {
        console.warn("Calculated page height is invalid.");
        return;
    }

    // Calculate how many pages the content spans
    const paperHeight = paper.scrollHeight;
    // Use online page height for the visual indicators
    const onlinePageHeightPx = getPageHeightPx(false);
    const numPages = Math.ceil(paperHeight / onlinePageHeightPx);

    // Add only page break bands at fixed intervals
    for (let i = 1; i < numPages; i++) {
        const breakPositionPx = i * onlinePageHeightPx;
        
        // Create page break band
        const band = document.createElement('div');
        band.className = 'page-break-band';
        // Position the band exactly at the page break position
        // This will center it on the page break line
        band.style.top = `${breakPositionPx}px`;
        band.textContent = "- page break -";
        paper.appendChild(band);
    }
}

/**
 * Sets up event listeners for page break indicators.
 * Updates indicators on page load and window resize.
 */
export function setupPageBreakIndicatorListeners() {
    // Initial update on load
    window.addEventListener('load', updatePageBreakIndicators);

    // Update on resize (debounced)
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updatePageBreakIndicators, 250);
    });
}
