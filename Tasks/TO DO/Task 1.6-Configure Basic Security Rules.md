# Task 1.6: Configure Basic Security Rules

## Overview
This subtask involves configuring security rules for the Firestore database to control access to the interest rates data, supporting both authenticated access to real rates and unauthenticated access to demo rates. Proper security rules are essential to ensure data integrity and implement the demo/paid access model.

## Complexity
Simple

## Estimated Time
30 minutes (increased from 15 minutes to accommodate demo mode security rules)

## Implementation Steps

### 1. Access Firebase Security Rules
1. In the Firebase Console, navigate to Firestore Database
2. Select the "Rules" tab to access the security rules editor

### 2. Configure Dual-Mode Access Rules
1. Update the security rules to implement the demo/paid access model:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow demo rates to be read by anyone (unauthenticated)
       match /interestRates/{docId} {
         allow read: if docId.matches(".*_demo$") || docId == "metadata";  // Allow reading demo docs and metadata
         allow write: if false;  // No write access from client
       }
       
       // Allow real rates to be read only by authenticated users
       match /interestRates/{docId} {
         allow read: if request.auth != null && !docId.matches(".*_demo$");  // Authenticated access to real rates
         allow write: if false;  // No write access from client
       }
       
       // Default deny for all other collections
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```

### 3. Document the Security Rules
1. Take a screenshot or copy the final rules for documentation
2. Note the specific strategy for demo vs. real rate access
3. Add this information to your project documentation
4. Document how the naming convention (_demo suffix) is used for access control

### 4. Plan for Future Security Enhancements
1. Document future security rule updates to implement in Task 5:
   - Authentication-based access with payment verification
   - Role-based permissions
   - Rate limiting
   - Request validation
   - Additional rules for other collections

## Testing Steps
1. Verify the rules are properly saved in the Firebase Console
2. Test unauthenticated access to demo rate documents (e.g., "BC_demo")
3. Test that unauthenticated access to real rate documents (e.g., "BC") is denied
4. Test that authenticated access to real rate documents works correctly
5. Attempt a write operation to verify it's blocked (can be done in the Firebase Console)

## Expected Outcome
By the end of this subtask, you should have:
1. Security rules configured for the Firestore database supporting demo/paid access model
2. Unauthenticated read access to demo rate documents
3. Authenticated-only access to real rate documents
4. Write protection for all collections
5. Documentation of the security configuration

## Notes
- The security rules use document naming conventions for access control
- Documents ending with "_demo" are accessible without authentication
- The metadata document is also accessible without authentication
- Real rate documents require authentication
- These rules implement the core security model for the demo/paid version strategy
- This implementation integrates requirements from Task A.1 (Revise Firebase Structure for Demo Version)
