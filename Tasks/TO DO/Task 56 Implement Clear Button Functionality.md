# Task 56 Implement Clear Button Functionality

## Overview
Implement functionality for the Clear button that will allow users to reset all editable fields in the calculator. When the Clear button is clicked, a confirmation modal will appear asking the user to confirm before proceeding with the reset operation.

## Requirements

### 1. Confirmation Modal
- Create a confirmation modal that appears when the Clear button is clicked
- The modal should match the style and appearance of the existing special damages deletion confirmation modal
- The modal should clearly explain what data will be cleared:
  - All dates
  - Special damage descriptions
  - Dollar amounts
  - Special damage rows
- Include "Cancel" and "Clear" buttons in the modal
- Allow users to dismiss the modal by clicking outside it or pressing the Escape key

### 2. Data Clearing Implementation
- When user confirms, clear all editable fields in the application (fields with light blue background)
- Do NOT clear the Jurisdiction dropdown (which doesn't have a light blue background)
- Do NOT clear the Registry or File No. fields
- Clear the following data types:
  - All date fields
  - All dollar amount fields
  - All special damage descriptions
  - Delete all special damage rows
- Ensure proper cleanup of special damage rows:
  - Destroy associated Flatpickr datepicker instances
  - Remove rows from the DOM
  - Update the store to remove the data

### 3. Button Appearance States
- Implement two visual states for the Clear button:
  - Active state (when data exists): Red background with white text
  - Disabled state (when all fields are empty): Gray background with black text
- The button should automatically update its appearance based on the current state of the form

### 4. State Detection
- Create logic to detect if any editable fields contain data by checking:
  - All editable text input fields
  - Existence of special damage rows
  - Store state for non-zero monetary values
  - Store state for special damages array
- Update the button appearance whenever form data changes

### 5. Integration
- Add Clear button event listener during application initialization
- Register state update listeners for input changes and special damages updates
- Ensure clearing triggers appropriate recalculations and UI updates

## Technical Considerations

### File Structure Changes
1. **Modal Implementation**: Add new confirmation modal function to `modal.js`
2. **Button Logic**: Create a new module file `dom/clearButton.js` to contain all clear button functionality
3. **CSS Updates**: Add disabled state styling to `styles/components/action-button.css`
4. **Integration**: Modify `calculator.ui.js` to incorporate the clear button handling

### Performance Considerations
- Ensure all special damage row deletion properly cleans up Flatpickr instances to prevent memory leaks
- Use the existing Zustand store's reset functionality rather than manually resetting all state
- Optimize event listeners to prevent redundant updates

### User Experience
- Make the confirmation dialog clear about the consequences of the action
- Ensure the disabled button state provides clear visual feedback
- Maintain consistent styling with existing UI elements

## Accessibility
- Ensure the confirmation modal is keyboard accessible
- Focus the Clear button in the modal for keyboard users
- Use appropriate aria attributes for screen readers

## Testing
- Test clearing with various combinations of filled fields
- Verify the button state properly updates based on form state
- Confirm special damage rows are completely removed without memory leaks
- Test keyboard navigation in the confirmation modal

## Acceptance Criteria
- Users can click the Clear button to see a confirmation modal
- When confirmed, all editable fields are reset to blank
- All special damage rows are removed
- The Clear button appears gray with black text when no editable data exists
- The Clear button appears red with white text when editable data exists
- Jurisdiction dropdown, Registry, and File No. remain unchanged
- After clearing, the calculator UI updates properly with recalculated values
