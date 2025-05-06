# Task 60.3: Update DOM Handling for Enhanced Payment Display

## Goal
Update UI components to properly display the enhanced payment information, ensuring that the payment rows in the table visually represent the interest and principal allocation as shown in the documentation examples.

## Tasks
1. Modify the payment row UI in `dom/payments.js` to:
   - Show the split between interest and principal
   - Format the display according to the examples
   - Maintain consistent styling with other table rows

2. Update how payment rows are rendered in the interest table:
   - Support displaying both principal and interest components
   - Ensure proper alignment of numbers in columns
   - Add CSS classes for consistent styling

3. Enhance UI alignment with the business logic:
   - Ensure payment rows visually indicate their effect on calculations
   - Update tooltip content to explain payment application logic
   - Maintain responsiveness and print formatting

## Implementation Details
- Revise the `insertPaymentRow()` and `insertPaymentRowFromData()` functions to display both principal and interest components
- Update the DOM structure for payment rows to match the required format
- Ensure proper numerical alignment for currency values
- Add helper functions for rendering formatted payment information

## Verification Method
- Visual inspection of the payment row format in the table
- Compare with the example in `insert_pay_example.html`
- Verify correct alignment of numbers and text in columns

## Dependencies
- Depends on completion of Task 60.2
- Uses DOM utilities from `domUtils.js`
- Utilizes currency formatters from `utils.currency.js`

## Acceptance Criteria
- [ ] Payment rows show separate columns for interest and principal amounts
- [ ] The UI matches the example shown in the documentation
- [ ] Currency values are properly aligned and formatted
- [ ] The table maintains proper styling and layout with new payment row format
- [ ] Responsive design and print layouts handle the new format correctly

## Estimated Complexity
Medium

## Priority
Medium-High
