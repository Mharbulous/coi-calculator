# Task 2.3: Develop Access Token and Verification System

## Overview

This task involves creating a mode-aware access control system that supports both demo and paid versions of the application. You'll develop verification logic that checks if a user has paid for access and implement token-based authorization for accessing protected data, while allowing unauthenticated access to demo features.

## Complexity

Medium (increased from Simple due to dual-mode support)

## Estimated Time

1 hour (increased from 30 minutes to accommodate demo mode functionality)

## Implementation Steps

### 1. Implement Mode-Aware Access Control Module

1. Create a `firebase-access-control.js` module with mode-aware functions:
   ```javascript
   /**
    * Get interest rates for a specific jurisdiction
    * @param {string} jurisdiction - Jurisdiction code (e.g., 'BC')
    * @param {boolean} demoMode - Whether to fetch demo rates (default: false)
    * @returns {Promise<Array>} Array of interest rate objects
    */
   async function getInterestRates(jurisdiction, demoMode = false) {
     try {
       // If demo mode, fetch demo rates (no authentication required)
       if (demoMode) {
         // Use appropriate document ID for demo rates
         const docId = `${jurisdiction}_demo`;
         
         // Check cache first
         const cacheKey = `rates_demo_${jurisdiction}`;
         const cachedRates = getFromCache(cacheKey);
         if (cachedRates) {
           return cachedRates;
         }
         
         // Fetch demo rates from Firebase
         const demoDoc = await db.collection('interestRates').doc(docId).get();
         
         if (!demoDoc.exists) {
           throw new Error(`No demo rates found for jurisdiction: ${jurisdiction}`);
         }
         
         const ratesData = demoDoc.data();
         const rates = ratesData.rates || [];
         
         // Process and cache demo rates
         const processedRates = rates.map(rate => ({
           ...rate,
           start: new Date(rate.start)
         }));
         
         // Cache the result (for 1 day)
         setInCache(cacheKey, processedRates, 24 * 60 * 60 * 1000);
         
         return processedRates;
       }
       
       // For real rates, check authentication and payment status first
       const hasAccess = await checkAuthStatus();
       if (!hasAccess) {
         throw new Error('Access denied. Payment required.');
       }
       
       // Proceed with existing code for authenticated access to real rates
       // Check cache first
       const cacheKey = `rates_${jurisdiction}`;
       const cachedRates = getFromCache(cacheKey);
       if (cachedRates) {
         return cachedRates;
       }
       
       // Fetch real rates from Firebase
       const rateDoc = await db.collection('interestRates').doc(jurisdiction).get();
       
       if (!rateDoc.exists) {
         throw new Error(`No rates found for jurisdiction: ${jurisdiction}`);
       }
       
       const ratesData = rateDoc.data();
       const rates = ratesData.rates || [];
       
       // Process and cache rates
       const processedRates = rates.map(rate => ({
         ...rate,
         start: new Date(rate.start)
       }));
       
       // Cache the result (for 1 day)
       setInCache(cacheKey, processedRates, 24 * 60 * 60 * 1000);
       
       return processedRates;
     } catch (error) {
       // Enhanced error handling with fallback options
       return handleRateRetrievalError(error, jurisdiction, demoMode);
     }
   }
   ```

### 2. Implement Enhanced Error Handling with Demo Mode Fallback

```javascript
/**
 * Enhanced error handling for rate retrieval
 * @param {Error} error - The error that occurred
 * @param {string} jurisdiction - The jurisdiction code
 * @param {boolean} demoMode - Whether this was a demo mode request
 * @returns {Promise<Array|null>} Fallback rates or null
 */
async function handleRateRetrievalError(error, jurisdiction, demoMode) {
  console.error(`Error fetching rates for ${jurisdiction}:`, error);
  
  // If in real mode and access is denied, suggest switching to demo mode
  if (!demoMode && error.message.includes('Access denied')) {
    document.dispatchEvent(new CustomEvent('suggest-demo-mode', {
      detail: { error: error.message }
    }));
    return null;
  }
  
  // If in demo mode and rates not found, try to use fallback mock data
  if (demoMode) {
    console.warn(`Demo rates fetch failed, using local fallback for ${jurisdiction}`);
    // Attempt to use local fallback mock data
    try {
      // Import directly from mockRates.js as last resort
      const { default: mockRates } = await import('../mockRates.js');
      return mockRates[jurisdiction] || [];
    } catch (fallbackError) {
      console.error('Fallback retrieval failed:', fallbackError);
      return [];
    }
  }
  
  // For other errors, return empty array
  return [];
}
```

