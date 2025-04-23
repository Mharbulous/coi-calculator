# Task 4.7: Add User Account Status UI Elements with Upgrade Pathways

## Overview
This task involves creating UI elements to display user account status and implementing strategic upgrade pathways throughout the application. You'll add status indicators that show whether a user is in demo or paid mode, and create compelling upgrade calls-to-action that encourage users to transition from the demo to the paid version.

## Complexity
Medium (increased from Simple due to upgrade pathways implementation)

## Estimated Time
1 hour (increased from 30 minutes to accommodate upgrade pathways)

## Implementation Steps

### 1. Create Account Status Indicator
1. Design and implement an account status indicator in the application header
   - Show "Demo Mode" or "Paid Account" based on current mode
   - Include subscription expiry date for paid accounts
   - Style differently based on account status
2. Add a dropdown menu for account-related actions
   - Include options like "View Account", "Manage Subscription"
   - Show different options based on current mode

### 2. Implement Strategic Upgrade Buttons
1. Add header upgrade button
   - Place near the application title or main navigation
   - Use attention-grabbing but non-disruptive styling
   - Include clear call-to-action text like "Get Accurate Rates"
2. Add summary table upgrade call-to-action
   - Place at the bottom of the summary table
   - Emphasize the importance of accurate calculations for legal documents
   - Style to stand out from the table content
3. Add footer upgrade section
   - Create a prominent section at the bottom of the page
   - Include compelling messaging about the benefits of upgrading
   - Style with distinctive border or background

### 3. Implement Feature Limitation Indicators
1. Add visual indicators next to features that are limited in demo mode
   - Add badges or labels next to jurisdiction selector
   - Display tooltips explaining limitations when hovering
2. Create a modal for feature limitation notifications
   - Design a modal that appears when users attempt to use limited features
   - Include options to upgrade or continue with limited functionality
   - Implement logic to reset to available options when in demo mode

### 4. Enhance Upgrade Source Tracking
1. Implement tracking for upgrade attempt sources
   - Add data attributes to all upgrade buttons
   - Create a tracking system for conversion analytics
   - Pass source information to payment processing
2. Add methods to record upgrade attempts in analytics
   - Track which CTAs are most effective
   - Record conversion rates from different sources

### 5. Integrate with Payment Processing
1. Update payment modal to display source-specific messaging
   - Show different benefits based on where the upgrade was initiated
   - Tailor the payment flow to the user's previous actions
2. Add upgrade source parameter to payment processing
   - Pass source information through to payment completion
   - Use for post-purchase analytics

### 6. Create Account Status Panel
1. Design an account status panel that shows detailed information
   - Include subscription status, payment history, and access rights
   - Show different information for demo and paid users
   - Add renewal options for paid users

## Testing Procedures
1. Test all upgrade buttons to ensure they trigger the payment modal
2. Verify account status indicator accurately reflects current mode
3. Test feature limitation indicators with various user interactions
4. Verify tracking parameters are correctly passed to analytics and payment processing
5. Test UI appearance in both demo and paid modes

## Expected Outcome
1. Clear account status indicators in the application interface
2. Strategic upgrade buttons and CTAs throughout the application
3. Visual indicators for limited features in demo mode
4. Complete tracking system for upgrade attempts
5. Tailored payment experience based on upgrade source

## Notes
- The upgrade CTAs should be noticeable without being annoying or predatory
- CTAs should be designed with clear value propositions, not just "Upgrade Now" buttons
- All upgrade elements should be automatically hidden in paid mode
- The implementation should focus on conversion through value demonstration, not through restriction
- This task integrates requirements from Task A.5 (Implement Upgrade Pathways)
