// Test Firebase Error Handling
// This script intentionally breaks the Firebase configuration to test error handling

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { showFirebaseError, logErrorDetails } from './error-handling.js';

console.log('*************************************************************');
console.log('************** TESTING FIREBASE ERROR HANDLING **************');
console.log('*************************************************************');

// Invalid Firebase configuration to trigger an error
const invalidFirebaseConfig = {
  apiKey: "INVALID_API_KEY",
  authDomain: "invalid-project.firebaseapp.com",
  projectId: "invalid-project",
  storageBucket: "invalid-project.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000000000"
};

// Initialize Firebase with invalid config
const app = initializeApp(invalidFirebaseConfig);
const db = getFirestore(app);

// Function to attempt to fetch data and trigger an error
async function testFirebaseError() {
  try {
    console.log('Attempting to fetch data with invalid Firebase configuration...');
    
    // Try to fetch data from a non-existent collection
    const querySnapshot = await getDocs(collection(db, "nonExistentCollection"));
    
    // This should not execute, but just in case
    console.log('Unexpectedly succeeded in fetching data:', querySnapshot.size);
    return null; // Return null to indicate no error occurred (shouldn't happen)
    
  } catch (error) {
    console.error('Expected Firebase error occurred:', error);
    
    // Log detailed error information
    logErrorDetails(error, 'test-firebase-error.js');
    
    // Dispatch a custom event that the main application can listen for
    const errorEvent = new CustomEvent('firebase-rates-error', { detail: error });
    document.dispatchEvent(errorEvent);
    
    return error;
  }
}

// Export the test function
export { testFirebaseError };

// Auto-execute the test if this script is loaded directly
if (document.currentScript && document.currentScript.getAttribute('data-auto-test') === 'true') {
  console.log('Auto-executing Firebase error test...');
  testFirebaseError();
}
