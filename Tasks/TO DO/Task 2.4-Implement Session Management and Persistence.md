# Task 2.4: Implement Session Management and Persistence

## Overview

This task involves implementing session management and persistence for the authentication system. You'll ensure that users remain logged in across page refreshes, that authentication state is properly preserved, and that tokens and access rights are maintained throughout the user's session.

## Complexity

Simple

## Estimated Time

30 minutes

## Implementation Steps

### 1. Enhance the Firebase Access Control Module with Session Management

1. Add initialization check to prevent duplicate listeners:
   ```javascript
   // Flag to track initialization status
   let isInitialized = false;

   /**
    * Initialize authentication with improved session management
    */
   async function initializeAuth() {
     // Prevent duplicate initialization
     if (isInitialized) {
       return;
     }
     
     // Set up auth state change listener
     auth.onAuthStateChanged(handleAuthStateChange);
     
     // Check if user is already authenticated from previous session
     await checkPersistedSession();
     
     isInitialized = true;
   }
   ```

2. Add function to check for persisted sessions:
   ```javascript
   /**
    * Check if there is a persisted session from a previous visit
    * @returns {Promise<boolean>} True if session was successfully restored
    */
   async function checkPersistedSession() {
     try {
       // Check if Firebase has persisted auth state
       const user = auth.currentUser;
       
       if (user) {
         console.log('Persisted session found for user:', user.uid);
         
         // Verify if token is still valid
         const cachedToken = getFromCache('access_token');
         if (cachedToken && cachedToken.expires > Date.now()) {
           console.log('Valid token found in cache');
           
           // Validate the user still has access
           const hasAccess = await verifyPaymentStatus(user.uid);
           
           if (hasAccess) {
             // Trigger auth state change event for UI update
             document.dispatchEvent(new CustomEvent('auth-state-changed', { 
               detail: { authenticated: true } 
             }));
             return true;
           } else {
             console.log('User no longer has access, clearing session');
             clearSession();
           }
         } else {
           console.log('Token expired or not found, generating new token');
           // Try to generate a new token
           const hasAccess = await verifyPaymentStatus(user.uid);
           if (hasAccess) {
             await generateAccessToken();
             return true;
           }
         }
       }
       
       return false;
     } catch (error) {
       console.error('Error checking persisted session:', error);
       return false;
     }
   }
   ```

### 2. Implement Session Clearing on Logout

Add function to clear all session data:

```javascript
/**
 * Clear all session data
 */
function clearSession() {
  // Clear all cached data
  clearDataCache();
  
  // Dispatch event for UI update
  document.dispatchEvent(new CustomEvent('auth-state-changed', { 
    detail: { authenticated: false } 
  }));
}

/**
 * Enhanced sign out with session clearing
 */
async function signOut() {
  try {
    clearSession();
    await auth.signOut();
  } catch (error) {
    console.error('Sign-out error:', error);
    throw error;
  }
}
```

### 3. Implement Automatic Token Refresh

Add a function to refresh the access token before it expires:

```javascript
/**
 * Set up automatic token refresh
 */
function setupTokenRefresh() {
  // Check for existing timer and clear if exists
  if (window.tokenRefreshTimer) {
    clearTimeout(window.tokenRefreshTimer);
  }
  
  // Get current token
  const cachedToken = getFromCache('access_token');
  if (!cachedToken) {
    return;
  }
  
  // Calculate time until refresh (75% of token lifetime)
  const now = Date.now();
  const tokenLife = cachedToken.expires - cachedToken.created;
  const refreshTime = cachedToken.created + (tokenLife * 0.75);
  const timeUntilRefresh = Math.max(0, refreshTime - now);
  
  // Set up refresh timer
  window.tokenRefreshTimer = setTimeout(async () => {
    console.log('Refreshing access token');
    const user = auth.currentUser;
    if (user) {
      await generateAccessToken();
      // Set up the next refresh
      setupTokenRefresh();
    }
  }, timeUntilRefresh);
}
```

### 4. Update the Authentication State Change Handler

Enhance the state change handler to manage session persistence:

```javascript
/**
 * Enhanced authentication state change handler
 * @param {Object} user - Firebase user object
 */
async function handleAuthStateChange(user) {
  if (user) {
    // User is signed in
    console.log('User authenticated:', user.uid);
    
    // Check access and generate token if needed
    const hasAccess = await verifyPaymentStatus(user.uid);
    
    if (hasAccess) {
      // Generate token if not exists or expired
      const cachedToken = getFromCache('access_token');
      if (!cachedToken || cachedToken.expires <= Date.now()) {
        await generateAccessToken();
      }
      
      // Set up token refresh
      setupTokenRefresh();
    }
    
    // Trigger UI updates
    document.dispatchEvent(new CustomEvent('auth-state-changed', { 
      detail: { authenticated: true, hasAccess }
    }));
  } else {
    // User is signed out
    console.log('User signed out');
    
    // Clear any cached data that requires authentication
    clearSession();
  }
}
```

