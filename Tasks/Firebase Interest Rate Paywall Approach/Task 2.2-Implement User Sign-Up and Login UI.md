# Task 2.2: Implement User Sign-Up and Login UI

## Overview

This task involves creating the user interface components needed for user authentication in the calculator app. You'll develop modal dialogs for sign-up and login, integrate them with the Firebase authentication module, and ensure a smooth user experience for the authentication process.

## Complexity

Simple

## Estimated Time

30 minutes

## Implementation Steps

### 1. Create HTML for Authentication Modals

1. Create modal HTML for login:
   ```html
   <div id="login-modal" class="modal">
     <div class="modal-content">
       <span class="close">&times;</span>
       <h2>Login to Access Interest Rates</h2>
       <div class="auth-form">
         <div class="form-group">
           <label for="login-email">Email</label>
           <input type="email" id="login-email" required>
         </div>
         <div class="form-group">
           <label for="login-password">Password</label>
           <input type="password" id="login-password" required>
         </div>
         <div class="form-actions">
           <button id="login-button" class="btn btn-primary">Login</button>
           <button id="anonymous-login-button" class="btn btn-secondary">Continue as Guest</button>
         </div>
         <p>Don't have an account? <a href="#" id="show-signup-link">Sign up</a></p>
       </div>
     </div>
   </div>
   ```

2. Create modal HTML for sign-up:
   ```html
   <div id="signup-modal" class="modal">
     <div class="modal-content">
       <span class="close">&times;</span>
       <h2>Sign Up for Access</h2>
       <div class="auth-form">
         <div class="form-group">
           <label for="signup-email">Email</label>
           <input type="email" id="signup-email" required>
         </div>
         <div class="form-group">
           <label for="signup-password">Password</label>
           <input type="password" id="signup-password" required>
         </div>
         <div class="form-group">
           <label for="signup-confirm-password">Confirm Password</label>
           <input type="password" id="signup-confirm-password" required>
         </div>
         <div class="form-actions">
           <button id="signup-button" class="btn btn-primary">Sign Up</button>
         </div>
         <p>Already have an account? <a href="#" id="show-login-link">Login</a></p>
       </div>
     </div>
   </div>
   ```

3. Create an authentication status indicator for the main UI:
   ```html
   <div id="auth-status" class="auth-status">
     <span id="auth-status-text">Not signed in</span>
     <button id="auth-action-button" class="btn btn-small">Sign In</button>
   </div>
   ```

### 2. Add CSS Styles for Authentication UI

1. Create or update CSS for modals:
   ```css
   .modal {
     display: none;
     position: fixed;
     z-index: 1000;
     left: 0;
     top: 0;
     width: 100%;
     height: 100%;
     background-color: rgba(0, 0, 0, 0.5);
   }

   .modal-content {
     background-color: #fff;
     margin: 15% auto;
     padding: 20px;
     border-radius: 5px;
     width: 80%;
     max-width: 500px;
   }

   .close {
     color: #aaa;
     float: right;
     font-size: 28px;
     font-weight: bold;
     cursor: pointer;
   }

   .auth-form {
     display: flex;
     flex-direction: column;
     gap: 15px;
   }

   .form-group {
     display: flex;
     flex-direction: column;
     gap: 5px;
   }

   .form-actions {
     display: flex;
     gap: 10px;
     margin-top: 10px;
   }

   .auth-status {
     display: flex;
     align-items: center;
     gap: 10px;
     margin-bottom: 15px;
   }
   ```

### 3. Implement JavaScript for UI Functionality

