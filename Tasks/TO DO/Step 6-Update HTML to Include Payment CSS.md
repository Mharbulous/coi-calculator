# Step 6: Update HTML to Include Payment CSS

## Overview
This step involves updating the main HTML file to include the new payment screen CSS. This ensures that the payment UI is properly styled when displayed to users.

## Implementation Details

### Modify Existing File
Update the `index.html` file in the BC COIA calculator directory to include the new CSS file.

### Changes to Make

1. **Add CSS Link**:
   - Add a link element in the head section to include the payment screen CSS
   - Place it after the main CSS file but before any JavaScript imports
   - Use a relative path to the new CSS file

2. **Ensure Proper Loading Order**:
   - The payment CSS should load after the main styles
   - This allows payment styles to override base styles if needed
   - Maintain the existing CSS loading order for other files

### Example Addition
Add the following line to the head section of the HTML file:
```html
<link rel="stylesheet" href="styles/components/payment-screen.css">
```

### Placement
The link should be placed:
- After the main CSS file (`<link rel="stylesheet" href="styles/main.css">`)
- Before the Flatpickr CSS (if present)
- Before any JavaScript imports

### Verify Loading
After adding the link:
- Check browser developer tools to ensure the CSS file loads correctly
- Verify there are no 404 errors for the CSS file
- Confirm the styles are applied to the payment screen

## Integration Points
- The HTML file will include the new CSS file
- The CSS will be used by the payment UI components
- The styles will be applied when the payment screen is shown

## Testing Considerations
- Test in different browsers to ensure CSS compatibility
- Verify that styles are applied correctly to the payment screen
- Check that existing calculator styles are not affected
- Test responsive design on different screen sizes
