# Option 2: JavaScript-Calculated Breaks with Explicit Indicators Online

## Overview

This approach uses JavaScript to calculate element heights and determine more precise page break locations, inserting visible markers (like dashed lines with "Page Break" labels) into the online view. It provides a more accurate visual representation of where page breaks will occur in the printed output while maintaining the single-scroll online experience.

## Implementation Details

### 1. Print Margin Fix

Similar to Option 1, enhance the existing `styles/print.css` file to properly define page margins:

```css
@media print {
  @page {
    size: letter;
    margin: 0.75in; /* Standard document margins */
  }
  
  /* Ensure content respects margins */
  body {
    margin: 0;
    padding: 0;
  }
  
  /* Hide page break indicators when printing */
  .page-break-indicator {
    display: none;
  }
}
```

### 2. Page Break Indicator Styling

Add CSS for the page break indicators that will be dynamically inserted:

```css
/* In styles/layout.css or a new styles/page-breaks.css file */

/* Page break indicator styling */
.page-break-indicator {
  width: 100%;
  text-align: center;
  border-bottom: 1px dashed #999;
  margin: 20px 0;
  position: relative;
}

.page-break-indicator::after {
  content: "Page Break";
  position: absolute;
  top: -0.8em;
  left: 50%;
  transform: translateX(-50%);
  background-color: white;
  padding: 0 10px;
  font-size: 0.8em;
  color: #999;
}
```

### 3. JavaScript for Calculating and Displaying Page Breaks

Create a new JavaScript module (e.g., `dom/pageBreaks.js`) to handle the calculation and display of page breaks:

```javascript
// dom/pageBreaks.js

/**
 * Constants for page dimensions (in pixels)
 * These values approximate standard letter size (8.5" x 11") at 96 DPI
 */
const PAGE_DIMENSIONS = {
  width: 816,  // 8.5 inches at 96 DPI
  height: 1056, // 11 inches at 96 DPI
  margins: {
    top: 72,    // 0.75 inch top margin
    right: 72,  // 0.75 inch right margin
    bottom: 72, // 0.75 inch bottom margin
    left: 72    // 0.75 inch left margin
  }
};

/**
 * Calculate the available content height per page (in pixels)
 */
const CONTENT_HEIGHT = PAGE_DIMENSIONS.height - (PAGE_DIMENSIONS.margins.top + PAGE_DIMENSIONS.margins.bottom);

/**
 * Calculate and display page break indicators
 */
function calculateAndDisplayPageBreaks() {
  // Remove any existing page break indicators
  document.querySelectorAll('.page-break-indicator').forEach(el => el.remove());
  
  // Get the container that holds all the calculation results
  const resultsContainer = document.getElementById('results-container');
  if (!resultsContainer) return;
  
  // Get all direct child elements of the results container
  const elements = Array.from(resultsContainer.children);
  
  let currentHeight = 0;
  
  // Process each element to determine where breaks would occur
  elements.forEach((element, index) => {
    // Skip existing page break indicators
    if (element.classList.contains('page-break-indicator')) return;
    
    const elementHeight = element.offsetHeight;
    
    // If adding this element would exceed page height
    if (currentHeight + elementHeight > CONTENT_HEIGHT) {
      // Create a page break indicator
      const pageBreak = document.createElement('div');
      pageBreak.className = 'page-break-indicator';
      
      // Insert it before the current element
      resultsContainer.insertBefore(pageBreak, element);
      
      // Reset height counter for new page
      currentHeight = elementHeight;
    } else {
      // Add this element's height to the current page
      currentHeight += elementHeight;
    }
  });
}

/**
 * Set up a MutationObserver to watch for content changes
 * and recalculate page breaks when needed
 */
function setupPageBreakObserver() {
  const resultsContainer = document.getElementById('results-container');
  if (!resultsContainer) return;
  
  // Debounce timer to avoid excessive recalculations
  let recalculationTimer;
  
  // Create a MutationObserver to watch for content changes
  const observer = new MutationObserver(() => {
    // Debounce to avoid excessive recalculations
    clearTimeout(recalculationTimer);
    recalculationTimer = setTimeout(() => {
      calculateAndDisplayPageBreaks();
    }, 250); // Wait 250ms after changes stop before recalculating
  });
  
  // Start observing content changes
  observer.observe(resultsContainer, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true
  });
}

/**
 * Initialize page break functionality
 */
function initPageBreaks() {
  // Initial calculation of page breaks
  calculateAndDisplayPageBreaks();
  
  // Set up observer for dynamic content changes
  setupPageBreakObserver();
  
  // Recalculate on window resize (debounced)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      calculateAndDisplayPageBreaks();
    }, 250);
  });
}

// Export functions for use in other modules
export { initPageBreaks, calculateAndDisplayPageBreaks };
```

### 4. Table Handling for Print

Enhance the print CSS to handle tables properly across page breaks (same as Option 1):

```css
@media print {
  /* Allow tables to break across pages */
  table {
    page-break-inside: auto;
  }
  
  /* Try to avoid breaking rows */
  tr {
    page-break-inside: avoid;
  }
  
  /* Repeat table headers on each page */
  thead {
    display: table-header-group;
  }
  
  /* Repeat table footers on each page */
  tfoot {
    display: table-footer-group;
  }
  
  /* Avoid breaking after headings */
  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
  }
}
```

### 5. Integration with Main Application

Update the main application code to initialize the page break functionality:

```javascript
// In calculator.ui.js or a similar initialization file

import { initPageBreaks } from './dom/pageBreaks.js';

// Initialize page breaks after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Other initialization code...
  
  // Initialize page breaks
  initPageBreaks();
});

// Recalculate page breaks after calculations are updated
function updateCalculations() {
  // Existing calculation update code...
  
  // Import and call the function to recalculate page breaks
  import('./dom/pageBreaks.js').then(module => {
    module.calculateAndDisplayPageBreaks();
  });
}
```

## Advantages

1. **More Accurate Visual Representation**: Provides a more precise indication of where page breaks will occur in the printed output.
2. **Explicit Visual Indicators**: Clear dashed lines with "Page Break" labels make it obvious where content will break across pages.
3. **Dynamic Recalculation**: Automatically updates page break indicators when content changes or the window is resized.
4. **Maintains Current UX**: Preserves the single-scroll online user experience while adding visual cues.
5. **Moderate Complexity**: More complex than Option 1 but less invasive than Option 3.

## Limitations

1. **Calculation Precision**: `offsetHeight` measurements may not perfectly match browser print rendering in all cases.
2. **Performance Considerations**: Calculating element heights and observing DOM changes has some performance cost.
3. **Not True WYSIWYG**: Still doesn't visually represent the multi-page layout of the printed version.
4. **Browser Variations**: Different browsers may interpret print CSS slightly differently.

## Implementation Steps

1. Create the new `dom/pageBreaks.js` module with the page break calculation logic.
2. Add the page break indicator CSS to the appropriate stylesheet.
3. Update `styles/print.css` with proper `@page` rules and table handling CSS.
4. Integrate the page break initialization into the main application code.
5. Ensure tables have proper `<thead>` elements for consistent printing.
6. Test the page break indicators with various content amounts and window sizes.
7. Test printing in multiple browsers to verify margins and table handling.
8. Fine-tune the page height calculations based on testing results.

## Estimated Effort

* **Medium**: 2-3 days of development and testing.
* Involves both CSS changes and more complex JavaScript for calculations and DOM manipulation.
* Requires careful testing to ensure page break indicators accurately reflect print output.
* May need adjustments based on testing with different content volumes and browser variations.
