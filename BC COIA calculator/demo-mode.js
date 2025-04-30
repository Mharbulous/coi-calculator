// Demo Mode Implementation
import { hasVerifiedPayment, setPaymentVerified, clearPaymentVerification, getPaymentExpirationDate } from './paymentVerification.js';

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
}

/**
 * Add the demo banner to the top of the page
 */
function addDemoBanner() {
  const bannerHTML = `
    <div id="demo-mode-banner" class="demo-banner">
      <span>DEMO MODE - Please purchase access to accurate court order interest rates</span>
      <button id="get-accurate-results" class="payment-button">Purchase Calculation - $24.99</button>
    </div>
  `;
  document.body.insertAdjacentHTML('afterbegin', bannerHTML);
  
  // Add click handler for the payment button
  document.getElementById('get-accurate-results').addEventListener('click', handlePaymentClick);
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
  document.body.insertAdjacentHTML('afterbegin', indicatorHTML);
  
  // Add fallback class for browsers that don't support :has()
  document.body.classList.add('paid-mode-body-padding');
  
  // Add click handler for the reset button (for testing)
  document.getElementById('reset-to-demo').addEventListener('click', handleResetToDemoClick);
}

/**
 * Add "Demonstration" watermarks
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
    watermark.textContent = 'DEMONSTRATION';
    
    // Append to the title container
    titleContainer.appendChild(watermark);
  } else {
    console.warn('Title container not found for watermark placement.');
  }
  
  // Also add watermarks to each page card for printing
  const pageCards = document.querySelectorAll('.page-card');
  pageCards.forEach(card => {
    // Ensure the card has position relative
    if (getComputedStyle(card).position === 'static') {
      card.style.position = 'relative';
    }
    
    const watermark = document.createElement('div');
    watermark.classList.add('demo-watermark');
    watermark.textContent = 'DEMONSTRATION';
    
    // Append at the end to ensure it's on top
    card.appendChild(watermark);
  });
}

/**
 * Handle the payment button click
 */
function handlePaymentClick() {
  // For now, simulate a successful payment for testing purposes
  // This will be replaced with actual Stripe payment processing in Task 46
  if (confirm("This will simulate a successful payment and provide access to the real interest rates. Do you want to continue?")) {
    // Set payment as verified in localStorage
    setPaymentVerified();
  } else {
    // If canceled, just show the modal
    showDemoModal();
  }
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
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Add event listeners for modal buttons
  document.getElementById('demo-modal-dismiss').addEventListener('click', hideModal);
  document.getElementById('demo-modal-purchase').addEventListener('click', handlePaymentClick);
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

// Initialize demo mode when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure all other DOM setup is complete
  setTimeout(initializeDemoMode, 100);
});
