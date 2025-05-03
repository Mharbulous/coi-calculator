// Application Initializer Module
// Handles initialization of the application, including mode detection and setup

import { initializeModeManager, isTestMode, setTestMode, addTestModeIndicator } from './mode-manager.js';
import { initializeStripe } from './stripeLoader.js';
import { hasVerifiedPayment } from './paymentVerification.js';
import useStore from './store.js';

// For development/testing, you can force test mode by setting this to true
// This bypasses the IP check and URL path check
const FORCE_TEST_MODE = false;

/**
 * Initialize the application
 * @returns {Promise<void>}
 */
// A flag to indicate state has been restored
export let stateHasBeenRestored = false;

export async function initializeApp() {
  try {
    console.log('Initializing application...');
    
    // Check for URL parameters that might be used for testing
    const urlParams = new URLSearchParams(window.location.search);
    const debugMode = urlParams.get('debug') === 'true';
    const fromPayment = urlParams.get('from_payment') === 'true' || 
                        sessionStorage.getItem('from_payment') === 'true';
    
    if (debugMode) {
      console.log('Debug mode enabled via URL parameter');
    }
    
    // Clear the from_payment flag after reading it
    if (fromPayment) {
      sessionStorage.removeItem('from_payment');
      console.log('Detected return from payment flow');
    }
    
    // First, initialize the mode manager to detect test vs. live mode
    await initializeModeManager();
    
    // If returning from payment and the payment is verified, try to restore saved state
    if (hasVerifiedPayment()) {
      try {
        // Check if we have saved state in localStorage
        const stateRestored = useStore.getState().restoreStateFromLocalStorage(false); // Don't fall back to defaults
        if (stateRestored) {
          console.log('Successfully restored application state after payment');
          stateHasBeenRestored = true; // Set the flag to true
          
          // Add a custom event that calculator.ui.js can listen for
          setTimeout(() => {
            document.dispatchEvent(new CustomEvent('state-restored-from-payment', {
              detail: { success: true }
            }));
            console.log('Dispatched state-restored-from-payment event');
          }, 0);
        } else {
          console.log('No saved state found to restore after payment');
        }
      } catch (error) {
        console.error('Error restoring application state:', error);
      }
    }
    
    // If in test mode or forced test mode, add visual indicator
    if (isTestMode() || FORCE_TEST_MODE) {
      console.log('Running in TEST MODE');
      
      // If we're forcing test mode for development, set test mode and add the indicator
      if (FORCE_TEST_MODE && !isTestMode()) {
        console.log('Test mode forced for development');
        setTestMode(true);
        addTestModeIndicator(true);
      } else {
        addTestModeIndicator();
      }
    } else {
      console.log('Running in LIVE MODE');
    }
    
    // Initialize Stripe with the appropriate integration
    const stripeResult = await initializeStripe();
    
    if (stripeResult.initialized) {
      console.log('Stripe initialized successfully');
    } else {
      console.warn('Stripe initialization failed, fallback methods will be used');
    }
    
    return {
      success: true,
      testMode: isTestMode() || FORCE_TEST_MODE,
      stripeInitialized: stripeResult.initialized,
      debugMode: debugMode
    };
  } catch (error) {
    console.error('Application initialization error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Initialize the app when this module is loaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM content loaded, initializing app...');
  
  // Wait a short time to ensure other scripts have loaded
  setTimeout(async () => {
    try {
      const result = await initializeApp();
      console.log('App initialization result:', result);
      
      // If we're in debug mode, add some debugging info to the console
      if (result.debugMode) {
        console.log('Debug info:', {
          testMode: result.testMode,
          stripeInitialized: result.stripeInitialized,
          url: window.location.href,
          pathname: window.location.pathname
        });
      }
    } catch (error) {
      console.error('Error during app initialization:', error);
    }
  }, 100);
});
