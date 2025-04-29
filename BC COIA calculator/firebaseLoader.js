// Firebase Loader Script
// This script imports the Firebase integration and logs the data source

import { getInterestRates } from './firebaseIntegration.js';
import { logErrorDetails } from './error-handling.js';

// Log a message to indicate that the Firebase loader is running
console.log('*************************************************************');
console.log('***************** FIREBASE LOADER RUNNING *******************');
console.log('*************************************************************');

// Function to load interest rates from Firebase
async function loadFirebaseRates() {
  console.log('Loading interest rates from Firebase...');
  
  try {
    // Get interest rates from Firebase
    const result = await getInterestRates();
    
    // Log the result
    console.log('Interest rates loaded:');
    console.log('- Source:', result.source);
    console.log('- Last Updated:', result.lastUpdated);
    console.log('- Valid Until:', result.validUntil);
    console.log('- Number of BC rates:', result.rates.BC ? result.rates.BC.length : 0);
    
    // Return the result
    return result;
  } catch (error) {
    console.error('Error loading interest rates:', error);
    
    // Log detailed error information
    logErrorDetails(error, 'firebaseLoader.js');
    
    // Publish a custom event that the main application can listen for
    const errorEvent = new CustomEvent('firebase-rates-error', { detail: error });
    document.dispatchEvent(errorEvent);
    
    // Propagate the error
    throw error;
  }
}

// Load the rates but don't catch errors here, let them propagate
loadFirebaseRates();

// Export the function for potential future use
export { loadFirebaseRates };
