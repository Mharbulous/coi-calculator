# Step 4: Add CSS for Payment UI

## Overview
This step involves creating the CSS styles for the payment screen. The styles should be consistent with the existing application design while providing a professional and trustworthy payment experience.

## Implementation Details

### Create a New File
Create a new CSS file named `payment-screen.css` in the BC COIA calculator/styles/components directory.

### Style Components
The CSS file should include styles for:

1. **Payment Screen Container**:
   - Full-screen overlay
   - Proper z-index to appear above calculator
   - Background with slight opacity
   - Centered content

2. **Payment Form Container**:
   - Clean, professional card design
   - Appropriate padding and margins
   - Box shadow for depth
   - Responsive sizing

3. **Form Elements**:
   - Input fields with consistent styling
   - Labels with clear typography
   - Focus states for accessibility
   - Error states for validation

4. **Payment Options**:
   - Pricing display
   - Feature list styling
   - Selected state for options

5. **Buttons**:
   - Primary action button (Pay)
   - Loading state for processing
   - Disabled state
   - Hover and focus effects

6. **Status Messages**:
   - Success message styling
   - Error message styling
   - Loading indicator

7. **Responsive Design**:
   - Mobile-friendly layout
   - Adjustments for different screen sizes
   - Touch-friendly input sizes on mobile

### Design Considerations
- Use the existing color scheme from the calculator
- Ensure high contrast for readability
- Create a sense of security and professionalism
- Use subtle animations for state changes

### CSS Organization
- Use BEM (Block Element Modifier) naming convention
- Group related styles together
- Include comments for complex sections
- Use CSS variables for consistent colors and spacing

## Integration Points
- The CSS file will be linked in the main HTML file
- It will be used by the Payment UI module
- It should work alongside existing styles without conflicts

## Browser Compatibility
- Ensure styles work in modern browsers
- Include appropriate vendor prefixes where needed
- Test on different devices and screen sizes
