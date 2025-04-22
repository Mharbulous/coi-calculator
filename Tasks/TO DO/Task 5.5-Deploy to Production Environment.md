# Task 5.5: Deploy to Production Environment

## Overview
This subtask focuses on finalizing the Firebase paywall implementation and deploying it to the production environment. This includes pre-deployment checks, configuring production-specific settings, and implementing a deployment strategy that minimizes disruption to users.

## Complexity
Simple

## Estimated Time
30 minutes

## Implementation Steps

### 1. Prepare Production Configuration
1. Create a separate production-specific Firebase configuration:
   ```javascript
   // firebase.production.config.js
   const firebaseConfig = {
     apiKey: "PRODUCTION_API_KEY",
     authDomain: "production-app.firebaseapp.com",
     projectId: "production-app",
     storageBucket: "production-app.appspot.com",
     messagingSenderId: "PRODUCTION_SENDER_ID",
     appId: "PRODUCTION_APP_ID",
     measurementId: "PRODUCTION_MEASUREMENT_ID"
   };
   
   export default firebaseConfig;
   ```

2. Set up environment-based configuration switching:
   ```javascript
   // firebase.config.js
   import devConfig from './firebase.dev.config.js';
   import prodConfig from './firebase.production.config.js';

   const config = process.env.NODE_ENV === 'production' ? prodConfig : devConfig;
   export default config;
   ```

### 2. Finalize Security Rules for Production
1. Review and update Firestore security rules for production:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Production-ready interest rates access
       match /interestRates/{document=**} {
         allow read: if request.auth != null && 
                      isSubscriptionActive(request.auth.uid) &&
                      isNotRateLimited();
         allow write: if false; // Admin-only via backend
       }
       
       // Helper functions
       function isSubscriptionActive(userId) {
         return exists(/databases/$(database)/documents/subscriptions/$(userId)) &&
                get(/databases/$(database)/documents/subscriptions/$(userId)).data.status == "active" &&
                get(/databases/$(database)/documents/subscriptions/$(userId)).data.expiresAt > request.time;
       }
       
       function isNotRateLimited() {
         // Production rate limiting with higher thresholds
         let recentRequests = firestore.get(/databases/$(database)/documents/rateLimit/$(request.auth.uid)).data.count || 0;
         return recentRequests < 300;  // Higher limit for production
       }
       
       // User-specific data
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Subscriptions
       match /subscriptions/{userId} {
         allow read: if request.auth != null && request.auth.uid == userId;
         allow write: if false; // Admin-only
       }
       
       // Default deny
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```

### 3. Verify Production Data
1. Import interest rate data to production database:
   - Ensure all interest rates have been properly migrated from development
   - Verify formatting and date ranges
   - Confirm all required interest rate periods are included

2. Set up production user accounts:
   - Create admin account(s) for managing the system
   - Test subscription management processes 
   - Verify payment integration with production payment gateway

### 4. Configure Error Monitoring
1. Ensure production-specific logging is configured:
   ```javascript
   // Configure production-specific error handling
   if (process.env.NODE_ENV === 'production') {
     // Disable verbose logs
     console.log = function() {};
     console.debug = function() {};
     
     // Capture and report errors
     window.addEventListener('error', (event) => {
       // Send to logging service
       logEvent(analytics, 'production_error', {
         error: event.error?.message || 'Unknown error',
         url: window.location.href
       });
       
       // Display user-friendly error message
       showErrorMessage('An unexpected error occurred. Please try again later.');
     });
   }
   ```

### 5. Implement Deployment Strategy
1. Choose a deployment approach:
   - Phased Rollout: Deploy to a percentage of users first
   - Blue-Green Deployment: Maintain two production environments
   - Feature Flags: Enable features incrementally

2. Set up Firebase Hosting for production:
   ```bash
   # Build the production version
   npm run build
   
   # Configure Firebase to use production project
   firebase use production
   
   # Deploy to Firebase Hosting
   firebase deploy --only hosting
   ```

3. Set up release channels for controlled rollout:
   ```bash
   # Deploy to a preview channel first
   firebase hosting:channel:deploy pre-release
   
   # Later promote to production
   firebase hosting:clone pre-release live
   ```

### 6. Document Production Environment
1. Create comprehensive documentation for the production environment:
   - System architecture
   - Configuration details
   - Security measures
   - Monitoring setup
   - Backup and recovery procedures
   - Contact information for support

2. Create an incident response plan:
   - Define severity levels
   - Establish notification procedures
   - Document troubleshooting steps
   - List emergency contacts

## Testing Steps
1. Verify the application works with production configuration
2. Test the production payment gateway with real transactions
3. Verify authentication flows in the production environment
4. Check that interest rates are being properly fetched and cached
5. Test error handling and reporting in production mode
6. Verify analytics are capturing data correctly

## Expected Outcome
By the end of this subtask, you should have:
1. A fully deployed production environment with paywall functionality
2. Production-specific security rules and configurations
3. Complete documentation of the production setup
4. Verified payment processing in the production environment
5. Monitoring and analytics properly configured for production

## Notes
- Always maintain separate development and production environments
- Never use development API keys in production
- Consider using a CI/CD pipeline for automated deployments
- Monitor usage after deployment to catch any issues early
- Have a rollback plan ready in case of critical issues
- Schedule regular security reviews for production environment
- Consider implementing A/B testing to optimize conversion rates
- Create a maintenance schedule for updating dependencies
