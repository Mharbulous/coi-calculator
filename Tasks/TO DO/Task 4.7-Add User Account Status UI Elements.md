# Task 4.7: Add User Account Status UI Elements

## Overview
This task focuses on implementing UI elements that indicate the user's account status, subscription details, and access rights throughout the Court Order Interest Calculator application. These elements will provide clear visual feedback about the user's current access level and payment status.

## Complexity
Simple

## Estimated Time
30 minutes

## Implementation Steps

### 1. Design Account Status Indicators
1. Create UI elements to display account status:
   - Access level indicator (free/paid/premium)
   - Subscription status badge (active/expired)
   - Expiration date counter for subscriptions
   - Visual differentiation between authenticated and unauthenticated users
   - Icon system to represent different access levels

### 2. Implement Header Account Display
1. Add account information to the calculator header:
   - User name/email display
   - Account type badge
   - Dropdown menu for account actions
   - Quick access to payment history
   - Visual indicator of remaining subscription time

### 3. Create Access-Restricted Feature Indicators
1. Implement UI elements to indicate which features require payment:
   - Lock icons on premium features
   - Tooltips explaining access requirements
   - Clear visual differentiation between free and premium features
   - Upgrade prompts when attempting to access restricted features
   - Preview mode for limited demonstration of premium features

### 4. Implement Account Management Panel
1. Create an account management section:
   - Current plan details
   - Payment history
   - Receipt access
   - Subscription management options
   - Account settings
   - Password change functionality
   - Email preferences

### 5. Add Persistent Login Status
1. Implement persistent login status indicators:
   - Remember login state between sessions
   - Show login status in header at all times
   - Add logout button/option
   - Display session timeout warnings
   - Implement silent token refresh

### 6. Create Low-Friction Upgrade Path
1. Add upgrade prompts and paths:
   - Non-intrusive upgrade suggestions
   - One-click renewal for expiring subscriptions
   - Special offer notifications when relevant
   - Clear CTAs for upgrading from free to paid tiers
   - Account upgrade benefits summary

## Testing Procedures
- Verify all status indicators correctly reflect user account state
- Test login persistence across page refreshes and browser sessions
- Ensure account dropdown and management panel display correctly
- Test that restricted feature indicators appear appropriately
- Verify upgrade paths work as expected
- Test with different account states (free, paid, expired)

## Expected Outcome
1. Clear visual indicators of account status throughout the application
2. Intuitive account management interface
3. Persistent login status with appropriate security measures
4. Seamless upgrade paths for users on lower tiers
5. Consistent design language for all account-related UI elements

## Notes
- Ensure account status indicators are noticeable but not distracting
- Balance marketing upgrade opportunities with good user experience
- Consider accessibility in all status indicators and colors
- Design for both new and returning users
- Ensure all account-related UI elements are responsive for different screen sizes
- Consider user privacy when displaying account information
