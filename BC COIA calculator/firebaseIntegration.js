// Firebase Integration Module
// This module initializes Firebase and provides functions to fetch interest rates
// It will return either real Firebase rates or mock rates based on payment verification

import { firebaseApp, db } from './firebaseConfig.js';
import { fetchRatesFromFirebase } from './firebaseRates.js';
import mockRates, { lastUpdated as mockLastUpdated, validUntil as mockValidUntil } from './mockRates.js';
import { hasVerifiedPayment } from './paymentVerification.js';

// Function to fetch rates and handle errors
export async function getInterestRates() {
  // Check if the user has verified payment
  const isPaid = hasVerifiedPayment();
  
  // Log which rates are being used
  if (isPaid) {
    console.log('%c✅ USING REAL INTEREST RATES: Payment verified', 'color: green; font-weight: bold');
  } else {
    console.log('%c⚠️ USING MOCK INTEREST RATES: Demo mode active', 'color: orange; font-weight: bold');
  }
  
  // If not a verified payment, return mock rates immediately
  if (!isPaid) {
    // Return mock rates with source information
    return {
      rates: mockRates,
      lastUpdated: mockLastUpdated,
      validUntil: mockValidUntil,
      source: 'mock'
    };
  }
  
  // Otherwise, proceed with getting real rates from Firebase
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

// Export payment verification status for use in UI
export { hasVerifiedPayment };
