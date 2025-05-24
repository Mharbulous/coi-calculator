// Test Firebase Error Handling
// This script intentionally breaks the Firebase configuration to test error handling

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { showFirebaseError, logErrorDetails } from './error-handling.js';

// Function to attempt to fetch data and trigger an error
async function testFirebaseError() {
  // Invalid Firebase configuration to trigger an error
  const invalidFirebaseConfig = {
    apiKey: "INVALID_API_KEY",
    authDomain: "invalid-project.firebaseapp.com",
    projectId: "invalid-project",
    storageBucket: "invalid-project.appspot.com",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:0000000000000000000000"
  };

  try {
    // Initialize Firebase with invalid config - moved inside function
    const app = initializeApp(invalidFirebaseConfig);
    const db = getFirestore(app);
    // Try to fetch data from a non-existent collection
    const querySnapshot = await getDocs(collection(db, "nonExistentCollection"));
    
    // If we get here, it means the query unexpectedly succeeded
    // Force an error anyway for testing purposes
    throw new Error('Forced error for testing: Firebase should not work with invalid configuration');
    
  } catch (error) {
    console.error('Expected Firebase error occurred:', error);
    
    // Log detailed error information
    logErrorDetails(error, 'test-firebase-error.js');
    
    // Ensure we're dispatching the event after a small delay to make sure
    // the event listener is set up
    setTimeout(() => {
      // Dispatch a custom event that the main application can listen for
      const errorEvent = new CustomEvent('firebase-rates-error', { detail: error });
      document.dispatchEvent(errorEvent);
      // Event dispatched
    }, 100);
    
    return error;
  }
}

// Export the test function
export { testFirebaseError };

// Auto-execute the test if this script is loaded directly
if (document.currentScript && document.currentScript.getAttribute('data-auto-test') === 'true') {
  testFirebaseError();
}
