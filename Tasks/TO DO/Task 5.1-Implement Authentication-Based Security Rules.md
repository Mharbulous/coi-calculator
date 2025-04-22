# Task 5.1: Implement Authentication-Based Security Rules

## Overview
This subtask involves upgrading the basic security rules implemented in Task 1.6 to authentication-based rules that restrict access to interest rate data only to authenticated and paid users. This ensures that the paywall is properly enforced at the database level.

## Complexity
Simple

## Estimated Time
30 minutes

## Implementation Steps

### 1. Update Firestore Security Rules
1. In the Firebase Console, navigate to the Firestore Database and select the "Rules" tab
2. Replace the existing rules with authentication-based rules:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Interest rates collection - authenticated users only
       match /interestRates/{document=**} {
         allow read: if request.auth != null && 
                       isSubscriptionActive(request.auth.uid);
         allow write: if false; // Admin-only via backend
       }
       
       // Helper function to check if user has active subscription
       function isSubscriptionActive(userId) {
         return exists(/databases/$(database)/documents/subscriptions/$(userId)) &&
                get(/databases/$(database)/documents/subscriptions/$(userId)).data.status == "active";
       }
       
       // User-specific data
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Subscription data - user can read their own subscription
       match /subscriptions/{userId} {
         allow read: if request.auth != null && request.auth.uid == userId;
         allow write: if false; // Admin-only via backend or secure functions
       }
       
       // Default deny for all other collections
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```

### 2. Create a Test Script for Rule Validation
1. Create a simple test script to verify the security rules:
   ```javascript
   // Test authenticated access
   async function testSecurityRules() {
     try {
       // Test 1: Unauthenticated access (should fail)
       await firebase.firestore().collection('interestRates').get();
       console.error('Test 1 failed: Unauthenticated access was allowed');
     } catch (error) {
       console.log('Test 1 passed: Unauthenticated access correctly denied');
     }
     
     try {
       // Test 2: Authenticated but no subscription (should fail)
       await firebase.auth().signInWithEmailAndPassword('test@example.com', 'password');
       await firebase.firestore().collection('interestRates').get();
       console.error('Test 2 failed: Access without subscription was allowed');
     } catch (error) {
       console.log('Test 2 passed: Access without subscription correctly denied');
     }
   }
   ```

### 3. Document Rule Structure and Logic
1. Document the security rule structure in your project documentation
2. Include explanations for:
   - Authentication checks
   - Subscription validation
   - Collection-specific permissions
   - Helper functions

### 4. Verify Rule Compatibility with App Logic
1. Review the auth flow implemented in Task 2
2. Ensure the app correctly handles permission errors
3. Verify that authenticated users with active subscriptions can access rates

## Testing Steps
1. Test with unauthenticated requests (should be denied)
2. Test with authenticated requests but no subscription (should be denied)
3. Test with authenticated requests with active subscription (should be allowed)
4. Verify admin operations through Firebase Console still work
5. Test edge cases like expired subscriptions or deleted users

## Expected Outcome
By the end of this subtask, you should have:
1. Updated security rules that enforce authentication-based access control
2. A subscription verification mechanism within the rules
3. A test script to validate the rules are working correctly
4. Documentation of the rule structure and logic

## Notes
- Security rules are evaluated on the server-side and cannot be bypassed by client-side code
- Consider implementing rate limiting in Task 5.2 to prevent abuse
- These rules assume a subscriptions collection where user subscription status is stored
- Helper functions in security rules are powerful but have limitations - avoid complex logic
- Rules should be thoroughly tested in development before deploying to production
