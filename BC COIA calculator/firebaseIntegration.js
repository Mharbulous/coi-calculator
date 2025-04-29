// Firebase Integration Module
// This module initializes Firebase and provides functions to fetch interest rates

import { firebaseApp, db } from './firebaseConfig.js';
import { fetchRatesFromFirebase } from './firebaseRates.js';

// Function to fetch rates and handle errors
export async function getInterestRates() {
  try {
    // Try to fetch rates from Firebase
    const result = await fetchRatesFromFirebase();
    
    // Check if we got data from Firebase
    if (result.source === 'firebase') {
      return result;
    } else {
      // This should not happen with our updated fetchRatesFromFirebase function
      // But just in case, throw an error
      console.error('Unexpected result from fetchRatesFromFirebase');
      throw new Error('Failed to fetch interest rates from Firebase');
    }
  } catch (error) {
    // Log error and propagate it
    console.error('Error fetching interest rates from Firebase:', error);
    
    // Propagate the error to be handled by the application
    throw error;
  }
}

// Export Firebase instances for potential future use
export { firebaseApp, db };
