# Task 49: Remove Page Break Debug Lines

**Objective:** Remove the visual debug indicators (horizontal lines and labels) for page top and bottom boundaries that are currently added by the pagination logic.

**Background:**
The `pageBreaksCore.js` module currently injects `div` elements with classes like `debug-indicator`, `debug-top`, `debug-bottom`, and `debug-label` to visually represent the calculated workspace boundaries for each page. These were useful for development but are no longer needed and are causing minor alignment issues with other elements like the demo banner.

**Steps:**

1.  **Identify and Remove JS Code:**
    *   Locate the section within `src/dom/pageBreaks/pageBreaksCore.js` where the debug indicator `div` elements (for both top and bottom lines, including their labels) are created and appended to the `document.body`.
    *   Remove this entire block of code responsible for creating and adding these debug elements.

2.  **Identify and Remove CSS Rules:**
    *   Search the CSS files (likely in `src/styles/page-breaks.css` or potentially `main.css` or `base.css`) for rules targeting the following classes:
        *   `.debug-indicator`
        *   `.debug-top`
        *   `.debug-bottom`
        *   `.debug-label`
        *   Any other related styles specifically for these debug elements.
    *   Remove these CSS rules.

**Verification:**

*   Run the application and confirm that the green "Page # Top" lines and red "Page # Bottom" lines no longer appear on the screen.
*   Ensure that removing this code does not negatively impact the core pagination functionality.
