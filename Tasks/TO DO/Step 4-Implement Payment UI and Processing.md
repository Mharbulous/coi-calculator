# Step 4: Implement Payment UI and Processing

## Overview
This step involves creating the user interface for authentication and payment processing. This includes developing a modal payment screen, integrating with a payment processor, and handling the authorization flow that grants users access to the interest rate data.

## Implementation Details

### Create New Files
1. Create `BC COIA calculator/payment-ui.js` - Handles payment UI components
2. Create `BC COIA calculator/payment-processor.js` - Manages payment processing
3. Create `BC COIA calculator/styles/components/payment-screen.css` - Styles for payment UI

### Payment UI Implementation

#### 1. Create the Payment Modal
Implement a modal that appears when users don't have access to interest rates:

```javascript
// BC COIA calculator/payment-ui.js
import FirebaseAccessControl from './firebase-access-control.js';
import { processPayment } from './payment-processor.js';

export class PaymentUI {
  constructor() {
    this.modalContainer = null;
    this.isInitialized = false;
  }
  
  // Initialize the UI components
  initialize() {
    if (this.isInitialized) return;
    
    // Create modal container if it doesn't exist
    this.createModalContainer();
    
    // Add event listeners for authentication state changes
    document.addEventListener('auth-state-changed', (event) => {
      if (event.detail.authenticated) {
        this.hidePaymentModal();
      }
    });
    
    // Add event listeners for payment errors
    document.addEventListener('payment-error', (event) => {
      this.showError(event.detail.message);
    });
    
    this.isInitialized = true;
  }
  
  // Create the modal container and append to body
  createModalContainer() {
    // Create container if it doesn't exist
    if (!this.modalContainer) {
      this.modalContainer = document.createElement('div');
      this.modalContainer.className = 'payment-modal-container';
      this.modalContainer.style.display = 'none';
      
      // Create modal content
      this.modalContainer.innerHTML = `
        <div class="payment-modal">
          <div class="payment-modal-header">
            <h2>Court Order Interest Calculator</h2>
            <p>Access to interest rate data requires a subscription</p>
          </div>
          
          <div class="payment-modal-body">
            <div class="payment-option">
              <h3>Full Access</h3>
              <p class="price">$29.99</p>
              <ul>
                <li>Complete interest rate data</li>
                <li>All jurisdictions</li>
                <li>12 months of updates</li>
                <li>Unlimited calculations</li>
              </ul>
              <button class="payment-button" id="subscribe-button">Subscribe Now</button>
            </div>
            
            <div class="payment-form-container" style="display: none;">
              <form id="payment-form">
                <div class="form-group">
                  <label for="email">Email (for receipt)</label>
                  <input type="email" id="email" required>
                </div>
                
                <div class="form-group">
                  <label>Card Information</label>
                  <div id="card-element">
                    <!-- Stripe Elements Placeholder -->
                    <div class="card-placeholder">
                      <input type="text" id="card-number" placeholder="Card number">
                      <div class="card-details">
                        <input type="text" id="card-expiry" placeholder="MM/YY">
                        <input type="text" id="card-cvc" placeholder="CVC">
                      </div>
                    </div>
                  </div>
                  <div id="card-errors" role="alert"></div>
                </div>
                
                <button type="submit" id="payment-submit-button">Pay $29.99</button>
                <button type="button" id="payment-cancel-button">Cancel</button>
              </form>
            </div>
            
            <div class="payment-success" style="display: none;">
              <div class="success-icon">✓</div>
              <h3>Payment Successful!</h3>
              <p>Thank you for your purchase. You now have full access to the calculator.</p>
              <button id="continue-button">Continue to Calculator</button>
            </div>
            
            <div class="payment-loading" style="display: none;">
              <div class="spinner"></div>
              <p>Processing your payment...</p>
            </div>
          </div>
          
          <div class="payment-modal-footer">
            <p>Secure payment processing</p>
            <p class="terms">By purchasing, you agree to our <a href="#" target="_blank">Terms of Service</a></p>
          </div>
        </div>
      `;
      
      // Append to body
      document.body.appendChild(this.modalContainer);
      
      // Add event listeners
      this.attachEventListeners();
    }
  }
  
  // Attach event listeners to buttons and forms
  attachEventListeners() {
    // Subscribe button
    const subscribeButton = this.modalContainer.querySelector('#subscribe-button');
    subscribeButton.addEventListener('click', () => {
      this.showPaymentForm();
    });
    
    // Payment form
    const paymentForm = this.modalContainer.querySelector('#payment-form');
    paymentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.processPayment();
    });
    
    // Cancel button
    const cancelButton = this.modalContainer.querySelector('#payment-cancel-button');
    cancelButton.addEventListener('click', () => {
      this.hidePaymentForm();
    });
    
    // Continue button (after successful payment)
    const continueButton = this.modalContainer.querySelector('#continue-button');
    continueButton.addEventListener('click', () => {
      this.hidePaymentModal();
    });
  }
  
  // Show the payment modal
  showPaymentModal() {
    if (!this.isInitialized) {
      this.initialize();
    }
    
    // Reset the modal state
    this.resetModalState();
    
    // Show the modal
    this.modalContainer.style.display = 'flex';
    
    // Prevent scrolling on the body
    document.body.style.overflow = 'hidden';
  }
  
  // Hide the payment modal
  hidePaymentModal() {
    if (this.modalContainer) {
      this.modalContainer.style.display = 'none';
      
      // Re-enable scrolling
      document.body.style.overflow = '';
    }
  }
  
  // Show the payment form
  showPaymentForm() {
    const optionContainer = this.modalContainer.querySelector('.payment-option');
    const formContainer = this.modalContainer.querySelector('.payment-form-container');
    
    optionContainer.style.display = 'none';
    formContainer.style.display = 'block';
  }
  
  // Hide the payment form
  hidePaymentForm() {
    const optionContainer = this.modalContainer.querySelector('.payment-option');
    const formContainer = this.modalContainer.querySelector('.payment-form-container');
    
    formContainer.style.display = 'none';
    optionContainer.style.display = 'block';
  }
  
  // Process payment
  async processPayment() {
    // Show loading state
    this.showLoadingState();
    
    try {
      // Get form data
      const email = this.modalContainer.querySelector('#email').value;
      
      // For demonstration, we'll use simulated card data
      // In a real implementation, you'd use Stripe Elements or similar
      const cardData = {
        number: this.modalContainer.querySelector('#card-number').value,
        expiry: this.modalContainer.querySelector('#card-expiry').value,
        cvc: this.modalContainer.querySelector('#card-cvc').value
      };
      
      // Process payment using payment processor
      const result = await processPayment({
        email,
        cardData,
        amount: 29.99,
        currency: 'USD'
      });
      
      if (result.success) {
        // Show success message
        this.showSuccessState();
      } else {
        // Show error
        this.showError(result.error || 'Payment failed. Please try again.');
        this.hideLoadingState();
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      this.showError('An unexpected error occurred. Please try again.');
      this.hideLoadingState();
    }
  }
  
  // Show loading state
  showLoadingState() {
    const formContainer = this.modalContainer.querySelector('.payment-form-container');
    const loadingContainer = this.modalContainer.querySelector('.payment-loading');
    
    formContainer.style.display = 'none';
    loadingContainer.style.display = 'block';
  }
  
  // Hide loading state
  hideLoadingState() {
    const formContainer = this.modalContainer.querySelector('.payment-form-container');
    const loadingContainer = this.modalContainer.querySelector('.payment-loading');
    
    loadingContainer.style.display = 'none';
    formContainer.style.display = 'block';
  }
  
  // Show success state
  showSuccessState() {
    const loadingContainer = this.modalContainer.querySelector('.payment-loading');
    const successContainer = this.modalContainer.querySelector('.payment-success');
    
    loadingContainer.style.display = 'none';
    successContainer.style.display = 'block';
  }
  
  // Show error message
  showError(message) {
    const errorElement = this.modalContainer.querySelector('#card-errors');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
  
  // Reset modal state
  resetModalState() {
    // Hide all sections except the payment option
    this.modalContainer.querySelector('.payment-option').style.display = 'block';
    this.modalContainer.querySelector('.payment-form-container').style.display = 'none';
    this.modalContainer.querySelector('.payment-success').style.display = 'none';
    this.modalContainer.querySelector('.payment-loading').style.display = 'none';
    
    // Clear any error messages
    const errorElement = this.modalContainer.querySelector('#card-errors');
    errorElement.textContent = '';
    errorElement.style.display = 'none';
    
    // Reset form fields
    const emailInput = this.modalContainer.querySelector('#email');
    if (emailInput) emailInput.value = '';
    
    const cardNumberInput = this.modalContainer.querySelector('#card-number');
    if (cardNumberInput) cardNumberInput.value = '';
    
    const cardExpiryInput = this.modalContainer.querySelector('#card-expiry');
    if (cardExpiryInput) cardExpiryInput.value = '';
    
    const cardCvcInput = this.modalContainer.querySelector('#card-cvc');
    if (cardCvcInput) cardCvcInput.value = '';
  }
}

// Create and export a singleton instance
export const paymentUI = new PaymentUI();
export default paymentUI;
```