### 5. Implement Enhanced Cache Management for Session Data

Update the caching functionality to better support session persistence:

```javascript
/**
 * Clear all data cache
 */
function clearDataCache() {
  // Only clear our app-specific cache items
  const keysToRemove = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // Only remove cache items related to our app
    if (key.startsWith('rates_') || key.startsWith('payment_') || key === 'access_token') {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Clear token refresh timer
  if (window.tokenRefreshTimer) {
    clearTimeout(window.tokenRefreshTimer);
    window.tokenRefreshTimer = null;
  }
}
```

### 6. Implement API for Checking Authentication Status

Add a function to check if the user is fully authenticated with valid access:

```javascript
/**
 * Check if user is fully authenticated with valid access
 * @returns {Promise<Object>} Authentication status object
 */
async function getAuthenticationStatus() {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return { authenticated: false, hasAccess: false };
    }
    
    // Check token validity
    const cachedToken = getFromCache('access_token');
    const tokenValid = cachedToken && cachedToken.expires > Date.now();
    
    // Check access rights
    const hasAccess = tokenValid || await verifyPaymentStatus(user.uid);
    
    return {
      authenticated: true,
      hasAccess,
      userId: user.uid,
      email: user.email || 'Anonymous User',
      isAnonymous: user.isAnonymous,
      tokenValid
    };
  } catch (error) {
    console.error('Error getting authentication status:', error);
    return { authenticated: false, hasAccess: false, error: error.message };
  }
}
```

### 7. Update Module Exports

```javascript
// Update the exported module interface
const FirebaseAccessControl = {
  // Auth management (from previous tasks)
  initializeAuth,
  checkAuthStatus,
  signInAnonymously,
  signInWithEmail,
  signOut,
  createUserWithEmail,
  
  // Access verification (from previous tasks)
  verifyPaymentStatus,
  generateAccessToken, 
  validateAccessToken,
  checkAccessForRates,
  handleAccessDenied,
  
  // Session management (new)
  getAuthenticationStatus,
  checkPersistedSession,
  clearSession,
  
  // Cache management
  setInCache,
  getFromCache,
  clearFromCache,
  clearDataCache
};

export default FirebaseAccessControl;
```

## Testing Procedures

1. Test session persistence across page reloads:
   ```javascript
   // Log in a user
   await FirebaseAccessControl.signInAnonymously();
   
   // Verify token is generated
   await FirebaseAccessControl.generateAccessToken();
   
   // Check if session persists after page reload
   // (Manually reload the page in browser)
   // Then run:
   const status = await FirebaseAccessControl.getAuthenticationStatus();
   console.log('Authentication status after reload:', status);
   ```

2. Test automatic token refresh:
   ```javascript
   // Modify the token expiry for testing (simulate near-expiry)
   const token = FirebaseAccessControl.getFromCache('access_token');
   if (token) {
     // Set expiry to 2 minutes from now
     token.expires = Date.now() + (2 * 60 * 1000);
     FirebaseAccessControl.setInCache('access_token', token);
     
     // Set up token refresh (should refresh in about 30 seconds)
     FirebaseAccessControl.setupTokenRefresh();
     
     // Wait and check if token was refreshed
     setTimeout(async () => {
       const newToken = FirebaseAccessControl.getFromCache('access_token');
       console.log('Token refreshed:', newToken.expires > token.expires);
     }, 40 * 1000);
   }
   ```

3. Test session clearing on logout:
   ```javascript
   // Sign out
   await FirebaseAccessControl.signOut();
   
   // Verify all session data is cleared
   const token = FirebaseAccessControl.getFromCache('access_token');
   console.log('Token after logout (should be null):', token);
   
   // Check authentication status
   const status = await FirebaseAccessControl.getAuthenticationStatus();
   console.log('Authentication status after logout:', status);
   ```

## Expected Outcome

By the end of this task, you should have:

1. Robust session management that persists authentication across page reloads
2. Automatic token refresh to maintain user sessions without requiring re-authentication
3. Proper session cleanup on logout
4. Enhanced authentication state handling that accounts for both authentication and access rights
5. API for checking authentication status that can be used by other parts of the application

## Notes

- The implementation uses localStorage for caching, which is suitable for this application but may have limitations in certain browsers with privacy settings enabled
- For more robust persistence, consider using Firebase's built-in persistence options (indexedDB, sessionStorage, etc.)
- The token refresh strategy (75% of lifetime) is a balance between frequent refreshes and risk of expiry - adjust as needed
- Error handling is designed to fail safely - if authentication fails, access is denied rather than potentially allowing unauthorized access
