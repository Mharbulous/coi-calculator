# Task 1.4: Install Firebase SDK and Create Config Module

## Overview
This subtask involves adding the Firebase SDK to the project and creating a configuration module that initializes Firebase services. This is the first step that directly modifies the application code.

## Complexity
Simple

## Estimated Time
30 minutes

## Implementation Steps

### 1. Add Firebase SDK to index.html
1. Open the `BC COIA calculator/index.html` file
2. Add the Firebase SDK scripts before the existing scripts:
   ```html
   <!-- Firebase App (the core Firebase SDK) -->
   <script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-app.js"></script>
   
   <!-- Firebase Auth -->
   <script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-auth.js"></script>
   
   <!-- Firebase Firestore -->
   <script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-firestore.js"></script>
   ```
   Note: Replace `9.x.x` with the latest version number (e.g., 9.22.0)

### 2. Create Firebase Configuration Module
1. Create a new file `BC COIA calculator/firebase-config.js`
2. Add the Firebase configuration and initialization code:
   ```javascript
   // Firebase configuration
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "your-project-id.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project-id.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID",
     measurementId: "YOUR_MEASUREMENT_ID"
   };

   // Initialize Firebase
   const firebaseApp = firebase.initializeApp(firebaseConfig);

   // Export Firebase services
   export const db = firebase.firestore();
   export const auth = firebase.auth();
   ```
   Note: Replace the placeholder values with your actual Firebase configuration from Task 1.3

### 3. Update Import Map for ES Modules
1. If you're using the ES module version of Firebase, update the import map in index.html:
   ```html
   <script type="importmap">
   {
     "imports": {
       "zustand": "https://esm.sh/zustand@4.4.1",
       "zustand/vanilla": "https://esm.sh/zustand@4.4.1/vanilla",
       "firebase/app": "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js",
       "firebase/auth": "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js", 
       "firebase/firestore": "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js"
     }
   }
   </script>
   ```
   Note: Adjust paths and versions as needed

## Testing Steps
1. Open the application in a browser with Developer Tools enabled
2. Check the console for any Firebase initialization errors
3. Verify that the Firebase SDK is loaded correctly

## Expected Outcome
By the end of this subtask, you should have:
1. Firebase SDK scripts added to the HTML file
2. A new firebase-config.js file with initialization code
3. Firebase services (db and auth) correctly exported and ready for use
4. No errors in the browser console related to Firebase initialization

## Notes
- This is a preparatory step for Task 1.5, where we'll test the Firebase connection
- We're not modifying any existing functionality yet
- If you prefer to use npm modules instead of CDN links, update the implementation accordingly
