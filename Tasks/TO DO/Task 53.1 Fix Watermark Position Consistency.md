# Task 53.1: Fix Watermark Position Consistency

## Overview

This task addresses the inconsistency between the screen and print versions of the DEMONSTRATION watermark position. Currently, the watermark has been adjusted to 140px margin-top for the screen version, but the print version still uses the original 100px margin-top value. This inconsistency affects the WYSIWYG (What You See Is What You Get) experience.

## Current State

- Screen version: `margin-top: 140px` (already updated)
- Print version: `margin-top: 100px` (needs to be updated)

This discrepancy is visible when comparing the screen version to the print preview.

## Implementation

Update the print media query in the `demo-mode.css` file to match the screen version's watermark positioning:

```css
/* In demo-mode.css */

@media print {
  #main-demo-watermark {
    margin-top: 140px; /* Update from 100px to 140px to match screen version */
    /* Keep other properties unchanged */
    position: absolute;
    top: 50%;
    left: 50%;
    page-break-inside: avoid;
    page-break-after: always;
  }
}
```

## Verification Steps

After implementing the changes:

1. First verify the screen version looks correct with the Clear button properly positioned
2. Use Print Preview (Ctrl+P or browser print functionality) to verify the watermark position in print mode
3. Compare both views side by side to ensure consistency
4. Check that the watermark is positioned at the same relative location in both versions 
5. Verify the watermark is still visible and legible in print output

## Potential Issues to Watch For

1. **Duplicate Rules**: The demo-mode.css file has duplicate media query blocks for `#main-demo-watermark`. Make sure to update both instances to avoid inconsistencies:

```css
/* There are two identical blocks in the file: */
@media print {
  #main-demo-watermark {
    position: absolute; 
    top: 50%;
    left: 50%;
    margin-top: 100px; /* Update this value in BOTH instances */
    page-break-inside: avoid;
    page-break-after: always;
  }
}
```

2. **Print Scaling**: Browser print scaling might affect the actual positioning. Test with different scaling options.

3. **Browser Compatibility**: Different browsers may handle print CSS differently. Test in multiple browsers if possible.

4. **Page Breaks**: Ensure that changing the margin-top doesn't push the watermark across page boundaries in printed output.

5. **Opacity Issues**: Verify that the watermark opacity is maintained in print (some browsers handle opacity differently in print).

## Related Changes

This change is part of Task 53 which added the Clear button with reset functionality. The watermark position was adjusted to accommodate the increased spacing between the title and summary table due to the addition of the Clear button.

## Expected Outcome

The DEMONSTRATION watermark should appear in the same position relative to page content in both screen and print views, maintaining a consistent WYSIWYG experience while preserving the clear visibility of the watermark.
