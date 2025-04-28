# `pageBreaksCore.js` Logic Flow

This diagram illustrates the logical flow of the `updatePagination` function in pageBreaksCore.js.

```mermaid
graph TD
    A[Start updatePagination] --> B[Clear previous spacers]
    B --> C[Calculate page dimensions]
    C --> D[Render page cards]
    D --> E[Calculate workspace boundaries]
    
    E --> F[Get all .breakable elements]
    F --> G[For each breakable element]
    
    G --> H[Get element position & height]
    H --> I{Element overflows page?}
    
    I -- Yes --> J[Insert page break]
    I -- No --> K[Continue to next element]
    
    J --> K
    K --> L{More elements?}
    
    L -- Yes --> G
    L -- No --> M[Final page adjustments]
    M --> N[End]
    
    O[setupPaginationListeners] --> P[Add content-changed event]
    P --> Q[Log initialization]
```

## Detailed Explanation

1. **Initialization**
   - Clear existing spacers and visual indicators
   - Get DOM elements (ink layer, paper layer, table bodies)
   - Calculate initial measurements for the paper layout

2. **Page Setup**
   - Render page cards based on content height
   - Calculate workspace boundaries for each page
   - Add visual indicators for debugging (page top/bottom markers)

3. **Processing Breakable Elements**
   - Get all elements with `.breakable` class
   - For each element:
     - Calculate block height (distance to next breakable element)
     - Determine which page the element is on
     - Check if the element's block overflows the current page
     - If overflow detected, insert a page break before the element

4. **Final Adjustments**
   - Check positioning of final elements (like table footers)
   - Add or remove pages as needed
   - Ensure proper spacing throughout document

5. **Event Handling**
   - Setup listeners to trigger pagination updates when content changes
