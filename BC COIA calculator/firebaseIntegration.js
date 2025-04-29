// Firebase Integration Module
// This module initializes Firebase and provides functions to fetch interest rates

import { firebaseApp, db } from './firebaseConfig.js';
import { fetchRatesFromFirebase } from './firebaseRates.js';
import { default as localRates, lastUpdated, validUntil } from './interestRates.js';

// Initialize Firebase when this module is loaded
console.log('*************************************************************');
console.log('************** FIREBASE INTEGRATION MODULE LOADED ***********');
console.log('*************************************************************');

// Function to fetch rates and handle errors
export async function getInterestRates() {
  try {
    // Try to fetch rates from Firebase
    const result = await fetchRatesFromFirebase();
    
    // Check if we got data from Firebase or are using the fallback
    if (result.source === 'firebase') {
      console.log('%c✅ USING FIREBASE DATA: Successfully fetched interest rates from Firebase', 'color: green; font-weight: bold');
    } else {
      console.log('%c⚠️ USING LOCAL FALLBACK DATA: Firebase fetch returned no data', 'color: orange; font-weight: bold');
    }
    
    return result;
  } catch (error) {
    // Log error and fall back to local rates
    console.error('Error fetching interest rates from Firebase:', error);
    console.log('%c❌ USING LOCAL FALLBACK DATA: Error connecting to Firebase', 'color: red; font-weight: bold');
    
    return {
      rates: localRates,
      lastUpdated,
      validUntil,
      source: 'local'
    };
  }
}

// Export Firebase instances for potential future use
export { firebaseApp, db };
