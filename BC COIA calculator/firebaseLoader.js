// Firebase Loader Script
// This script imports the Firebase integration and logs the data source

import { getInterestRates } from './firebaseIntegration.js';

// Log a message to indicate that the Firebase loader is running
console.log('*************************************************************');
console.log('***************** FIREBASE LOADER RUNNING *******************');
console.log('*************************************************************');

// Function to load interest rates from Firebase
async function loadFirebaseRates() {
  console.log('Loading interest rates from Firebase...');
  
  // Get interest rates from Firebase - let errors propagate to the caller
  const result = await getInterestRates();
  
  // Log the result
  console.log('Interest rates loaded:');
  console.log('- Source:', result.source);
  console.log('- Last Updated:', result.lastUpdated);
  console.log('- Valid Until:', result.validUntil);
  console.log('- Number of BC rates:', result.rates.BC ? result.rates.BC.length : 0);
  
  // Return the result
  return result;
}

// Load the rates
loadFirebaseRates();

// Export the function for potential future use
export { loadFirebaseRates };
