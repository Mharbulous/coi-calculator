// Test Script for State Persistence Between Demo and Paid Versions
// This script helps verify that user input data persists during the payment flow

import useStore from './store.js';
import { hasVerifiedPayment, setPaymentVerified, clearPaymentVerification } from './paymentVerification.js';

/**
 * Test function to manually save and restore state
 * This can be used to manually test the persistence functionality
 */
export function testStatePersistence() {
  console.group('State Persistence Test');
  
  // Check if we're in test or production mode
  console.log('Current payment status:', hasVerifiedPayment() ? 'PAID' : 'DEMO');
  
  // Show the current state
  const currentState = useStore.getState();
  console.log('Current application state:', {
    inputs: currentState.inputs,
    specialDamages: currentState.results.specialDamages,
    judgmentTotal: currentState.results.judgmentTotal,
    totalOwing: currentState.results.totalOwing
  });
  
  // Save the current state to localStorage
  try {
    console.log('Saving state to localStorage...');
    const saved = currentState.saveStateToLocalStorage();
    console.log('State saved successfully:', saved);
  } catch (error) {
    console.error('Error saving state:', error);
  }
  
  // Simulate payment verification
  if (!hasVerifiedPayment()) {
    console.log('Simulating payment verification...');
    setPaymentVerified();
    alert('Payment simulation complete. Page will reload to apply changes.');
  } else {
    console.log('Already in paid mode. Clearing payment verification to test demo mode...');
    clearPaymentVerification();
    alert('Payment cleared. Page will reload to switch to demo mode.');
  }
  
  console.groupEnd();
}

/**
 * Function to manually trigger state restore
 * This can be used to restore state without reloading the page
 */
export function testStateRestore() {
  console.group('State Restore Test');
  
  // Check if we have saved state
  const savedStateJSON = localStorage.getItem('coi_calculator_state');
  if (savedStateJSON) {
    console.log('Found saved state in localStorage');
    try {
      // Get current state for comparison
      const currentState = useStore.getState();
      console.log('Current state before restore:', {
        inputs: currentState.inputs,
        specialDamages: currentState.results.specialDamages.length
      });
      
      // Restore the state
      const restored = currentState.restoreStateFromLocalStorage();
      console.log('State restored successfully:', restored);
      
      // Show the new state
      const newState = useStore.getState();
      console.log('State after restore:', {
        inputs: newState.inputs, 
        specialDamages: newState.results.specialDamages.length
      });
      
      alert('State restore complete. Check console for details.');
    } catch (error) {
      console.error('Error restoring state:', error);
      alert('Error restoring state. Check console for details.');
    }
  } else {
    console.log('No saved state found in localStorage');
    alert('No saved state found. Try saving state first.');
  }
  
  console.groupEnd();
}

// Add convenience functions to window object if in browser environment
if (typeof window !== 'undefined') {
  window.testStatePersistence = testStatePersistence;
  window.testStateRestore = testStateRestore;
  
  console.log('State persistence test functions loaded.');
  console.log('Use testStatePersistence() or testStateRestore() to test.');
}
