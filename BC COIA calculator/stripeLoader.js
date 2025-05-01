// Stripe Loader Module
// Dynamically loads the appropriate Stripe integration based on the current mode

import { isTestMode } from './mode-manager.js';

/**
 * Load the appropriate Stripe integration module based on the current mode
 * @returns {Promise<Object>} The loaded Stripe integration module
 */
export async function loadStripeIntegration() {
  try {
    if (isTestMode()) {
      console.log('Loading test Stripe integration');
      return await import('./stripeIntegration.test.js');
    } else {
      console.log('Loading production Stripe integration');
      return await import('./stripeIntegration.js');
    }
  } catch (error) {
    console.error('Error loading Stripe integration:', error);
    // Fallback to production integration if there's an error
    return await import('./stripeIntegration.js');
  }
}

/**
 * Initialize Stripe with the appropriate integration
 * @returns {Promise<Object>} The initialized Stripe integration
 */
export async function initializeStripe() {
  const stripeModule = await loadStripeIntegration();
  
  // Initialize Stripe
  const success = stripeModule.initStripe();
  
  return {
    module: stripeModule,
    initialized: success
  };
}

/**
 * Redirect to checkout using the appropriate Stripe integration
 * @returns {Promise<void>}
 */
export async function redirectToStripeCheckout() {
  const stripeModule = await loadStripeIntegration();
  return stripeModule.redirectToCheckout();
}