#### 2. Implement Payment Processing
Create a payment processor module:

```javascript
// BC COIA calculator/payment-processor.js
import FirebaseAccessControl from './firebase-access-control.js';
import { auth } from './firebase-config.js';

// In a real implementation, you would integrate with Stripe, PayPal, etc.
// For this example, we'll create a simulated payment processor

/**
 * Process a payment
 * @param {Object} paymentDetails - Payment details including amount, currency, etc.
 * @returns {Promise<Object>} Result object with success status
 */
export async function processPayment(paymentDetails) {
  try {
    // 1. Ensure user is authenticated (if not, sign in anonymously)
    let currentUser = auth.currentUser;
    if (!currentUser) {
      // Sign in anonymously
      const userCredential = await FirebaseAccessControl.signInAnonymously();
      currentUser = userCredential;
    }
    
    // 2. Simulate payment processing (would be replaced with actual payment gateway)
    // For demo purposes, we'll simulate a 2-second processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. Generate a fake transaction ID
    const transactionId = 'tx_' + Math.random().toString(36).substr(2, 9);
    
    // 4. Record payment in Firebase
    await FirebaseAccessControl.storePaymentStatus(currentUser.uid, {
      transactionId,
      email: paymentDetails.email,
      amount: paymentDetails.amount,
      currency: paymentDetails.currency,
      timestamp: new Date()
    });
    
    // 5. Dispatch success event
    document.dispatchEvent(new CustomEvent('payment-completed', {
      detail: {
        success: true,
        transactionId
      }
    }));
    
    // 6. Return success
    return {
      success: true,
      transactionId
    };
  } catch (error) {
    console.error('Payment processing error:', error);
    
    // Dispatch error event
    document.dispatchEvent(new CustomEvent('payment-error', {
      detail: {
        success: false,
        message: error.message || 'Payment processing failed'
      }
    }));
    
    // Return error
    return {
      success: false,
      error: error.message || 'Payment processing failed'
    };
  }
}

/**
 * Check if the current user has already paid
 * @returns {Promise<boolean>} True if user has paid
 */
export async function checkPaymentStatus() {
  try {
    return await FirebaseAccessControl.checkAuthStatus();
  } catch (error) {
    console.error('Payment status check error:', error);
    return false;
  }
}

export default {
  processPayment,
  checkPaymentStatus
};
```

