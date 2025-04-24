# Option 3: Simulated Page Containers (Full WYSIWYG)

## Overview

This approach restructures the online display to render content within fixed-size `div` elements, each visually representing a sheet of paper. It aims to provide a WYSIWYG experience by actually displaying the content in a paginated format that closely mirrors the printed output. 

## Implementation Details

### 1\. Page Container CSS

Create CSS for the page containers that will visually represent sheets of paper:

```css
/* In styles/layout.css or a new styles/page-containers.css file */

/* Container for all pages */
.page-container {
  background-color: #f0f0f0; /* Background for the "non-paper" area */
  padding: 1in;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

/* Individual page styling */
.page {
  width: 8.5in;
  height: 11in;
  padding: 0.75in; /* Margins */
  margin-bottom: 0.5in; /* Space between pages */
  background-color: white;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

/* Content area within each page */
.page-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

/* Page number indicator */
.page-number {
  position: absolute;
  bottom: 0.25in;
  right: 0.25in;
  font-size: 0.8rem;
  color: #888;
}
```

### 2\. Print CSS for Page Containers

Update the print CSS to handle the page containers properly:

```css
@media print {
  /* Reset page container background */
  .page-container {
    background-color: transparent;
    padding: 0;
  }
  
  /* Ensure each page div starts on a new physical page */
  .page {
    width: 100%;
    height: auto;
    padding: 0;
    margin: 0;
    box-shadow: none;
    page-break-after: always;
    break-after: page;
  }
  
  /* Hide page numbers in print */
  .page-number {
    display: none;
  }
  
  /* Set page margins using @page */
  @page {
    size: letter;
    margin: 0; /* No margins since they're handled by the .page padding */
  }
  
  /* Table handling */
  table {
    page-break-inside: auto;
  }
  
  tr {
    page-break-inside: avoid;
  }
  
  thead {
    display: table-header-group;
  }
  
  tfoot {
    display: table-footer-group;
  }
}
```

### 3\. JavaScript for Page-Based Content Rendering

Create a new JavaScript module (e.g., `dom/pageRenderer.js`) to handle the pagination and content rendering:

```javascript
// dom/pageRenderer.js

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
const CONTENT_WIDTH = PAGE_DIMENSIONS.width - (PAGE_DIMENSIONS.margins.left + PAGE_DIMENSIONS.margins.right);

/**
 * Create a new page container
 * @param {number} pageNumber - The page number
 * @returns {HTMLElement} - The page container element
 */
function createPage(pageNumber) {
  const page = document.createElement('div');
  page.className = 'page';
  
  const pageContent = document.createElement('div');
  pageContent.className = 'page-content';
  
  const pageNumberEl = document.createElement('div');
  pageNumberEl.className = 'page-number';
  pageNumberEl.textContent = `Page ${pageNumber}`;
  
  page.appendChild(pageContent);
  page.appendChild(pageNumberEl);
  
  return page;
}

/**
 * Render content into pages
 * @param {HTMLElement} contentContainer - The container with the original content
 * @param {HTMLElement} pageContainer - The container where pages will be rendered
 */
function renderContentIntoPages(contentContainer, pageContainer) {
  // Clear existing pages
  pageContainer.innerHTML = '';
  
  // Create the first page
  let currentPage = createPage(1);
  let currentPageContent = currentPage.querySelector('.page-content');
  pageContainer.appendChild(currentPage);
  
  let pageNumber = 1;
  let currentPageHeight = 0;
  
  // Process each element in the content container
  Array.from(contentContainer.children).forEach(element => {
    // Clone the element to measure its height
    const clone = element.cloneNode(true);
    clone.style.visibility = 'hidden';
    currentPageContent.appendChild(clone);
    
    const elementHeight = clone.offsetHeight;
    currentPageContent.removeChild(clone);
    
    // Check if this element would fit on the current page
    if (currentPageHeight + elementHeight > CONTENT_HEIGHT) {
      // Element doesn't fit, create a new page
      pageNumber++;
      currentPage = createPage(pageNumber);
      currentPageContent = currentPage.querySelector('.page-content');
      pageContainer.appendChild(currentPage);
      currentPageHeight = 0;
    }
    
    // Special handling for tables that might span multiple pages
    if (element.tagName === 'TABLE') {
      renderTableAcrossPages(element, currentPage, pageContainer);
    } else {
      // For non-table elements, just clone and append
      const elementClone = element.cloneNode(true);
      currentPageContent.appendChild(elementClone);
      currentPageHeight += elementHeight;
    }
  });
}

/**
 * Render a table across multiple pages if needed
 * @param {HTMLElement} table - The table element
 * @param {HTMLElement} currentPage - The current page
 * @param {HTMLElement} pageContainer - The container where pages are rendered
 */
function renderTableAcrossPages(table, currentPage, pageContainer) {
  let currentPageContent = currentPage.querySelector('.page-content');
  let pageNumber = parseInt(currentPage.querySelector('.page-number').textContent.replace('Page ', ''));
  
  // Clone the table to work with
  const tableClone = table.cloneNode(true);
  
  // Get the table header if it exists
  const thead = tableClone.querySelector('thead');
  const headerHeight = thead ? thead.offsetHeight : 0;
  
  // Get all rows (excluding header rows)
  const rows = Array.from(tableClone.querySelectorAll('tbody tr'));
  
  // Create a new table for the current page
  let currentTable = document.createElement('table');
  currentTable.className = tableClone.className;
  
  // Add the header to the current table
  if (thead) {
    currentTable.appendChild(thead.cloneNode(true));
  }
  
  // Create tbody for the current table
  let currentTbody = document.createElement('tbody');
  currentTable.appendChild(currentTbody);
  
  // Add the current table to the current page
  currentPageContent.appendChild(currentTable);
  
  // Track available height on current page
  let availableHeight = CONTENT_HEIGHT - headerHeight;
  
  // Process each row
  rows.forEach(row => {
    // Clone the row to measure its height
    const rowClone = row.cloneNode(true);
    rowClone.style.visibility = 'hidden';
    currentTbody.appendChild(rowClone);
    
    const rowHeight = rowClone.offsetHeight;
    currentTbody.removeChild(rowClone);
    
    // Check if this row would fit on the current page
    if (rowHeight > availableHeight) {
      // Row doesn't fit, create a new page
      pageNumber++;
      const newPage = createPage(pageNumber);
      pageContainer.appendChild(newPage);
      
      currentPage = newPage;
      currentPageContent = currentPage.querySelector('.page-content');
      
      // Create a new table for the new page
      currentTable = document.createElement('table');
      currentTable.className = tableClone.className;
      
      // Add the header to the new table
      if (thead) {
        const newThead = thead.cloneNode(true);
        currentTable.appendChild(newThead);
      }
      
      // Create tbody for the new table
      currentTbody = document.createElement('tbody');
      currentTable.appendChild(currentTbody);
      
      // Add the new table to the new page
      currentPageContent.appendChild(currentTable);
      
      // Reset available height for the new page
      availableHeight = CONTENT_HEIGHT - headerHeight;
    }
    
    // Add the row to the current table
    const actualRowClone = row.cloneNode(true);
    currentTbody.appendChild(actualRowClone);
    
    // Update available height
    availableHeight -= rowHeight;
  });
}

/**
 * Initialize the page-based rendering
 */
function initPageRenderer() {
  // Get the original content container
  const originalContent = document.getElementById('results-container');
  if (!originalContent) return;
  
  // Create a container for the pages
  const pageContainer = document.createElement('div');
  pageContainer.className = 'page-container';
  
  // Insert the page container after the original content
  originalContent.parentNode.insertBefore(pageContainer, originalContent.nextSibling);
  
  // Hide the original content
  originalContent.style.display = 'none';
  
  // Render the content into pages
  renderContentIntoPages(originalContent, pageContainer);
  
  // Set up a MutationObserver to watch for content changes
  const observer = new MutationObserver(() => {
    renderContentIntoPages(originalContent, pageContainer);
  });
  
  // Start observing content changes
  observer.observe(originalContent, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true
  });
  
  // Recalculate on window resize (debounced)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      renderContentIntoPages(originalContent, pageContainer);
    }, 250);
  });
}

// Export functions for use in other modules
export { initPageRenderer };
```