### 3. Extend Access Control with Payment Verification

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

### 4. Extend the `checkAuthStatus` Function to Include Payment Verification

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

### 5. Implement Mode Switching Capabilities

```javascript
/**
 * Switch to demo mode
 * @returns {Promise<void>}
 */
async function switchToDemoMode() {
  // Clear any cached real rates
  clearRealRatesCache();
  
  // Dispatch event for UI updates
  document.dispatchEvent(new CustomEvent('mode-changed', {
    detail: { mode: 'demo' }
  }));
}

/**
 * Switch to paid mode after successful payment
 * @returns {Promise<void>}
 */
async function switchToPaidMode() {
  // Clear any cached demo rates
  clearDemoRatesCache();
  
  // Dispatch event for UI updates
  document.dispatchEvent(new CustomEvent('mode-changed', {
    detail: { mode: 'paid' }
  }));
}

/**
 * Clear all cached real rates
 */
function clearRealRatesCache() {
  const keysToRemove = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('rates_') && !key.includes('_demo_')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

/**
 * Clear all cached demo rates
 */
function clearDemoRatesCache() {
  const keysToRemove = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.includes('_demo_')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
}
```

### 6. Add Access Token Generation and Validation

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

### 7. Implement Caching Utilities for Tokens and Payment Status

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
```

### 8. Update Module Exports to Include Mode-Related Functions

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
  
  // Access verification
  verifyPaymentStatus,
  generateAccessToken, 
  validateAccessToken,
  
  // Mode management
  getInterestRates,
  switchToDemoMode,
  switchToPaidMode,
  
  // Cache management
  setInCache,
  getFromCache,
  clearFromCache,
  clearRealRatesCache,
  clearDemoRatesCache
};

export default FirebaseAccessControl;
```

## Testing Procedures

1. Test demo mode rate retrieval:
   ```javascript
   // Test retrieving demo rates without authentication
   async function testDemoRates() {
     try {
       // Ensure we're not authenticated
       await FirebaseAccessControl.signOut();
       
       // Try to get demo rates
       const demoRates = await FirebaseAccessControl.getInterestRates('BC', true);
       console.log('Demo rates retrieved:', demoRates.length > 0);
       return demoRates.length > 0;
     } catch (error) {
       console.error('Demo rates test failed:', error);
       return false;
     }
   }
   ```

2. Test real rates access denial without authentication:
   ```javascript
   // Test that real rates are denied without authentication
   async function testRealRatesDenial() {
     try {
       // Ensure we're not authenticated
       await FirebaseAccessControl.signOut();
       
       // Try to get real rates
       await FirebaseAccessControl.getInterestRates('BC', false);
       
       // Should not reach here if properly denied
       console.error('Security failure: Accessed real rates without authentication');
       return false;
     } catch (error) {
       // Expected error
       console.log('Real rates properly denied without auth:', error.message.includes('Access denied'));
       return error.message.includes('Access denied');
     }
   }
   ```

3. Test mode switching:
   ```javascript
   // Test mode switching
   async function testModeSwitching() {
     try {
       // Set up event listener for mode change
       let modeChangeDetected = false;
       const listener = () => {
         modeChangeDetected = true;
       };
       document.addEventListener('mode-changed', listener);
       
       // Switch to demo mode
       await FirebaseAccessControl.switchToDemoMode();
       
       // Check if event was fired
       const result = modeChangeDetected;
       
       // Clean up
       document.removeEventListener('mode-changed', listener);
       
       console.log('Mode switching test result:', result);
       return result;
     } catch (error) {
       console.error('Mode switching test failed:', error);
       return false;
     }
   }
   ```

## Expected Outcome

By the end of this task, you should have:

1. Mode-aware access control implementation supporting both demo and paid versions
2. Payment status verification integrated with authentication
3. Demo/paid mode switching capabilities
4. Enhanced error handling with graceful fallbacks between modes
5. Caching mechanisms for tokens, payment status and rate data

## Notes

- The implementation supports both authenticated (paid) and unauthenticated (demo) modes
- Demo mode uses specially-named documents (with "_demo" suffix) and doesn't require authentication
- The error handling includes fallback mechanisms for a smoother user experience
- This implementation integrates requirements from Task A.2 (Modify Access Control for Demo Mode)