#### 3. Add CSS for Payment UI
Create CSS for the payment modal:

```css
/* BC COIA calculator/styles/components/payment-screen.css */

/* Modal container */
.payment-modal-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

/* Modal content */
.payment-modal {
  background-color: #fff;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Modal header */
.payment-modal-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  text-align: center;
}

.payment-modal-header h2 {
  margin: 0 0 10px 0;
  color: #333;
}

.payment-modal-header p {
  margin: 0;
  color: #666;
}

/* Modal body */
.payment-modal-body {
  padding: 20px;
}

/* Payment option */
.payment-option {
  text-align: center;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 20px;
}

.payment-option h3 {
  margin-top: 0;
}

.payment-option .price {
  font-size: 24px;
  font-weight: bold;
  color: #4a90e2;
  margin: 15px 0;
}

.payment-option ul {
  list-style-type: none;
  padding: 0;
  margin: 20px 0;
  text-align: left;
}

.payment-option ul li {
  padding: 5px 0 5px 25px;
  position: relative;
}

.payment-option ul li:before {
  content: "✓";
  position: absolute;
  left: 0;
  color: #4a90e2;
}

/* Buttons */
.payment-button, 
#payment-submit-button,
#continue-button {
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
}

.payment-button:hover,
#payment-submit-button:hover,
#continue-button:hover {
  background-color: #3a7bc8;
}

#payment-cancel-button {
  background-color: transparent;
  color: #666;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
  margin-top: 10px;
}

#payment-cancel-button:hover {
  background-color: #f5f5f5;
}

/* Form */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input[type="email"],
.form-group input[type="text"] {
  width: 100%;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 16px;
}

#card-element {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 10px;
}

.card-details {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

#card-errors {
  color: #e74c3c;
  margin-top: 8px;
  font-size: 14px;
  display: none;
}

/* Success state */
.payment-success {
  text-align: center;
  padding: 20px;
}

.success-icon {
  font-size: 48px;
  color: #2ecc71;
  margin-bottom: 20px;
}

/* Loading state */
.payment-loading {
  text-align: center;
  padding: 20px;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top: 4px solid #4a90e2;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Footer */
.payment-modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #e0e0e0;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.payment-modal-footer .terms {
  font-size: 12px;
  margin-top: 5px;
}

/* Responsive */
@media (max-width: 600px) {
  .payment-modal {
    width: 95%;
  }
}
```

