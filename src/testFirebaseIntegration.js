// Test script for Firebase Integration
// This script tests the Firebase integration by fetching interest rates from Firebase
// and displaying them in the console.

import { getInterestRates } from './firebaseIntegration.js';

// Function to test the Firebase integration
async function testFirebaseIntegration() {
  try {
    // Fetch interest rates from Firebase
    const result = await getInterestRates();
    
    // Process the results silently
    // Data is available but not logged to console
    
  } catch (error) {
    console.error('Error testing Firebase Integration:', error);
  }
}

// Run the test
testFirebaseIntegration();
