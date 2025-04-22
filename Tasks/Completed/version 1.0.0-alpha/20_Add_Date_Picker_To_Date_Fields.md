# Task: Add Date Picker to Date Input Fields

## Description
Implement a date picker tool for the three key date input fields in the application:
1. Judgment Date field
2. Prejudgment Interest "from" date field
3. Postjudgment Interest "until" date field

The current implementation uses simple text inputs with YYYY-MM-DD format, which makes it difficult for users to select dates that are separated by multiple years. The new date picker should make it easier to navigate between years and select dates that are far apart.

## Requirements
1. Implement Flatpickr date picker with year dropdown navigation for quick jumps between years
2. Apply the date picker to the three specific date input fields identified in the UI
3. Ensure the date picker integrates with the existing date validation and formatting logic
4. Configure the date picker to optimize for selecting dates that are several years apart
5. Maintain the current date format (YYYY-MM-DD) for consistency
6. Ensure the date picker is styled to match the application's design
7. Preserve all existing date validation functionality

## Implementation Details

### 1. Add Flatpickr Library
- Add Flatpickr via CDN or as a local dependency
- Include the necessary CSS and JavaScript files

### 2. Modify Setup.js
- Enhance the `setupCustomDateInputListeners` function to initialize Flatpickr
- Configure Flatpickr with year dropdown navigation and other optimizations for selecting dates far apart

### 3. Apply to Specific Date Fields
- Apply the date picker to the three identified date input fields:
  - Judgment Date field
  - Prejudgment Interest "from" date field
  - Postjudgment Interest "until" date field
- Ensure the date picker is only applied to these specific fields and not to other date inputs like special damages dates

### 4. Integration with Existing Code
- Ensure the date picker works with the existing date validation and formatting logic
- Make sure the date picker triggers the appropriate recalculation events when dates change
- Maintain compatibility with the current date handling in the application

### 5. Styling and UX Improvements
- Style the date picker to match the application's design
- Ensure the date picker is user-friendly and accessible
- Add appropriate hover and focus states

## Suggested Configuration for Flatpickr
```javascript
flatpickr(".target-date-input", {
  dateFormat: "Y-m-d",
  allowInput: true,
  yearRange: 100, // Show 100 years in dropdown
  positionElement: this,
  static: true,
  onOpen: function(selectedDates, dateStr, instance) {
    // Start in year selection view for faster navigation
    instance.yearElements[0].focus();
  }
});
```

## Testing Criteria
1. Verify that the date picker appears when clicking on each of the three date input fields
2. Test that users can easily navigate between years that are far apart
3. Confirm that selecting a date updates the input field with the correct date in YYYY-MM-DD format
4. Verify that changing a date triggers the appropriate recalculation
5. Test that the date picker works correctly with the existing date validation logic
6. Ensure the date picker is styled consistently with the application's design
7. Verify that the date picker is accessible and works with keyboard navigation

## Notes
- The date picker should be optimized for selecting dates that are separated by multiple years
- The implementation should maintain all existing functionality while adding the date picker enhancement
- Consider adding a clear button or today button for additional user convenience