### 4\. Integration with Main Application

Update the main application code to initialize the page renderer:

```javascript
// In calculator.ui.js or a similar initialization file

import { initPageRenderer } from './dom/pageRenderer.js';

// Initialize page renderer after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Other initialization code...
  
  // Initialize page renderer
  initPageRenderer();
});

// Update page rendering after calculations are updated
function updateCalculations() {
  // Existing calculation update code...
  
  // The MutationObserver in pageRenderer.js will automatically
  // detect these changes and re-render the pages
}
```

### 5\. Modify Table Generation Code

Update the table generation code to ensure tables have proper `<thead>` elements:

```javascript
// In dom/tables.interest.js or similar

function createInterestTable(data) {
  const table = document.createElement('table');
  
  // Create thead element
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  
  // Add header cells
  ['Date', 'Description', 'Days', 'Rate', 'Principal', 'Interest'].forEach(text => {
    const th = document.createElement('th');
    th.textContent = text;
    headerRow.appendChild(th);
  });
  
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Create tbody for the data rows
  const tbody = document.createElement('tbody');
  
  // Add data rows...
  
  table.appendChild(tbody);
  return table;
}
```

## Advantages

1.  **True WYSIWYG Experience**: Provides the most accurate representation of how the content will appear when printed.
2.  **Visual Page Separation**: Clear visual separation between pages with proper margins and page numbers.
3.  **Consistent Layout**: What you see online is exactly what you get when printing.
4.  **Table Handling**: Properly handles tables that span multiple pages by repeating headers.
5.  **User Control**: Optional toggle allows users to switch between paginated and normal views.

## Limitations

1.  **Implementation Complexity**: Requires significant changes to the application's rendering logic.
2.  **Performance Considerations**: More complex DOM manipulation and calculations may impact performance.
3.  **Maintenance Overhead**: More code to maintain and potential for bugs in the pagination logic.
4.  **Browser Compatibility**: May require additional testing and adjustments for different browsers.
5.  **User Experience Change**: Represents a significant change to the current scrolling experience.

## Implementation Steps

1.  Create the CSS for page containers and update the print CSS.
2.  Create the `dom/pageRenderer.js` module with the pagination logic.
3.  Modify table generation code to ensure proper `<thead>` elements.
4.  Integrate the page renderer initialization into the main application code.
5.  Implement the optional view toggle functionality.
6.  Test the pagination with various content amounts and window sizes.
7.  Test printing from the paginated view to verify consistency.
8.  Fine-tune the page dimensions and rendering logic based on testing results.

## Estimated Effort

*   **High**: 4-7 days of development and testing.
*   Involves significant changes to both CSS and JavaScript.
*   Requires careful testing with different content volumes, table sizes, and browser variations.
*   May need multiple iterations to refine the pagination logic and ensure consistent rendering.
*   Consider implementing in phases, starting with basic pagination and then adding more complex features like table splitting.