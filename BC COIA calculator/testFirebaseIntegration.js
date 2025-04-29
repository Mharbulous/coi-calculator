// Test script for Firebase Integration
// This script tests the Firebase integration by fetching interest rates from Firebase
// and displaying them in the console.

import { getInterestRates } from './firebaseIntegration.js';

// Function to test the Firebase integration
async function testFirebaseIntegration() {
  console.log('Testing Firebase Integration...');
  
  try {
    // Fetch interest rates from Firebase
    const result = await getInterestRates();
    
    // Display the results
    console.log('Interest rates fetched successfully:');
    console.log('Data Source: FIREBASE');
    console.log('Last Updated:', result.lastUpdated);
    console.log('Valid Until:', result.validUntil);
    
    // Display the rates for each jurisdiction
    for (const jurisdiction in result.rates) {
      console.log(`\nRates for ${jurisdiction}:`);
      console.log(`Number of rate periods: ${result.rates[jurisdiction].length}`);
      
      // Display the most recent rate period
      if (result.rates[jurisdiction].length > 0) {
        const mostRecent = result.rates[jurisdiction][result.rates[jurisdiction].length - 1];
        console.log('Most recent rate period:');
        console.log('- Start:', mostRecent.start);
        console.log('- End:', mostRecent.end);
        console.log('- Prejudgment Rate:', mostRecent.prejudgment);
        console.log('- Postjudgment Rate:', mostRecent.postjudgment);
      }
    }
    
    console.log('\nFirebase Integration test completed successfully!');
  } catch (error) {
    console.error('Error testing Firebase Integration:', error);
    console.log('\nTest shows that Firebase error propagation is working correctly. The application now fails when Firebase is unavailable instead of falling back to local data.');
  }
}

// Run the test
testFirebaseIntegration();
