# Task 60.6: Integration with Post-Judgment Table

## Goal
Extend the payment insertion implementation to handle payments in the post-judgment interest table, ensuring consistent processing between pre and post-judgment tables and proper handling of edge cases.

## Tasks
1. Update logic to determine which table a payment belongs to:
   - Implement proper comparison between payment date and judgment date
   - Handle edge cases where payments occur exactly on the judgment date
   - Ensure consistent routing of payments to the correct table

2. Ensure consistent processing between pre and post-judgment tables:
   - Adapt the payment insertion algorithm to work with both tables
   - Handle differences in interest calculation methods between tables
   - Maintain consistent payment application logic (interest first, then principal)

3. Implement table-specific handling where needed:
   - Account for potential differences in interest rate determination
   - Handle table-specific principal tracking
   - Implement table transition logic for payments on the judgment date

## Implementation Details
- Add judgment date validation and comparison
- Implement routing logic for payment insertion
- Extend recalculation functions to handle both tables
- Add cross-table validation for cases where payments affect both tables

## Verification Method
- Add a payment after judgment date and verify it appears in the post-judgment table
- Console output indicating table assignment:
  ```
  Payment dated 2022-05-15 inserted into postjudgment table
  ```
- Visual confirmation that payment displays correctly in the appropriate table

## Dependencies
- Depends on completion of Tasks 60.1-60.5
- Requires understanding of differences between prejudgment and postjudgment interest calculations

## Acceptance Criteria
- [ ] Payments are correctly routed to either prejudgment or postjudgment table based on date
- [ ] Both tables handle payments with consistent application logic
- [ ] Edge cases (payments on judgment date) are properly handled
- [ ] Consistent UI representation across both tables
- [ ] Console messages clearly indicate which table each payment is inserted into

## Estimated Complexity
Medium-High

## Priority
Low (can be implemented after the prejudgment table implementation is stable)

## Future Enhancements
- Consider implementing logic for handling payments that span both tables
- Add validation for payments near the judgment date boundary
- Implement warning messages for payments that affect judgment transitions
