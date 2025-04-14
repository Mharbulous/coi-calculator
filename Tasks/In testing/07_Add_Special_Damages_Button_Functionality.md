# Add Functionality to "Add Special Damages" Button

## Description
Implement functionality for the "add special damages" button in the Prejudgment interest table. When users click this button, a new special damages row should be added immediately below the row that contained the clicked button.

## Requirements

1. When the "add special damages" button is clicked in a row of the Prejudgment interest table:
   - A new special damages row should be inserted immediately below the current row
   - The new row should follow the format shown in the mockup.md file (with empty cells for Rate and Interest)
   - The Date cell should be pre-populated with the date from the row where the button was clicked
   - The Description cell should be empty initially
   - When the Description cell is empty, it should display placeholder text "Describe special damages here"
   - The Principal/Amount cell should be empty initially

2. The new row should be properly integrated into the calculation flow:
   - When values are entered, they should be included in subsequent interest calculations
   - The row should be properly formatted according to the table's styling

3. User Experience:
   - The button should provide visual feedback when clicked
   - The newly added row should be visually highlighted briefly to draw attention
   - Focus should automatically move to the Description field of the new row

## Technical Implementation Notes

1. Modify the `updateInterestTable` function in domUtils.js to implement the button click handler
2. Create a helper function to insert a new special damages row at the specified position
3. Update the CSS to include styles for the placeholder text in empty Description cells
4. Ensure the new row is properly integrated with the calculation logic in calculations.js

## Testing

1. Test that clicking the button adds a new row in the correct position
2. Test that the date is correctly pre-populated
3. Test that the placeholder text appears when the Description is empty
4. Test that entering values in the new row correctly affects subsequent calculations
5. Test the feature across different browsers to ensure compatibility

## Priority
Medium

## Estimated Effort
4-6 hours
