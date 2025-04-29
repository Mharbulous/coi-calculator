# Firebase Integration for COI Calculator

This document explains how the Court Order Interest Calculator has been integrated with Firebase to store and retrieve interest rate data.

## Overview

The application now fetches interest rate data from Firebase Firestore instead of relying solely on hardcoded values. This allows for:

1. Remote updates to interest rates without code changes
2. Centralized management of rate data
3. Potential for future enhancements like user authentication and paid access

## Setup Instructions

### 1. Firebase Configuration

The Firebase configuration is stored in `firebaseConfig.js`. This file contains the connection details for your Firebase project.

### 2. Data Migration

To upload the existing interest rate data to Firebase, run:

```bash
cd "BC COIA calculator"
npm install
npm run migrate
```

This will install the Firebase SDK and execute the `migrateRatesToFirebase.js` script, which uploads all historical interest rate data to your Firebase Firestore database.

## How It Works

### Data Structure

In Firebase Firestore:
- Collection: `interestRates`
- Documents: One per jurisdiction (e.g., `BC-COIA`, `AB-COIA`, `ON-COIA`)
- Each document contains:
  - `rates`: Array of rate objects with `start`, `prejudgment`, and `postjudgment` fields
  - `lastUpdated`: When the rates were last updated
  - `validUntil`: Until when the rates are valid

### Code Implementation

1. **firebaseConfig.js**: Initializes Firebase and exports the Firestore database instance.

2. **firebaseRates.js**: 
   - Contains functions to fetch and process rates from Firebase
   - Handles errors and provides fallback to local rates

3. **firebaseIntegration.js**:
   - Provides a simple interface for the application to fetch rates
   - Handles errors and ensures the application always has rate data

4. **interestRates.js**: 
   - Maintains the original hardcoded rates as a fallback
   - Used when Firebase is unavailable or the fetch fails

5. **migrateRatesToFirebase.js**:
   - One-time script to upload all historical rate data to Firebase

## Browser Integration

The Firebase SDK is loaded via CDN in the `index.html` file using an import map:

```html
<script type="importmap">
{
  "imports": {
    "zustand": "https://esm.sh/zustand@4.4.1",
    "zustand/vanilla": "https://esm.sh/zustand@4.4.1/vanilla",
    "firebase/app": "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js",
    "firebase/firestore": "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js"
  }
}
</script>
```

This allows the application to use Firebase in the browser environment without bundling.

## Updating Rates in Firebase

To update rates in Firebase:

1. Go to the Firebase Console: https://console.firebase.google.com/
2. Navigate to your project
3. Select "Firestore Database" from the left menu
4. Find the `interestRates` collection
5. Edit the document for the jurisdiction you want to update (e.g., `BC-COIA`)
6. Update the `rates` array, `lastUpdated`, or `validUntil` fields as needed

## Fallback Mechanism

If Firebase is unavailable or the fetch fails, the application will use the local hardcoded rates. This ensures the calculator continues to function even without an internet connection.

## Console Logging

The application includes clear console log messages to indicate whether Firebase data or local fallback data is being used:

- **Firebase Data**: When data is successfully fetched from Firebase, you'll see a green message in the console:
  ```
  ✅ USING FIREBASE DATA: Successfully fetched interest rates from Firebase
  ```

- **Local Fallback Data**: When Firebase data cannot be fetched, you'll see an orange or red message:
  ```
  ⚠️ USING LOCAL FALLBACK DATA: Firebase fetch returned no data
  ```
  or
  ```
  ❌ USING LOCAL FALLBACK DATA: Error connecting to Firebase
  ```

These messages make it easy to verify whether the application is using Firebase data or falling back to local data.

## Troubleshooting

If you encounter issues with the Firebase integration:

1. Check the browser console for error messages and data source indicators
2. Verify that the Firebase configuration in `firebaseConfig.js` is correct
3. Ensure that the Firestore database has been properly set up with the `interestRates` collection
4. Check that the security rules allow read access to the `interestRates` collection
5. Use the test tools (`testFirebase.html` or `npm run test:firebase`) to verify the Firebase connection
