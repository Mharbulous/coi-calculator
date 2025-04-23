# Step 1: Firebase Setup and Configuration

## Overview
This step involves setting up a Firebase project and configuring a database to store the interest rate data. This forms the foundation of our cloud-based interest rate storage solution.

## Implementation Details

### Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Name the project (e.g., "COI-Calculator")
4. Configure Google Analytics (optional but recommended)
5. Create the project

### Choose and Configure Database
1. In the Firebase Console, navigate to "Build > Firestore Database" or "Realtime Database"
   - Firestore is recommended for better querying capabilities
   - Realtime Database is simpler but sufficient for this use case
2. Click "Create database"
3. Start in test mode initially for easier development 
   - We'll tighten security rules later
4. Choose a database location close to your target users

### Set Up Interest Rates Collection/Structure
1. Create a collection/node called "interestRates"
2. Create documents/objects for each jurisdiction (BC, AB, ON, etc.)
3. For each jurisdiction, create an array of rate objects with:
   - start (date string in "YYYY-MM-DD" format)
   - prejudgment (number)
   - postjudgment (number)

### Example Firestore Structure
```
interestRates (collection)
|
├── BC (document)
|   └── rates (array)
|       ├── { start: "1993-01-01", prejudgment: 5.25, postjudgment: 7.25 }
|       ├── { start: "1993-07-01", prejudgment: 4.00, postjudgment: 6.00 }
|       └── ...additional rates
|
├── metadata (document)
|   ├── lastUpdated: "2025-04-19"
|   └── validUntil: "2025-06-30"
|
└── ... other jurisdictions
```

### Add Metadata
Create a "metadata" document with:
- lastUpdated: Date when rates were last updated
- validUntil: Date until which rates are valid

### Register Web App
1. In the Firebase Console, click on "Project Overview"
2. Click the web icon (</>) to add a web app
3. Register your app with a nickname (e.g., "COI Calculator Web")
4. Copy the Firebase configuration snippet for later use
5. Continue to the console

### Install Firebase SDK
Add the Firebase SDK to your project by updating the index.html:

```html
<!-- Add before your existing scripts -->
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-auth.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-firestore.js"></script>
<!-- Or use npm/modules if your project supports it -->
```

### Create Firebase Config Module
Create a new file `BC COIA calculator/firebase-config.js`:

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
firebase.initializeApp(firebaseConfig);

// Export Firebase services
export const db = firebase.firestore(); // or firebase.database() for Realtime Database
export const auth = firebase.auth();
```

### Configure Security Rules (Basic)
Set up basic security rules for development:

For Firestore:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to rates for testing
    match /interestRates/{document=**} {
      allow read: true;
      allow write: if false; // No write access from client
    }
  }
}
```

For Realtime Database:
```
{
  "rules": {
    "interestRates": {
      ".read": true,
      ".write": false
    }
  }
}
```

## Testing Steps
1. Manually add a few test records in the Firebase Console
2. Use Firebase Console's Data Viewer to confirm data structure
3. Create a simple test script to verify you can retrieve data:

```javascript
import { db } from './firebase-config.js';

async function testFirebaseConnection() {
  try {
    const doc = await db.collection('interestRates').doc('BC').get();
    if (doc.exists) {
      console.log('Firebase connection successful:', doc.data());
    } else {
      console.log('No data found!');
    }
  } catch (error) {
    console.error('Firebase connection error:', error);
  }
}

testFirebaseConnection();
```

## Security Considerations
- Keep your Firebase config details secure
- Do not commit API keys directly to version control
- Remember to update security rules before production

## Next Steps
After completing this step, you'll have a Firebase project setup with a database structure ready to store interest rates. Next, you'll create the access control module to handle authentication.
