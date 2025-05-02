// Demo Mode Implementation
import { hasVerifiedPayment, setPaymentVerified, clearPaymentVerification, getPaymentExpirationDate } from './paymentVerification.js';
import { redirectToStripeCheckout } from './stripeLoader.js';
import { addToConsoleLayer } from './dom/console.js';

/**
 * Initialize the demo mode features
 */
function initializeDemoMode() {
  // Check payment status
  const isPaid = hasVerifiedPayment();
  
  // Only add demo mode features if not paid
  if (!isPaid) {
    // Add demo-mode class to body
    document.body.classList.add('demo-mode');
    
    addDemoBanner();
    addWatermarks();
    setupDemoModeListeners();
    createDemoModal();
  } else {
    // Show a small indicator that real rates are being used
    addPaidModeIndicator();
  }
  
  // Initialize the action button for both demo and paid modes
  initializeActionButton();
}

/**
 * Initialize the action button in the top-right corner
 * Shows "Buy Now" button in demo mode and "Print" button in paid mode
 */
function initializeActionButton() {
  const isPaid = hasVerifiedPayment();
  const actionButton = document.getElementById('action-button');
  
  if (!actionButton) return;
  
  if (isPaid) {
    // Paid version - Print button
    actionButton.textContent = 'Print';
    actionButton.classList.add('print');
    actionButton.classList.remove('buy-now');
    actionButton.addEventListener('click', handlePrintClick);
  } else {
    // Demo version - Buy Now button with price
    actionButton.textContent = 'Buy Now - $24.99';
    actionButton.classList.add('buy-now');
    actionButton.classList.remove('print');
    actionButton.addEventListener('click', handlePaymentClick);
  }
}

/**
 * Handle the print button click in paid mode
 */
function handlePrintClick() {
  window.print();
}

/**
 * Add the demo banner to the top of the page
 */
function addDemoBanner() {
  const bannerHTML = `
    <div id="demo-mode-banner" class="demo-banner">
      <div class="close-icon" id="close-demo-banner">✕</div>
      <span>Caution:  Demo mode uses mock interest rates</span>
      <button id="get-accurate-results" class="payment-button">Buy Now - $24.99</button>
    </div>
  `;
  
  try {
    // Try to add to console layer first
    const banner = addToConsoleLayer(bannerHTML, { position: 'fixed', top: '-100px' });
    
    // Add click handlers for the payment button and close icon
    banner.querySelector('#get-accurate-results').addEventListener('click', handlePaymentClick);
    banner.querySelector('#close-demo-banner').addEventListener('click', handleCloseBanner);
    
    // Show the banner on first scroll instead of timer
    setupBannerScrollTrigger(banner);
  } catch (error) {
    console.error('Failed to add demo banner to console layer:', error);
    
    // Fallback to original implementation if console layer is not available
    document.body.insertAdjacentHTML('afterbegin', bannerHTML);
    
    // Add click handlers for the payment button and close icon
    document.getElementById('get-accurate-results').addEventListener('click', handlePaymentClick);
    document.getElementById('close-demo-banner').addEventListener('click', handleCloseBanner);
    
    // Show the banner on first scroll (fallback implementation)
    setupBannerScrollTrigger(document.getElementById('demo-mode-banner'));
  }
}

/**
 * Add a paid mode indicator if the user has purchased the calculation
 */
function addPaidModeIndicator() {
  // Get expiration date
  const expirationDate = getPaymentExpirationDate();
  const formattedExpiration = expirationDate ? expirationDate.toLocaleString() : 'Unknown';
  
  const indicatorHTML = `
    <div id="paid-mode-indicator" class="paid-mode-indicator">
      <span>✓ Using verified court order interest rates (expires: ${formattedExpiration})</span>
      <button id="reset-to-demo" class="demo-button">Reset to Demo Mode</button>
    </div>
  `;
  
  try {
    // Try to add to console layer first
    const indicator = addToConsoleLayer(indicatorHTML, { position: 'fixed', top: 0 });
    
    // Add fallback class for browsers that don't support :has()
    document.body.classList.add('paid-mode-body-padding');
    
    // Add click handler for the reset button (for testing)
    indicator.querySelector('#reset-to-demo').addEventListener('click', handleResetToDemoClick);
  } catch (error) {
    console.error('Failed to add paid mode indicator to console layer:', error);
    
    // Fallback to original implementation if console layer is not available
    document.body.insertAdjacentHTML('afterbegin', indicatorHTML);
    
    // Add fallback class for browsers that don't support :has()
    document.body.classList.add('paid-mode-body-padding');
    
    // Add click handler for the reset button (for testing)
    document.getElementById('reset-to-demo').addEventListener('click', handleResetToDemoClick);
  }
}

/**
 * Add "Demonstration" watermark
 */
