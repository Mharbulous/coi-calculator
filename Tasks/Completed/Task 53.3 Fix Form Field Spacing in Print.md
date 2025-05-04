# Task 53.3: Fix Form Field Spacing in Print

## Overview

This task addresses the inconsistency between the screen and print versions of the form field spacing in the header area (jurisdiction, file no, and registry fields). While the spacing in the screen version is correct, the print version shows a more compressed layout. This affects the vertical spacing and overall appearance in the printed output, disrupting the WYSIWYG (What You See Is What You Get) experience.

## Current State

- Screen version: Proper spacing between form fields (already correct)
- Print version: Condensed/compressed spacing (needs adjustment)

The header form fields appear more tightly spaced in the print preview compared to the screen version.

## Implementation

Add print-specific rules to ensure the form field spacing in print matches the screen version:

```css
/* Add to an appropriate CSS file with print media queries, such as print.css */

@media print {
  /* Preserve the form field spacing from the screen version */
  .right-field {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 10px; /* Ensure consistent spacing between fields */
  }
  
  /* Ensure field margins match screen version */
  .right-field .label {
    margin-right: calc(var(--spacing-unit) * 2); /* 8px - match screen version */
  }
  
  /* Maintain spacing in the field row */
  .field-row {
    margin-bottom: 10px; /* Add consistent bottom margin */
  }
}
```

This CSS should be added to the appropriate file that handles print styles. Look for existing `@media print` blocks, possibly in print.css or forms.css.

## Verification Steps

After implementing the changes:

1. First verify the screen version looks correct with properly spaced form fields
2. Use Print Preview (Ctrl+P or browser print functionality) to verify the spacing in print mode
3. Compare both views side by side to ensure consistency
4. Check specifically that:
   - The space between Jurisdiction, File No., and Registry fields is consistent
   - The right alignment of labels and fields is maintained
   - The overall layout matches the screen version
5. Verify that the overall header area has the same visual rhythm in both modes

## Potential Issues to Watch For

1. **CSS Variables in Print**: Some browsers may handle CSS variables differently in print. Ensure that `var(--spacing-unit)` is properly interpreted in print media.

2. **Print Style Conflicts**: Look for any existing print styles that might be causing the compression. These could be overriding the default spacing.

3. **Scaling Issues**: Print scaling can affect spacing. Test with different scale settings.

4. **Page Width Differences**: Print layouts often have different available widths than screen layouts, which can affect flex positioning. Ensure the flex properties work properly in print.

5. **Inheritance Problems**: Make sure the print styles aren't being overridden by more specific selectors. You may need to increase specificity or use `!important` as a last resort.

## Related Changes

This change is part of Task 53 which added the Clear button with reset functionality. While that task focused on the button itself, these follow-up tasks ensure consistent WYSIWYG experience between screen and print versions.

## Expected Outcome

The form fields in the header area (jurisdiction, file no, and registry) should have consistent spacing in both screen and print views, ensuring that the vertical rhythm and overall layout appear identical in both viewing modes.

## Implementation Notes

- This change only affects the print view - we're not modifying the screen view at all since it's already correct.
- The goal is to make the printed form fields match the spacing of the screen version, improving the WYSIWYG experience.
- Pay special attention to the vertical spacing between the three right-aligned fields (Jurisdiction, File No., Registry) as these showed the most noticeable compression in print.
