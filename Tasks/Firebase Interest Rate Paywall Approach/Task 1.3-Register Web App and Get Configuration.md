# Task 1.3: Register Web App and Get Configuration

## Overview
This subtask involves registering the COI Calculator as a web application in Firebase and obtaining the configuration details needed to connect the app to Firebase services.

## Complexity
Simple

## Estimated Time
15 minutes

## Implementation Steps

### 1. Register Web App in Firebase
1. In the Firebase Console, navigate to the Project Overview page
2. Click the web icon (</>) to add a web app
3. Register your app with a nickname (e.g., "COI Calculator Web")
4. Optionally set up Firebase Hosting (not required for this implementation)
5. Continue to the console

### 2. Obtain Firebase Configuration
1. After registering, Firebase will display a configuration object that looks like:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "your-project-id.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project-id.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID",
     measurementId: "YOUR_MEASUREMENT_ID"
   };
   ```
2. Copy this configuration object
3. Store it securely for use in Task 1.4 (do not commit this to version control)

### 3. Document App Registration
1. Document the web app name and Firebase project details
2. Note any specific settings chosen during registration
3. Create a secure entry in your project documentation for the Firebase configuration

## Testing Steps
1. Verify the web app appears in the Firebase Console under Project Settings > Your Apps
2. Confirm you have access to all required configuration values

## Expected Outcome
By the end of this subtask, you should have:
1. A registered web app in your Firebase project
2. A Firebase configuration object with all necessary connection details
3. Securely stored credentials for use in the next task

## Notes
- The API key in the Firebase config is restricted by domain and not intended to be secret, but should still be handled carefully
- Consider using environment variables or a similar approach for the actual implementation
- No code changes to the application will be made in this subtask
