// Stripe Integration Module - TEST VERSION
// This module handles Stripe checkout integration for the test environment

// Stripe publishable key (test)
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RBUeBRahO4v2IFYFasBHY08RtJFzYPcEwojPepn8NytrNUVqKkGuwaRKhCBmegsskQLNliZ7DStGDRjUzWiV4Ak00HAMXHyWS';

// Price ID for the COI Calculator product (test)
const PRODUCT_PRICE_ID = 'price_1RC3fJRahO4v2IFY9yNoptZg';

// Stripe direct payment link (test)
// Updated to use the payment link configured with success and cancel URLs
const PAYMENT_LINK = 'https://buy.stripe.com/test_3cs3f7eXE7VGa0E8ww';

// URLs for success and cancel pages - using absolute URLs for the test site
const SUCCESS_URL = `https://www.courtorderinterestcalculator.com/test/success.html?session_id={CHECKOUT_SESSION_ID}`;
const CANCEL_URL = `https://www.courtorderinterestcalculator.com/test/cancel.html`;

// Stripe instance and Buy Button ID
let stripe;
const BUY_BUTTON_ID = 'buy_btn_1RJg6URahO4v2IFYd5LRtRqd';

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
 * Initiate Stripe Checkout with proper redirect URLs
 * This approach uses Stripe's Checkout API for a more controlled flow
 * @returns {Promise<void>}
 */
export async function redirectToCheckout() {
  try {
    // Show loading indicator
    showLoadingIndicator();
    
    // If ad blocker detected or Stripe isn't initialized properly,
    // use the direct payment link that's configured in the Stripe dashboard
    if (adBlockerDetected || typeof Stripe === 'undefined' || !stripe) {
      console.log('Using direct payment link due to ad blocker or Stripe initialization issue');
      setTimeout(() => {
        window.location.href = PAYMENT_LINK;
      }, 500);
      return;
    }
    
    try {
      // Try to create a checkout session directly
      const { error } = await stripe.redirectToCheckout({
        lineItems: [{ price: PRODUCT_PRICE_ID, quantity: 1 }],
        mode: 'payment',
        successUrl: SUCCESS_URL,
        cancelUrl: CANCEL_URL,
        allowPromotionCodes: true, // Enable coupon/promotion code field
      });
      
      if (error) {
        console.error('Stripe checkout error:', error);
        // Fallback to direct payment link
        window.location.href = PAYMENT_LINK;
      }
    } catch (checkoutError) {
      console.error('Error creating checkout session:', checkoutError);
      
      // Fallback to Buy Button approach
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
    }
  } catch (error) {
    console.error('General error in redirectToCheckout:', error);
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
