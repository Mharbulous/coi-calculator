// Firebase Integration Module
// This module initializes Firebase and provides functions to fetch interest rates

import { firebaseApp, db } from './firebaseConfig.js';
import { fetchRatesFromFirebase } from './firebaseRates.js';

// Initialize Firebase when this module is loaded
console.log('*************************************************************');
console.log('************** FIREBASE INTEGRATION MODULE LOADED ***********');
console.log('*************************************************************');

// Function to fetch rates and handle errors
export async function getInterestRates() {
  try {
    // Try to fetch rates from Firebase
    const result = await fetchRatesFromFirebase();
    
    // Check if we got data from Firebase
    if (result.source === 'firebase') {
      console.log('%c✅ USING FIREBASE DATA: Successfully fetched interest rates from Firebase', 'color: green; font-weight: bold');
      return result;
    } else {
      // This should not happen with our updated fetchRatesFromFirebase function
      // But just in case, throw an error
      console.error('Unexpected result from fetchRatesFromFirebase');
      throw new Error('Failed to fetch interest rates from Firebase');
    }
  } catch (error) {
    // Log error and propagate it (no fallback to local rates)
    console.error('Error fetching interest rates from Firebase:', error);
    console.log('%c❌ FIREBASE ERROR: Unable to load interest rates', 'color: red; font-weight: bold');
    
    // Propagate the error instead of falling back to local rates
    throw error;
  }
}

// Export Firebase instances for potential future use
export { firebaseApp, db };
