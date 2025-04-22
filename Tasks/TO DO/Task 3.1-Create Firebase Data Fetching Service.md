# Task 3.1: Create Firebase Data Fetching Service

## Overview
Create a new module to fetch interest rate data from Firebase. This service will handle the connection to Firebase, authentication, and retrieval of interest rate data for the calculator.

## Complexity
Simple

## Estimated Time
30 minutes

## Implementation Steps

1. Create a new file `firebase/rateService.js` to handle Firebase data operations:
   ```javascript
   // Import Firebase modules
   import { getFirestore, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
   import { getAuth, onAuthStateChanged } from 'firebase/auth';
   import { firebaseApp } from './config.js';

   // Initialize Firestore and Auth
   const db = getFirestore(firebaseApp);
   const auth = getAuth(firebaseApp);

   /**
    * Fetches interest rates for a specified jurisdiction from Firebase
    * @param {string} jurisdiction - Jurisdiction code (e.g., 'BC', 'AB', 'ON')
    * @returns {Promise<Object>} - Object containing rates, lastUpdated, and validUntil
    */
   export async function fetchRates(jurisdiction) {
       // Check authentication
       if (!auth.currentUser) {
           throw new Error('User not authenticated. Please log in to access interest rates.');
       }

       try {
           // Get rates collection reference
           const ratesRef = collection(db, 'interestRates');
           
           // Create query for the specific jurisdiction, ordered by start date
           const q = query(
               ratesRef,
               where('jurisdiction', '==', jurisdiction),
               orderBy('start', 'asc')
           );
           
           // Execute query
           const querySnapshot = await getDocs(q);
           
           // Process results
           const rates = [];
           querySnapshot.forEach((doc) => {
               const data = doc.data();
               rates.push({
                   start: data.start.toDate(), // Convert Firestore Timestamp to JS Date
                   prejudgment: data.prejudgment,
                   postjudgment: data.postjudgment
               });
           });
           
           // Get metadata
           const metadataDoc = await getDoc(doc(db, 'metadata', 'ratesInfo'));
           const metadata = metadataDoc.data();
           
           return {
               rates,
               lastUpdated: metadata.lastUpdated.toDate(),
               validUntil: metadata.validUntil.toDate()
           };
       } catch (error) {
           console.error('Error fetching interest rates:', error);
           throw new Error('Failed to retrieve interest rates. Please try again later.');
       }
   }

   /**
    * Checks if the user has valid access to the interest rates
    * @returns {Promise<boolean>} - Whether the user has access
    */
   export async function checkRatesAccess() {
       return new Promise((resolve) => {
           onAuthStateChanged(auth, (user) => {
               resolve(!!user);
           });
       });
   }
   ```

2. Test the fetchRates function with a simple test case:
   ```javascript
   // Test the rates service
   import { fetchRates, checkRatesAccess } from './firebase/rateService.js';

   async function testRatesService() {
       try {
           const hasAccess = await checkRatesAccess();
           console.log('User has access:', hasAccess);
           
           if (hasAccess) {
               const bcRates = await fetchRates('BC');
               console.log('BC Rates:', bcRates);
           }
       } catch (error) {
           console.error('Test failed:', error);
       }
   }

   // Run the test
   testRatesService();
   ```

## Testing Procedures
1. Ensure Firebase configuration is properly set up
2. Login with a test user account
3. Run the test script to verify rates can be fetched
4. Check that error handling works correctly when unauthenticated

## Expected Outcome
A functioning service that:
- Successfully connects to Firebase
- Authenticates the user
- Retrieves interest rate data
- Properly formats the data for use by the calculator
- Handles errors appropriately

## Notes
- This service will be used by the modified interestRates.js module
- Ensure proper error handling for network issues
- Add appropriate comments for maintainability
- The service should validate the data received from Firebase
