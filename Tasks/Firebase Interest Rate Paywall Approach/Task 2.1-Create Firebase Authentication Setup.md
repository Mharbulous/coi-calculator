# Task 2.1: Create Firebase Authentication Setup

## Overview

This task involves setting up the foundation for Firebase authentication in the calculator app. You'll create the basic authentication module that handles user authentication state, provides sign-in methods, and establishes the core authentication flows.

## Complexity

Simple

## Estimated Time

30 minutes

## Implementation Steps

### 1. Create the Basic Authentication Module

1. Create a new file named `firebase-access-control.js` in the BC COIA calculator directory
2. Import necessary Firebase authentication modules:
   ```javascript
   import { auth } from './firebase-config.js';
   ```

### 2. Implement Core Authentication Functions

1. Implement the initialization function:
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
   ```

2. Implement authentication status checking:
   ```javascript
   /**
    * Check the current authentication status
    * @returns {Promise<boolean>} True if user is authenticated
    */
   async function checkAuthStatus() {
     const user = auth.currentUser;
     if (user) {
       return true; // Basic auth check (payment verification will be added later)
     }
     return false;
   }
   ```

3. Implement authentication state change handler:
   ```javascript
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
       // Trigger UI updates
       document.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { authenticated: false } }));
     }
   }
   ```

### 3. Implement Sign-In Methods

1. Add anonymous sign-in functionality (simplest initial approach):
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
   ```

2. Add email/password sign-in for future use:
   ```javascript
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
   ```

3. Implement sign-out functionality:
   ```javascript
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

### 4. Export Authentication Module Interface

```javascript
// Create and export the authentication interface
const FirebaseAuth = {
  // Auth management
  initializeAuth,
  checkAuthStatus,
  signInAnonymously,
  signInWithEmail,
  signOut
};

export default FirebaseAuth;
```

### 5. Create Test Function

Add a test function at the bottom of the file to verify the authentication setup:

```javascript
// For testing purposes
export async function testAuthSetup() {
  try {
    await initializeAuth();
    console.log('Auth initialized successfully');
    return true;
  } catch (error) {
    console.error('Auth initialization failed:', error);
    return false;
  }
}
```

## Testing Procedures

1. Import the authentication module in a test script
2. Call the `testAuthSetup()` function and verify it initializes without errors
3. Test anonymous sign-in and verify user creation:
   ```javascript
   const user = await FirebaseAuth.signInAnonymously();
   console.log('User signed in:', user.uid);
   ```
4. Verify auth state listener works by signing out and checking for event dispatch:
   ```javascript
   await FirebaseAuth.signOut();
   // Should see 'User signed out' in console
   ```

## Expected Outcome

By the end of this task, you should have:

1. A functioning Firebase authentication module
2. Anonymous sign-in capability
3. Email/password sign-in structure for future use
4. Authentication state change handling
5. Event dispatching for UI updates based on auth state changes

## Notes

- This module focuses only on the authentication part without payment verification
- Payment verification will be added in a subsequent task
- The module should be structured to allow easy extension in later tasks
- Error handling at this stage should be basic but functional