### Integration With Main Calculator

#### 1. Add Payment Screen CSS Link
Update the index.html file to include the payment screen CSS:

```html
<!-- Add after other CSS links -->
<link rel="stylesheet" href="styles/components/payment-screen.css">
```

#### 2. Initialize Payment Components and Handle Access Errors
Modify calculator.ui.js to initialize payment components and handle access errors:

```javascript
// In calculator.ui.js
import { paymentUI } from './payment-ui.js';
import { checkPaymentStatus } from './payment-processor.js';
import FirebaseAccessControl from './firebase-access-control.js';
import { preloadCommonJurisdictions } from './interestRates.js';

// Existing initialization code...

/**
 * Initializes the calculator when the DOM is fully loaded.
 */
async function initializeCalculator() {
  // Initialize Firebase authentication
  await FirebaseAccessControl.initializeAuth();
  
  // Check if user has paid
  const hasPaid = await checkPaymentStatus();
  
  // Initialize payment UI (but don't show it yet)
  paymentUI.initialize();
  
  // Try to preload interest rates
  try {
    // This will trigger authentication error if user hasn't paid
    await preloadCommonJurisdictions();
  } catch (error) {
    // If error is due to authentication/payment required
    if (error.message && error.message.includes('Access denied')) {
      // Show payment modal
      paymentUI.showPaymentModal();
    } else {
      // Some other error occurred
      console.error('Error loading interest rates:', error);
    }
  }
  
  // Set up event listeners for authentication and payment events
  document.addEventListener('payment-completed', () => {
    // After payment is complete, try loading rates again
    preloadCommonJurisdictions().catch(err => console.error('Error loading rates after payment:', err));
  });
  
  // Continue with existing initialization...
  // (this will run even if rates aren't available yet, we'll handle errors later)
  
  // Rest of existing initialization code...
}

// Add error handler for interest rate access failures
function handleInterestRateAccessError(error) {
  console.error('Interest rate access error:', error);
  
  // If not already showing payment modal, show it
  if (error.message && error.message.includes('Access denied')) {
    paymentUI.showPaymentModal();
  } else {
    // Show general error message
    alert('Error accessing interest rate data. Please try again later.');
  }
}

// Modify recalculate function to handle rate access errors
const originalRecalculate = recalculate;
function recalculateWithErrorHandling() {
  try {
    originalRecalculate();
  } catch (error) {
    handleInterestRateAccessError(error);
  }
}
// Replace original recalculate function
recalculate = recalculateWithErrorHandling;

// Export the modified recalculate function
export { recalculate };
```

## Testing Considerations
- Test authentication flow with and without payment
- Verify payment modal appears correctly when access is denied
- Test successful payment flow and access granting
- Verify error handling for various error cases
- Test with browser cache/storage cleared

## Next Steps
After implementing the payment UI and processing, the next step will be to implement server-side security rules to protect the interest rate data in Firebase and ensure only authenticated users with valid payment status can access it.
