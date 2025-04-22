# Task 2.3: Develop Access Token and Verification System

## Overview

This task involves creating a system to verify user access to interest rate data based on payment status. You'll develop the verification logic that checks if a user has paid for access and implement token-based authorization for accessing protected data.

## Complexity

Simple

## Estimated Time

30 minutes

## Implementation Steps

### 1. Extend the Firebase Access Control Module with Payment Verification

1. Add payment status verification function to `firebase-access-control.js`:
   ```javascript
   /**
    * Verify if a user has paid for access
    * @param {string} userId - Firebase user ID
    * @returns {Promise<boolean>} True if user has paid
    */
   async function verifyPaymentStatus(userId) {
     try {
       // Check if we have cached payment status
       const cachedStatus = getFromCache(`payment_${userId}`);
       if (cachedStatus) {
         return cachedStatus.hasAccess && cachedStatus.expiry > Date.now();
       }

       // If not cached, check in Firebase
       const userDoc = await db.collection('users').doc(userId).get();
       
       if (userDoc.exists) {
         const userData = userDoc.data();
         const hasAccess = userData.hasAccess === true;
         const expiry = userData.accessExpiry?.toDate?.() || userData.accessExpiry;
         
         // Cache the result
         if (hasAccess && expiry) {
           setInCache(`payment_${userId}`, {
             hasAccess,
             expiry: expiry.getTime ? expiry.getTime() : expiry
           });
         }
         
         return hasAccess && expiry > new Date();
       }
       
       return false;
     } catch (error) {
       console.error('Payment status verification error:', error);
       // If there's an error, default to no access
       return false;
     }
   }
   ```

2. Extend the `checkAuthStatus` function to include payment verification:
   ```javascript
   /**
    * Check the current authentication status and payment verification
    * @returns {Promise<boolean>} True if user is authenticated and has paid
    */
   async function checkAuthStatus() {
     const user = auth.currentUser;
     if (user) {
       // Verify if user has payment status
       const hasAccess = await verifyPaymentStatus(user.uid);
       return hasAccess;
     }
     return false;
   }
   ```

### 2. Implement Access Token Creation and Validation

1. Add function to generate access tokens for authenticated users:
   ```javascript
   /**
    * Generate an access token for the current user
    * @returns {Promise<string|null>} Access token or null if not authenticated
    */
   async function generateAccessToken() {
     const user = auth.currentUser;
     if (!user) {
       return null;
     }
     
     // Verify payment status
     const hasAccess = await verifyPaymentStatus(user.uid);
     if (!hasAccess) {
       return null;
     }
     
     // Create a simple token with user ID, timestamp, and expiry
     // For a production app, consider using Firebase custom tokens or JWT
     const token = {
       uid: user.uid,
       created: Date.now(),
       expires: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
       signature: btoa(`${user.uid}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`)
     };
     
     // Store token in cache
     setInCache('access_token', token);
     
     return btoa(JSON.stringify(token));
   }
   ```

2. Add function to validate access tokens:
   ```javascript
   /**
    * Validate the current access token
    * @param {string} token - Access token to validate
    * @returns {Promise<boolean>} True if token is valid
    */
   async function validateAccessToken(token) {
     try {
       if (!token) {
         // Check for cached token if none provided
         const cachedToken = getFromCache('access_token');
         if (!cachedToken) {
           return false;
         }
         
         // Validate expiry of cached token
         if (cachedToken.expires < Date.now()) {
           clearFromCache('access_token');
           return false;
         }
         
         return true;
       }
       
       // Decode and validate provided token
       const decodedToken = JSON.parse(atob(token));
       
       // Check expiry
       if (decodedToken.expires < Date.now()) {
         return false;
       }
       
       // Validate user ID matches current user
       const user = auth.currentUser;
       if (!user || user.uid !== decodedToken.uid) {
         return false;
       }
       
       // Additional validation could be added here
       // For production, verify signature with server
       
       return true;
     } catch (error) {
       console.error('Token validation error:', error);
       return false;
     }
   }
   ```

### 3. Implement Caching Utilities for Tokens and Payment Status

1. Add caching utilities if not already implemented:
   ```javascript
   /**
    * Set data in cache with optional expiration
    * @param {string} key - Cache key
    * @param {any} data - Data to cache
    * @param {number} [ttl=3600000] - Time to live in milliseconds (default: 1 hour)
    */
   function setInCache(key, data, ttl = 3600000) {
     const item = {
       data,
       expiry: Date.now() + ttl
     };
     localStorage.setItem(key, JSON.stringify(item));
   }

   /**
    * Get data from cache if not expired
    * @param {string} key - Cache key
    * @returns {any|null} Cached data or null if expired/not found
    */
   function getFromCache(key) {
     try {
       const item = JSON.parse(localStorage.getItem(key));
       
       if (!item) {
         return null;
       }
       
       // Check if expired
       if (item.expiry && item.expiry < Date.now()) {
         localStorage.removeItem(key);
         return null;
       }
       
       return item.data;
     } catch (error) {
       console.error('Cache retrieval error:', error);
       return null;
     }
   }

   /**
    * Clear specific item from cache
    * @param {string} key - Cache key
    */
   function clearFromCache(key) {
     localStorage.removeItem(key);
   }
   ```

