// Stripe Integration Module
// This module handles Stripe checkout integration

// Stripe publishable key (live)
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51RBUdxDKPUV593QMcEYvUeQujcCjUhOhqQITsM3FrPvFnM6FAxKW8ZV8fWD1xMkj0Oh8JKtL4R7BMNGZCjbFPgY800Ex0bXWRv';

// Price ID for the COI Calculator product (live)
const PRODUCT_PRICE_ID = 'price_1RJedEDKPUV593QMByW73wjW';

// Stripe direct payment link
const PAYMENT_LINK = 'https://buy.stripe.com/5kAbJY80XbR0azKbII';

// Stripe instance
let stripe;

/**
 * Initialize Stripe with the publishable key
 * @returns {boolean} Whether Stripe was successfully initialized
 */
export function initStripe() {
  if (typeof Stripe !== 'undefined') {
    try {
      stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
      console.log('Stripe initialized');
      return true;
    } catch (error) {
      console.error('Error initializing Stripe:', error);
      return false;
    }
  } else {
    console.error('Stripe.js not loaded');
    return false;
  }
}

/**
 * Redirect to Stripe Checkout
 * @returns {Promise<void>}
 */
export async function redirectToCheckout() {
  try {
    // Show loading indicator
    showLoadingIndicator();
    
    // Use the direct payment link created in the Stripe dashboard
    window.location.href = PAYMENT_LINK;
    
    // Since we're redirecting, the loading indicator will be hidden
    // when the user navigates back from Stripe
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred while processing your payment. Please try again later.');
    hideLoadingIndicator();
  }
}

/**
 * Show a loading indicator when redirecting to Stripe
 */
function showLoadingIndicator() {
  // Create loading overlay if it doesn't exist
  if (!document.getElementById('stripe-loading-overlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'stripe-loading-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    `;
    
    const loadingContent = document.createElement('div');
    loadingContent.style.cssText = `
      background-color: white;
      padding: 30px;
      border-radius: 5px;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    `;
    
    loadingContent.innerHTML = `
      <h3>Redirecting to Secure Payment...</h3>
      <p>Please wait while we connect to Stripe.</p>
      <div class="spinner" style="
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        animation: spin 2s linear infinite;
        margin: 15px auto;
      "></div>
    `;
    
    // Add keyframe animation for spinner
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    overlay.appendChild(loadingContent);
    document.body.appendChild(overlay);
  } else {
    document.getElementById('stripe-loading-overlay').style.display = 'flex';
  }
}

/**
 * Hide the loading indicator
 */
function hideLoadingIndicator() {
  const overlay = document.getElementById('stripe-loading-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

// Initialize Stripe when the script loads
document.addEventListener('DOMContentLoaded', initStripe);
