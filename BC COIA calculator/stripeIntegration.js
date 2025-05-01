// Stripe Integration Module - PRODUCTION VERSION
// This module handles Stripe checkout integration

// Stripe publishable key (production)
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51RBUdxDKPUV593QMcEYvUeQujcCjUhOhqQITsM3FrPvFnM6FAxKW8ZV8fWD1xMkj0Oh8JKtL4R7BMNGZCjbFPgY800Ex0bXWRv';

// Price ID for the COI Calculator product (production)
const PRODUCT_PRICE_ID = 'price_1RJedEDKPUV593QMByW73wjW';

// Stripe direct payment link (production)
const PAYMENT_LINK = 'https://buy.stripe.com/5kAbJY80XbR0azKbII';

// Stripe instance and Buy Button ID
let stripe;
const BUY_BUTTON_ID = 'buy_btn_1RJlH5DKPUV593QM78WuqO7S';

// Flag to detect if an ad blocker is present
let adBlockerDetected = false;

/**
 * Initialize Stripe with the publishable key
 * @returns {boolean} Whether Stripe was successfully initialized
 */
export function initStripe() {
  if (typeof Stripe !== 'undefined') {
    try {
      // Detect ad blockers by setting up a test request
      detectAdBlocker();
      
      stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
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
 * Detect if an ad blocker is active by attempting a test request
 * This helps us provide fallbacks when Stripe's analytics are blocked
 */
function detectAdBlocker() {
  // Create a test image request to a common ad tracking domain
  const testImg = document.createElement('img');
  testImg.style.display = 'none';
  
  // Set up error handler - if this fails, likely due to ad blocker
  testImg.onerror = () => {
    adBlockerDetected = true;
  };
  
  // If image loads, no blocker present
  testImg.onload = () => {
    adBlockerDetected = false;
    testImg.remove();
  };
  
  // Attempt to load a dummy image from a commonly blocked domain
  testImg.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
  document.body.appendChild(testImg);
  
  // Also check for Fetch API blocks with a common analytics domain
  // We wrap in try-catch to prevent unhandled promise rejections
  try {
    fetch('https://www.google-analytics.com/analytics.js', { 
      mode: 'no-cors',
      cache: 'no-cache'
    }).catch(() => {
      // If fetch fails, likely due to ad blocker
      adBlockerDetected = true;
    });
  } catch (e) {
    // Suppress errors
    adBlockerDetected = true;
  }
}

/**
 * Initiate Stripe Checkout with Buy Button
 * This approach uses Stripe's Buy Button while keeping our custom UI
 * @returns {Promise<void>}
 */
export async function redirectToCheckout() {
  try {
    // Show loading indicator
    showLoadingIndicator();
    
    // If ad blocker detected or Stripe isn't initialized properly,
    // skip the component approach and use direct link immediately
    if (adBlockerDetected || typeof Stripe === 'undefined' || !stripe) {
      setTimeout(() => {
        window.location.href = PAYMENT_LINK;
      }, 500);
      return;
    }
    
    // Create a hidden Stripe Buy Button element that we'll trigger programmatically
    const buyButtonContainer = document.createElement('div');
    buyButtonContainer.style.position = 'absolute';
    buyButtonContainer.style.visibility = 'hidden';
    buyButtonContainer.innerHTML = `
      <stripe-buy-button
        buy-button-id="${BUY_BUTTON_ID}"
        publishable-key="${STRIPE_PUBLISHABLE_KEY}"
      >
      </stripe-buy-button>
    `;
    document.body.appendChild(buyButtonContainer);
    
    // Set a timeout to ensure we don't wait forever
    const redirectTimeout = setTimeout(() => {
      window.location.href = PAYMENT_LINK;
    }, 3000); // Fail-safe timeout
    
    // Wait for the component to be ready
    setTimeout(() => {
      try {
        // Find the button inside the Stripe component and click it
        const stripeBuyButton = document.querySelector('stripe-buy-button');
        if (stripeBuyButton && stripeBuyButton.shadowRoot) {
          const actualButton = stripeBuyButton.shadowRoot.querySelector('button');
          if (actualButton) {
            clearTimeout(redirectTimeout); // Clear the fail-safe
            actualButton.click();
          } else {
            window.location.href = PAYMENT_LINK;
          }
        } else {
          window.location.href = PAYMENT_LINK;
        }
      } catch (innerError) {
        // Suppress error details to avoid console noise
        window.location.href = PAYMENT_LINK;
      }
    }, 1000); // Wait for the component to initialize
    
  } catch (error) {
    // Suppress specific error details to avoid console noise
    window.location.href = PAYMENT_LINK;
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

/**
 * Handle unhandled promise rejections that might come from Stripe
 * This prevents console errors from appearing when ad blockers intercept requests
 */
window.addEventListener('unhandledrejection', event => {
  if (event.reason && 
      (event.reason.message && event.reason.message.includes('Failed to fetch') ||
       event.reason.toString().includes('Failed to fetch') || 
       event.reason.toString().includes('ERR_BLOCKED_BY_CLIENT'))) {
    
    // This is likely a blocked request from Stripe - prevent it from showing in console
    event.preventDefault();
    
    // If this is happening, make sure our ad blocker flag is set
    adBlockerDetected = true;
  }
});

// Initialize Stripe when the script loads
document.addEventListener('DOMContentLoaded', initStripe);

// Expose a function to check if an ad blocker is detected
export function isAdBlockerDetected() {
  return adBlockerDetected;
}