### 4. Update Function to Verify Access for Data Requests

1. Create a function to check access before retrieving interest rate data:
   ```javascript
   /**
    * Check if user has access to interest rate data
    * @returns {Promise<boolean>} True if user has access
    */
   async function checkAccessForRates() {
     try {
       // First verify authentication status
       const user = auth.currentUser;
       if (!user) {
         return false;
       }
       
       // Check for valid access token
       const cachedToken = getFromCache('access_token');
       if (cachedToken && cachedToken.expires > Date.now()) {
         return true;
       }
       
       // If no valid token, check payment status directly
       const hasAccess = await verifyPaymentStatus(user.uid);
       
       // If has access, generate a new token
       if (hasAccess) {
         await generateAccessToken();
       }
       
       return hasAccess;
     } catch (error) {
       console.error('Access check error:', error);
       return false;
     }
   }
   ```

### 5. Update Module Exports to Include New Functions

```javascript
// Update the exported module interface
const FirebaseAccessControl = {
  // Auth management (from Task 2.1)
  initializeAuth,
  checkAuthStatus,
  signInAnonymously,
  signInWithEmail,
  signOut,
  createUserWithEmail,
  
  // Access verification (new)
  verifyPaymentStatus,
  generateAccessToken, 
  validateAccessToken,
  checkAccessForRates,
  
  // Cache management
  setInCache,
  getFromCache,
  clearFromCache
};

export default FirebaseAccessControl;
```

### 6. Add Helper Function for Access Denied Handling

```javascript
/**
 * Handle access denied scenarios (for use by interest rates module)
 * @param {Function} onAccessRequired - Callback function when user needs to authenticate/pay
 * @returns {Promise<void>}
 */
async function handleAccessDenied(onAccessRequired) {
  // Get current auth status
  const user = auth.currentUser;
  
  if (!user) {
    // User not logged in, trigger login
    document.dispatchEvent(new CustomEvent('auth-access-required'));
    if (typeof onAccessRequired === 'function') {
      onAccessRequired('authentication');
    }
  } else {
    // User logged in but no payment
    document.dispatchEvent(new CustomEvent('payment-required'));
    if (typeof onAccessRequired === 'function') {
      onAccessRequired('payment');
    }
  }
}

// Add to exports
const FirebaseAccessControl = {
  // ... other exports
  handleAccessDenied
};
```

## Testing Procedures

1. Test authentication and token generation:
   ```javascript
   // Test user authentication and token generation
   async function testTokenGeneration() {
     try {
       await FirebaseAccessControl.signInAnonymously();
       const token = await FirebaseAccessControl.generateAccessToken();
       console.log('Generated token:', token);
       return token != null;
     } catch (error) {
       console.error('Token generation test failed:', error);
       return false;
     }
   }
   ```

2. Test token validation:
   ```javascript
   // Test token validation
   async function testTokenValidation(token) {
     try {
       const isValid = await FirebaseAccessControl.validateAccessToken(token);
       console.log('Token validation result:', isValid);
       return isValid;
     } catch (error) {
       console.error('Token validation test failed:', error);
       return false;
     }
   }
   ```

3. Test payment status verification:
   ```javascript
   // Test payment status verification
   async function testPaymentVerification() {
     try {
       const user = auth.currentUser;
       if (!user) {
         console.error('No user logged in');
         return false;
       }
       
       const hasAccess = await FirebaseAccessControl.verifyPaymentStatus(user.uid);
       console.log('Payment verification result:', hasAccess);
       return hasAccess;
     } catch (error) {
       console.error('Payment verification test failed:', error);
       return false;
     }
   }
   ```

4. Create a test script that runs these tests in sequence

## Expected Outcome

By the end of this task, you should have:

1. A complete access token generation and validation system
2. Payment status verification integrated with authentication
3. Caching mechanisms for tokens and payment status
4. A function to check access before retrieving interest rate data
5. Helper functions for handling access denied scenarios

## Notes

- The token implementation in this task is simplified for the purpose of client-side verification
- For a production system, consider using Firebase custom tokens or a proper JWT implementation
- The caching helps reduce database reads and improves performance
- The access control system is designed to work seamlessly with the interest rates module that will be developed in a later task
