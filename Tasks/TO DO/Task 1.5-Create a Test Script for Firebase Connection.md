# Task 1.5: Create a Test Script for Firebase Connection

## Overview
This subtask involves creating a simple test script to verify that the application can successfully connect to Firebase and retrieve data from the Firestore database. This validates the setup from previous tasks before we proceed with modifying the actual interest rates module.

## Complexity
Simple

## Estimated Time
30 minutes

## Implementation Steps

### 1. Create a Test Script File
1. Create a new file `BC COIA calculator/firebase-test.js`
2. Set up an ES module structure to import the Firebase configuration:
   ```javascript
   import { db } from './firebase-config.js';
   
   /**
    * Tests the connection to Firebase and retrieves sample interest rate data
    */
   async function testFirebaseConnection() {
     try {
       console.log('Attempting to connect to Firebase...');
       
       // Test retrieving the BC interest rates document
       const doc = await db.collection('interestRates').doc('BC').get();
       
       if (doc.exists) {
         console.log('Firebase connection successful!');
         console.log('Retrieved data:', doc.data());
         
         // Verify data structure
         const rates = doc.data().rates;
         if (rates && Array.isArray(rates) && rates.length > 0) {
           console.log(`Found ${rates.length} interest rate entries`);
           console.log('Sample rate entry:', rates[0]);
         } else {
           console.warn('No rate data found or invalid structure');
         }
       } else {
         console.error('BC document not found in interestRates collection');
       }
       
       // Also test the metadata document
       const metadataDoc = await db.collection('interestRates').doc('metadata').get();
       if (metadataDoc.exists) {
         console.log('Metadata found:', metadataDoc.data());
       } else {
         console.warn('Metadata document not found');
       }
     } catch (error) {
       console.error('Firebase connection error:', error);
     }
   }
   
   // Run the test when the script loads
   testFirebaseConnection();
   ```

### 2. Create HTML Test Page
1. Create a simple HTML file `BC COIA calculator/firebase-test.html` to run the test:
   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>Firebase Connection Test</title>
     
     <!-- Firebase SDK -->
     <script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-app.js"></script>
     <script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-firestore.js"></script>
     
     <!-- If using ES modules with import map -->
     <script type="importmap">
     {
       "imports": {
         "firebase/app": "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js",
         "firebase/firestore": "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js"
       }
     }
     </script>
   </head>
   <body>
     <h1>Firebase Connection Test</h1>
     <p>Open the browser console to see the test results</p>
     
     <!-- Test script -->
     <script type="module" src="firebase-test.js"></script>
   </body>
   </html>
   ```
   Note: Update Firebase version numbers as needed

### 3. Add Import to Main App for Testing
1. Temporarily import the test script in the main application for quick testing:
   ```javascript
   // Add to calculator.ui.js at the end of the file
   // For testing only - remove after confirming connection works
   import './firebase-test.js';
   ```
   Note: This is optional and should be removed after testing

## Testing Steps
1. Open the firebase-test.html file in a browser
2. Check the browser console for test output
3. Verify that the Firebase connection is successful
4. Confirm that rate data is retrieved correctly
5. Ensure there are no connection errors

## Expected Outcome
By the end of this subtask, you should have:
1. A working test script that connects to Firebase
2. Confirmation that your Firebase configuration is correct
3. Verification that the database structure is accessible
4. Console output showing successful data retrieval

## Notes
- This test script is for development only and should not be included in production code
- If using the ES module import approach, make sure your server supports module scripts
- You may need to adjust the Firebase SDK import paths based on your chosen implementation method
- Any errors encountered should be fixed before proceeding to the next task
