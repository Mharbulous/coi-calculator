# Task 5.2: Configure Rate Limiting and Abuse Prevention

## Overview
This subtask focuses on implementing rate limiting and abuse prevention mechanisms for the Firebase services to protect against excessive usage, brute force attacks, and other potential security threats. These measures help maintain service availability and secure user data.

## Complexity
Simple

## Estimated Time
30 minutes

## Implementation Steps

### 1. Set Up Firebase App Check
1. Navigate to the Firebase Console and select "App Check" from the Build menu
2. Enable App Check for your project
3. Configure App Check providers:
   - For Web: Set up reCAPTCHA v3
   - Optionally configure other providers for additional platforms
4. Update the Firebase SDK initialization code:
   ```javascript
   import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

   // Initialize Firebase App Check
   const appCheck = initializeAppCheck(app, {
     provider: new ReCaptchaV3Provider('RECAPTCHA_SITE_KEY'),
     isTokenAutoRefreshEnabled: true
   });
   ```

### 2. Enhance Security Rules with Rate Limiting
1. Update the Firestore security rules to include rate limiting:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Rate limiting function
       function isNotRateLimited() {
         let recentRequests = firestore.get(/databases/$(database)/documents/rateLimit/$(request.auth.uid)).data.count || 0;
         return recentRequests < 100;  // Limit to 100 requests per time window
       }
       
       // Interest rates collection - with rate limiting
       match /interestRates/{document=**} {
         allow read: if request.auth != null && 
                      isSubscriptionActive(request.auth.uid) &&
                      isNotRateLimited();
         allow write: if false;
       }
       
       // Helper function to check if user has active subscription
       function isSubscriptionActive(userId) {
         return exists(/databases/$(database)/documents/subscriptions/$(userId)) &&
                get(/databases/$(database)/documents/subscriptions/$(userId)).data.status == "active";
       }
       
       // Rest of the rules remain the same...
     }
   }
   ```

### 3. Implement Firebase Functions for Rate Tracking
1. Set up a Cloud Function to track and limit request rates:
   ```javascript
   // Example Cloud Function to track user request rates
   exports.trackRequestRate = functions.https.onCall(async (data, context) => {
     // Ensure user is authenticated
     if (!context.auth) {
       throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
     }
     
     const uid = context.auth.uid;
     const rateRef = admin.firestore().collection('rateLimit').doc(uid);
     
     // Track request in a transaction
     return admin.firestore().runTransaction(async (transaction) => {
       const doc = await transaction.get(rateRef);
       const now = Date.now();
       const windowStart = now - (15 * 60 * 1000); // 15 minute window
       
       let newCount;
       if (!doc.exists || !doc.data().timestamp || doc.data().timestamp < windowStart) {
         // Reset counter for new window
         newCount = 1;
       } else {
         // Increment counter
         newCount = (doc.data().count || 0) + 1;
       }
       
       transaction.set(rateRef, {
         count: newCount,
         timestamp: now
       });
       
       return { count: newCount };
     });
   });
   ```

### 4. Add Client-Side Error Handling for Rate Limits
1. Implement client-side handling for rate limit errors:
   ```javascript
   async function fetchInterestRates() {
     try {
       const ratesSnapshot = await firebase.firestore().collection('interestRates').get();
       return ratesSnapshot.docs.map(doc => doc.data());
     } catch (error) {
       // Check if it's a rate limit error
       if (error.code === 'resource-exhausted' || 
           (error.code === 'permission-denied' && error.message.includes('rate'))) {
         console.error('Rate limit exceeded. Please try again later.');
         // Show appropriate message to user
         displayRateLimitMessage();
       } else {
         console.error('Error fetching rates:', error);
         // Handle other errors
       }
       return null;
     }
   }
   ```

### 5. Configure Firebase Authentication Limits
1. In the Firebase Console, navigate to Authentication > Settings
2. Configure the following settings:
   - Email/Password Sign-in: Enable prevention of multiple accounts creation
   - Multi-factor Authentication: Consider enabling for admin accounts
   - Email link sign-in: Configure domain allowlist if needed
   - Set reasonable session duration limits

## Testing Steps
1. Test App Check integration by monitoring requests in Firebase Console
2. Simulate rapid requests to test rate limiting functionality
3. Test authentication limits by attempting multiple sign-in attempts
4. Verify error handling works correctly for rate-limited scenarios
5. Test with and without App Check to ensure it's properly enforced

## Expected Outcome
By the end of this subtask, you should have:
1. App Check integration to prevent unauthorized API usage
2. Rate limiting rules implemented in Firestore
3. Request tracking mechanism via Cloud Functions
4. Client-side handling for rate limit errors
5. Configured authentication security settings

## Notes
- Rate limits should be adjusted based on expected legitimate usage patterns
- Consider implementing progressive rate limiting (gradually restricting access as usage increases)
- App Check is not 100% secure but provides a good layer of protection against automated abuse
- Store rate limit counters in a separate collection for better performance
- Monitor usage patterns after implementation to fine-tune limits
- Cloud Functions might incur additional costs beyond Firebase free tier
