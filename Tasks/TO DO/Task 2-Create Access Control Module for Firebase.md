# Step 2: Create Access Control Module for Firebase

## Overview
This step involves creating an Access Control module that will handle Firebase authentication, manage user access to interest rate data, and provide a layer of abstraction between the application and Firebase services.

## Implementation Details

### Create a New File
Create a new JavaScript module file named `firebase-access-control.js` in the BC COIA calculator directory.

### Module Structure
The module should export an object with methods for:
1. Authentication management
2. Access verification
3. Interest rate data retrieval
4. Caching mechanisms

### Core Functionality to Implement

#### 1. Authentication Management
```javascript
/**
 * Initialize authentication - called during application startup
 */
async function initializeAuth() {
  // Check if user is already authenticated
  await checkAuthStatus();
  // Set up auth state change listener
  auth.onAuthStateChanged(handleAuthStateChange);
}

/**
 * Check the current authentication status
 * @returns {Promise<boolean>} True if user is authenticated
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

/**
 * Handle authentication state changes
 * @param {Object} user - Firebase user object
 */
function handleAuthStateChange(user) {
  if (user) {
    // User is signed in
    console.log('User authenticated:', user.uid);
    // Trigger any necessary UI updates
    document.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { authenticated: true } }));
  } else {
    // User is signed out
    console.log('User signed out');
    // Clear any cached data that requires authentication
    clearDataCache();
    // Trigger UI updates
    document.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { authenticated: false } }));
  }
}
```

#### 2. Sign-In Methods
```javascript
/**
 * Sign in anonymously (simplest approach for initial implementation)
 * @returns {Promise<Object>} Firebase user object
 */
async function signInAnonymously() {
  try {
    const userCredential = await auth.signInAnonymously();
    return userCredential.user;
  } catch (error) {
    console.error('Anonymous sign-in error:', error);
    throw error;
  }
}

/**
 * Sign in with email and password (for future use)
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Firebase user object
 */
async function signInWithEmail(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Email sign-in error:', error);
    throw error;
  }
}

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
async function signOut() {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Sign-out error:', error);
    throw error;
  }
}
```

#### 3. Payment Status Verification
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

/**
 * Store payment status after successful payment
 * @param {string} userId - Firebase user ID
 * @param {Object} paymentDetails - Payment transaction details
 * @returns {Promise<void>}
 */
async function storePaymentStatus(userId, paymentDetails) {
  try {
    // Calculate expiry date (e.g., 1 year from now)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    // Store in Firebase
    await db.collection('users').doc(userId).set({
      hasAccess: true,
      accessExpiry: oneYearFromNow,
      paymentDetails: {
        transactionId: paymentDetails.transactionId,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        timestamp: new Date()
      }
    }, { merge: true });
    
    // Update cache
    setInCache(`payment_${userId}`, {
      hasAccess: true,
      expiry: oneYearFromNow.getTime()
    });
    
    // Trigger any necessary UI updates
    document.dispatchEvent(new CustomEvent('payment-status-updated', { 
      detail: { hasAccess: true, expiry: oneYearFromNow }
    }));
  } catch (error) {
    console.error('Payment status update error:', error);
    throw error;
  }
}
```

#### 4. Interest Rate Data Retrieval
```javascript
/**
 * Fetch interest rates for a specific jurisdiction
 * @param {string} jurisdiction - Jurisdiction code (e.g., 'BC')
 * @returns {Promise<Array>} Array of interest rate objects
 */
async function getInterestRates(jurisdiction) {
  try {
    // First check if user has access
    const hasAccess = await checkAuthStatus();
    if (!hasAccess) {
      throw new Error('Access denied. Payment required.');
    }
    
    // Check cache first
    const cacheKey = `rates_${jurisdiction}`;
    const cachedRates = getFromCache(cacheKey);
    if (cachedRates) {
      return cachedRates;
    }
    
    // Fetch from Firebase if not cached
    const ratesDoc = await db.collection('interestRates').doc(jurisdiction).get();
    
    if (!ratesDoc.exists) {
      throw new Error(`No interest rates found for jurisdiction: ${jurisdiction}`);
    }
    
    const ratesData = ratesDoc.data();
    const rates = ratesData.rates || [];
    
    // Process dates (convert strings to Date objects)
    const processedRates = rates.map(rate => ({
      ...rate,
      start: new Date(rate.start)
      // Calculate end dates later in the application logic
    }));
    
    // Cache the result (for 1 day)
    setInCache(cacheKey, processedRates, 24 * 60 * 60 * 1000);
    
    return processedRates;
  } catch (error) {
    console.error(`Error fetching rates for ${jurisdiction}:`, error);
    throw error;
  }
}

/**
 * Fetch metadata about interest rates (last updated, valid until)
 * @returns {Promise<Object>} Metadata object
 */
async function getInterestRatesMetadata() {
  try {
    // Check cache first
    const cachedMetadata = getFromCache('rates_metadata');
    if (cachedMetadata) {
      return cachedMetadata;
    }
    
    // Fetch from Firebase
    const metadataDoc = await db.collection('interestRates').doc('metadata').get();
    
    if (!metadataDoc.exists) {
      return { lastUpdated: null, validUntil: null };
    }
    
    const metadata = metadataDoc.data();
    
    // Convert string dates to Date objects
    if (metadata.lastUpdated) {
      metadata.lastUpdated = new Date(metadata.lastUpdated);
    }
    
    if (metadata.validUntil) {
      metadata.validUntil = new Date(metadata.validUntil);
    }
    
    // Cache the result (for 1 day)
    setInCache('rates_metadata', metadata, 24 * 60 * 60 * 1000);
    
    return metadata;
  } catch (error) {
    console.error('Error fetching interest rates metadata:', error);
    return { lastUpdated: null, validUntil: null };
  }
}
```

#### 5. Caching Utilities
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

/**
 * Clear all cached data
 */
function clearDataCache() {
  // Only clear our app-specific cache items
  const keysToRemove = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // Only remove cache items related to our app
    if (key.startsWith('rates_') || key.startsWith('payment_')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
}
```

### Exporting the Module Interface
```javascript
// Create and export the access control interface
const FirebaseAccessControl = {
  // Auth management
  initializeAuth,
  checkAuthStatus,
  signInAnonymously,
  signInWithEmail,
  signOut,
  
  // Payment verification
  verifyPaymentStatus,
  storePaymentStatus,
  
  // Data access
  getInterestRates,
  getInterestRatesMetadata,
  
  // Cache management
  clearDataCache
};

export default FirebaseAccessControl;
```

## Integration Points
- This module will be imported by the modified interestRates.js file
- It will be used by the payment processing module
- It will be initialized during application startup

## Testing Considerations
- Test authentication flows with different user states
- Verify caching works correctly and respects expiration
- Test error scenarios (network failure, auth failure, etc.)
- Create mock data for testing without actual payment processing

## Next Steps
After implementing this access control module, the next step will be to modify the interestRates.js file to fetch data from Firebase instead of using hardcoded values.