function addWatermarks() {
  // Remove any existing watermarks first
  document.querySelectorAll('.demo-watermark').forEach(mark => mark.remove());
  
  // Add main watermark relative to the title container
  const titleContainer = document.getElementById('title-container');
  if (titleContainer) {
    // Create the main watermark
    const watermark = document.createElement('div');
    watermark.classList.add('demo-watermark');
    watermark.id = 'main-demo-watermark'; // Add ID for specific styling
    watermark.textContent = 'DEMONSTRATION';
    
    // Append to the title container
    titleContainer.appendChild(watermark);
  } else {
    console.warn('Title container not found for watermark placement.');
  }
  
  // No longer adding watermarks to each page card
  // This reduces visual confusion and prevents the "jumping" effect
}

/**
 * Handle the payment button click
 */
function handlePaymentClick() {
  // Use Stripe checkout to process the payment
  redirectToStripeCheckout()
    .catch(error => {
      console.error('Checkout error:', error);
      // If Stripe checkout fails, show the demo modal as fallback
      showDemoModal();
    });
}

/**
 * Handle the reset to demo mode button click (for testing)
 */
function handleResetToDemoClick() {
  if (confirm("This will reset to demo mode and use mock interest rates. Do you want to continue?")) {
    // Clear payment verification in localStorage
    clearPaymentVerification();
  }
}

/**
 * Set up event listeners related to demo mode
 */
function setupDemoModeListeners() {
  // Show modal after user changes judgment date or debt amount
  const judgmentDateInput = document.querySelector('[data-input="judgmentDate"]');
  const debtAmountInput = document.querySelector('input[data-input="amountValue"]');
  
  if (judgmentDateInput) {
    judgmentDateInput.addEventListener('change', triggerDemoModalAfterDelay);
  }
  
  if (debtAmountInput) {
    debtAmountInput.addEventListener('change', triggerDemoModalAfterDelay);
  }
}

/**
 * Trigger the demo modal after a short delay
 */
function triggerDemoModalAfterDelay() {
  // Wait 1 second after user changes values before showing modal
  setTimeout(() => {
    showDemoModal();
  }, 1000);
}

/**
 * Create the demo modal HTML
 */
function createDemoModal() {
  const modalHTML = `
    <div id="demo-modal" class="demo-modal">
      <div class="demo-modal-content">
        <h2>Demonstration Mode</h2>
        <p>The interest rates used in this demonstration version of this app are for demonstration purposes only. Accurate court order interest rates are only in the paid version.</p>
        <div class="demo-modal-notice">
          <p>The demo version uses slightly modified interest rates:</p>
          <ul>
            <li>Mock rates differ from real rates by ±0.25-1.5%</li>
            <li>Calculations are fully functional but use these approximate rates</li>
            <li>Purchase to use the accurate court-ordered interest rates</li>
          </ul>
        </div>
        <div class="demo-modal-buttons">
          <button id="demo-modal-dismiss" class="demo-modal-dismiss">Dismiss</button>
          <button id="demo-modal-purchase" class="demo-modal-purchase">Purchase - $24.99</button>
        </div>
      </div>
    </div>
  `;
  
  try {
    // Try to add to console layer first
    const modal = addToConsoleLayer(modalHTML);
    
    // Style display: none initially
    modal.style.display = 'none';
    
    // Add event listeners for modal buttons
    modal.querySelector('#demo-modal-dismiss').addEventListener('click', hideModal);
    modal.querySelector('#demo-modal-purchase').addEventListener('click', handlePaymentClick);
  } catch (error) {
    console.error('Failed to add demo modal to console layer:', error);
    
    // Fallback to original implementation
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add event listeners for modal buttons
    document.getElementById('demo-modal-dismiss').addEventListener('click', hideModal);
    document.getElementById('demo-modal-purchase').addEventListener('click', handlePaymentClick);
  }
}

/**
 * Show the demo modal
 */
function showDemoModal() {
  const modal = document.getElementById('demo-modal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

/**
 * Hide the demo modal
 */
function hideModal() {
  const modal = document.getElementById('demo-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Handle the close banner button click
 */
function handleCloseBanner() {
  const banner = document.getElementById('demo-mode-banner');
  if (banner) {
    // Slide the banner up
    banner.style.top = '-100px';
    
    // Remove the 'show' class
    banner.classList.remove('show');
    
    // Don't adjust body padding - keep it consistent
    // This line was causing the issue by setting inline styles
    // document.body.style.paddingTop = '0';
  }
}

/**
 * Setup scroll event listener to show banner on first scroll
 * @param {HTMLElement} banner - The banner element to show
 */
function setupBannerScrollTrigger(banner) {
  if (!banner) return;
  
  // Function to handle scroll event
  const handleScroll = () => {
    // Show the banner
    if (banner) {
      banner.style.top = '0'; // Move it into view
      banner.classList.add('show');
    }
    
    // Remove the scroll event listener after first trigger
    window.removeEventListener('scroll', handleScroll);
  };
  
  // Add scroll event listener
  window.addEventListener('scroll', handleScroll);
}

// Initialize demo mode when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Increased delay to ensure all other DOM setup and layout calculations are complete
  setTimeout(() => {
    initializeDemoMode();
    // Rely on the ResizeObserver in pageBreaksCore.js (setup elsewhere)
    // to handle the initial pagination calculation.
    // No explicit 'content-changed' dispatch needed here.
  }, 300); // Increased delay after DOMContentLoaded for better layout stability
});