1. Create a new file `auth-ui.js` in the BC COIA calculator directory:
   ```javascript
   import FirebaseAuth from './firebase-access-control.js';

   // DOM Elements
   const loginModal = document.getElementById('login-modal');
   const signupModal = document.getElementById('signup-modal');
   const closeButtons = document.querySelectorAll('.close');
   const authStatusText = document.getElementById('auth-status-text');
   const authActionButton = document.getElementById('auth-action-button');
   const showSignupLink = document.getElementById('show-signup-link');
   const showLoginLink = document.getElementById('show-login-link');
   const loginButton = document.getElementById('login-button');
   const anonymousLoginButton = document.getElementById('anonymous-login-button');
   const signupButton = document.getElementById('signup-button');

   // Modal control functions
   function showLoginModal() {
     loginModal.style.display = 'block';
     signupModal.style.display = 'none';
   }

   function showSignupModal() {
     signupModal.style.display = 'block';
     loginModal.style.display = 'none';
   }

   function hideModals() {
     loginModal.style.display = 'none';
     signupModal.style.display = 'none';
   }

   // Authentication functions
   async function handleLogin() {
     const email = document.getElementById('login-email').value;
     const password = document.getElementById('login-password').value;
     
     try {
       await FirebaseAuth.signInWithEmail(email, password);
       hideModals();
     } catch (error) {
       alert(`Login failed: ${error.message}`);
     }
   }

   async function handleAnonymousLogin() {
     try {
       await FirebaseAuth.signInAnonymously();
       hideModals();
     } catch (error) {
       alert(`Anonymous login failed: ${error.message}`);
     }
   }

   async function handleSignup() {
     const email = document.getElementById('signup-email').value;
     const password = document.getElementById('signup-password').value;
     const confirmPassword = document.getElementById('signup-confirm-password').value;
     
     if (password !== confirmPassword) {
       alert('Passwords do not match');
       return;
     }
     
     try {
       // This function will need to be added to FirebaseAuth
       await FirebaseAuth.createUserWithEmail(email, password);
       hideModals();
     } catch (error) {
       alert(`Sign-up failed: ${error.message}`);
     }
   }

   async function handleSignOut() {
     try {
       await FirebaseAuth.signOut();
     } catch (error) {
       alert(`Sign-out failed: ${error.message}`);
     }
   }

   // Update UI based on authentication state
   function updateAuthUI(isAuthenticated) {
     if (isAuthenticated) {
       authStatusText.textContent = 'Signed in';
       authActionButton.textContent = 'Sign Out';
       authActionButton.onclick = handleSignOut;
     } else {
       authStatusText.textContent = 'Not signed in';
       authActionButton.textContent = 'Sign In';
       authActionButton.onclick = showLoginModal;
     }
   }

   // Event listeners
   document.addEventListener('auth-state-changed', (event) => {
     updateAuthUI(event.detail.authenticated);
   });

   closeButtons.forEach(button => {
     button.onclick = hideModals;
   });

   showSignupLink.onclick = showSignupModal;
   showLoginLink.onclick = showLoginModal;
   loginButton.onclick = handleLogin;
   anonymousLoginButton.onclick = handleAnonymousLogin;
   signupButton.onclick = handleSignup;
   authActionButton.onclick = showLoginModal;

   // Initialize
   function initAuthUI() {
     // Check initial authentication state
     const isAuthenticated = FirebaseAuth.checkAuthStatus();
     updateAuthUI(isAuthenticated);
     
     // Close modals when clicking outside
     window.onclick = function(event) {
       if (event.target === loginModal || event.target === signupModal) {
         hideModals();
       }
     };
   }

   export { initAuthUI };
   ```

### 4. Update the main application to use the authentication UI

1. In the main JavaScript file, import and initialize the auth UI:
   ```javascript
   import { initAuthUI } from './auth-ui.js';
   
   // Add to the initialization sequence
   function initApp() {
     // ... existing initialization code
     
     // Initialize authentication UI
     initAuthUI();
     
     // ... rest of initialization
   }
   ```

2. Add the authentication modals to the HTML:
   - Add the modal HTML from step 1 to the index.html file
   - Place the auth-status indicator in an appropriate location in the UI

### 5. Extend the FirebaseAuth Module

Add the user creation function to firebase-access-control.js:

```javascript
/**
 * Create a new user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Firebase user object
 */
async function createUserWithEmail(email, password) {
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    return userCredential.user;
  } catch (error) {
    console.error('User creation error:', error);
    throw error;
  }
}

// Add to the exported interface
const FirebaseAuth = {
  // ... existing methods
  createUserWithEmail
};
```

## Testing Procedures

1. Open the application and verify that the authentication status indicator appears
2. Click "Sign In" and verify that the login modal appears
3. Test the "Sign Up" link and verify that it switches to the sign-up modal
4. Test form validation (empty fields, password mismatch)
5. Test anonymous sign-in functionality:
   - Click "Continue as Guest" and verify successful login
   - Check that the auth status updates to "Signed in"
6. Test sign-out functionality:
   - Click "Sign Out" and verify successful logout
   - Check that the auth status updates to "Not signed in"
7. If possible, test email/password sign-up and login with a test account

## Expected Outcome

By the end of this task, you should have:

1. A complete authentication UI with login and sign-up modals
2. Visual indicator of authentication status in the main UI
3. Working anonymous authentication
4. Working email/password registration and authentication
5. Smooth transitions between authentication states

## Notes

- The UI design should be consistent with the rest of the application
- Error messages should be clear and user-friendly
- The authentication UI should be responsive and work on mobile devices
- Consider adding loading indicators during authentication operations
- This implementation assumes Firebase is already configured in the project
