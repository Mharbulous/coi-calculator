// Stripe Integration Module
// This module handles Stripe checkout integration

// Stripe publishable key (test)
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RBUeBRahO4v2IFYFasBHY08RtJFzYPcEwojPepn8NytrNUVqKkGuwaRKhCBmegsskQLNliZ7DStGDRjUzWiV4Ak00HAMXHyWS';

// Price ID for the COI Calculator product (test)
const PRODUCT_PRICE_ID = 'price_1RJedEDKPUV593QMByW73wjW';

// Stripe direct payment link (test)
const PAYMENT_LINK = 'https://buy.stripe.com/test_3cs3f7eXE7VGa0E8ww';

// Stripe instance and Buy Button ID
let stripe;
const BUY_BUTTON_ID = 'buy_btn_1RJg6URahO4v2IFYFasBHY08RtJFzYPcEwojPepn8NytrNUVqKkGuwaRKhCBmegsskQLNliZ7DStGDRjUzWiV4Ak00HAMXHyWS';

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
 * Initiate Stripe Checkout with Buy Button
 * This approach uses Stripe's Buy Button while keeping our custom UI
 * @returns {Promise<void>}
 */
export async function redirectToCheckout() {
  try {
    // Show loading indicator
    showLoadingIndicator();
    
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
    
    // Wait for the component to be ready
    setTimeout(() => {
      try {
        // Find the button inside the Stripe component and click it
        const stripeBuyButton = document.querySelector('stripe-buy-button');
        if (stripeBuyButton && stripeBuyButton.shadowRoot) {
          const actualButton = stripeBuyButton.shadowRoot.querySelector('button');
          if (actualButton) {
            actualButton.click();
            console.log('Stripe Buy Button clicked');
          } else {
            console.error('Could not find button in Stripe Buy Button shadow DOM');
            // Fall back to direct link if we can't find the button
            window.location.href = PAYMENT_LINK;
          }
        } else {
          console.error('Could not find Stripe Buy Button or it has no shadow root');
          // Fall back to direct link if the component isn't ready
          window.location.href = PAYMENT_LINK;
        }
      } catch (innerError) {
        console.error('Error clicking Stripe Buy Button:', innerError);
        // Fall back to direct link
        window.location.href = PAYMENT_LINK;
      }
    }, 1000); // Wait for the component to initialize
    
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
