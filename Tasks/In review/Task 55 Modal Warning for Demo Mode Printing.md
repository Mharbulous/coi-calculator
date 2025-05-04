# Task 55: Modal Warning for Demo Mode Printing (Revised Plan)

## Overview

Implement a robust solution to ensure users of the demo version always see a warning about mock interest rates when printing through the browser, but don't see duplicate warnings when using the app's Print button.

## Problem Statement

Currently, the demo modal is only shown when users click the app's Print button, but users can bypass this warning by using browser print functions (Ctrl+P, right-click menu, etc.). We need a solution that ensures:

1.  The warning is visible when printing directly through the browser
2.  The warning doesn't appear twice (on-screen and in printout) when using the app's Print button

## Improved Approach

After testing several strategies, we've found the most effective approach is to use a static print-only warning element positioned between summary and calculation tables. This will be coupled with direct DOM manipulation to temporarily hide it during app-initiated prints:

1.  Create a print-only warning div with default CSS to show in print but hide on screen
2.  Place it in the correct position in the document flow
3.  When using the app's Print button, temporarily hide the element with inline styles

This approach is simpler than our previous attempts and avoids complex state tracking.

## Implementation Details

### 1\. Create Print-Only Warning Element

Add a dedicated print warning div between the summary table and prejudgment interest section:

```html
<!-- After summary table -->
<div id="print-warning" class="print-only">
  <div class="print-warning-content">
    <h2>DEMONSTRATION MODE - MOCK INTEREST RATES</h2>
    <p>This printout contains <strong>mock interest rates</strong> that differ from actual court order interest rates by ±0.25-1.5%.</p>
    <p>To obtain accurate calculations, purchase the full version at <strong>$24.99</strong>.</p>
  </div>
</div>
<!-- Before prejudgment section -->
```

### 2\. Create CSS for Print Warning

Add styling for the warning element:

```css
/* Screen styles - hidden on screen */
#print-warning {
  display: none;
}

/* Print styles - visible in print */
@media print {
  #print-warning {
    display: block !important;
    margin: 20px 0;
    padding: 15px;
    border: 3px solid #ff0000;
    background-color: white !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  
  #print-warning h2 {
    margin-top: 0;
    text-align: center;
  }
}
```

### 3\. Update Modal Print Button Handler

Modify the "Test Print" button handler in the demo modal:

```javascript
modalElement.querySelector('#demo-modal-print').addEventListener('click', () => {
  // Hide the modal
  restoreModalToPrintOnly();
  
  // Hide the print warning temporarily with inline style
  const printWarning = document.getElementById('print-warning');
  if (printWarning) printWarning.style.display = 'none';
  
  // Print the document
  setTimeout(() => window.print(), 50);
  
  // After a reasonable delay, restore the print warning's default behavior
  setTimeout(() => {
    if (printWarning) printWarning.style.display = '';
  }, 1000); // 1 second should be plenty of time
});
```

### 4\. Initialization in Demo Mode

Add the print warning to the page in the `initializeDemoMode` function if not in paid mode.

## Lessons Learned from First Implementation Attempt

**DOM Position Matters for Print**: Elements won't overlay in print like they do on screen. Print essentially flattens the document into a sequential flow.

**Layer-based Approach Issues**: Our first implementation using separate "modal-layer" didn't position the warning correctly because:

*   Browser print rendering treats positioned elements differently than screen rendering
*   Print makes elements sequential regardless of z-index and position

**Avoid Complexity**: Simpler approaches are more reliable across browsers:

*   Direct DOM insertion/manipulation
*   CSS print media queries
*   Minimal reliance on state tracking

**Browser Print Differences**: Browsers have different print implementations:

*   Some fully apply print styles in preview, others don't
*   Some strip out script-dependent functionality
*   Positioning behavior varies significantly

## Testing Requirements

Test clicking the Print button to ensure:

*   The modal appears on screen
*   After clicking "Test Print", the printout does NOT contain a warning

Test browser-initiated printing (Ctrl+P, right-click print):

*   Verify the warning appears in print preview
*   Verify the warning appears in the actual printout
*   Check that the warning is positioned correctly between tables

Test across browsers:

*   Chrome
*   Firefox
*   Edge
*   Safari (if available)

## Success Criteria

*   Browser-initiated prints (Ctrl+P/right-click) show the warning
*   App-initiated prints (Print button → Test Print) don't show warning in output
*   Warning clearly indicates mock interest rates are being used
*   Warning is positioned correctly between tables
*   Solution works across major browsers
*   Implementation is simple and robust