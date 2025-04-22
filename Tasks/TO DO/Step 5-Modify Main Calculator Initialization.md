# Step 5: Modify Main Calculator Initialization

## Overview
This step involves modifying the main calculator initialization code to integrate the paywall system. The changes will ensure that the calculator is only accessible to users who have paid, while maintaining the existing functionality for authorized users.

## Implementation Details

### Modify Existing File
Update the `calculator.ui.js` file in the BC COIA calculator directory to integrate the paywall system.

### Changes to Make

1. **Import New Modules**:
   - Add imports for the Access Control module
   - Add imports for the Payment Processor module
   - Add imports for the Payment UI module

2. **Modify Initialization Flow**:
   - Split the initialization function into two parts:
     - Main initialization function that checks access
     - Core initialization function that sets up the calculator

3. **Access Control Integration**:
   - Add a check at the beginning of initialization to verify payment
   - Show payment screen if user hasn't paid
   - Only initialize calculator if user has access

4. **Event Listeners**:
   - Add listener for the 'payment-completed' event
   - Initialize calculator when payment is successful
   - Handle any cleanup needed after payment

### Initialization Flow
The new initialization flow should be:
1. Initialize payment processor
2. Initialize payment UI
3. Check if user has access
4. If no access, show payment screen and wait for payment
5. If user has access (or after successful payment), initialize calculator

### Preserve Existing Functionality
Ensure that all existing calculator functionality works correctly:
- All event listeners should still be set up
- Default values should still be applied
- UI components should be initialized properly
- Calculations should work as before

## Integration Points
- The modified file will import the new modules
- It will check access status before initializing the calculator
- It will listen for payment events from the Payment UI module

## Testing Considerations
- Test both paid and unpaid user flows
- Verify that calculator works correctly after payment
- Check that existing functionality is preserved
- Test with different payment scenarios (success, failure, etc.)
