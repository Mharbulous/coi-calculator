# Task 46: Implement Stripe Checkout Integration

## Objective
Integrate Stripe Checkout to process one-time payments when users click the "Get Accurate Results" button.

## Estimated Time
2-3 hours

## Prerequisites
- Stripe account set up
- Knowledge of Stripe Checkout API
- "Get Accurate Results" button implemented from Task 44

## Tasks

### 1. Set Up Stripe Account and Product
- Create a Stripe account if not already done
- Create a product in Stripe Dashboard for the calculator ($24.99)
- Note the price ID for use in the integration

### 2. Add Stripe.js Library
- Add the Stripe.js library to the application
- Configure the public key for the integration

### 3. Implement Checkout Redirect
- Create a function to handle the "Get Accurate Results" button click
- Implement a redirect to Stripe Checkout with the appropriate parameters
- Configure success and cancel URLs

### 4. Create Success and Cancel Pages
- Create a simple success page to handle Stripe redirects after payment
- Create a cancel page for users who abandon the payment process
- Implement URL parameter handling to capture session_id from Stripe

## Implementation Details

### Adding Stripe.js Library
```html
<!-- Add to index.html -->
<script src="https://js.stripe.com/v3/"></script>
<script type="module">
  // Initialize Stripe with your publishable key
  const stripe = Stripe('pk_test_your_publishable_key');
</script>
```

### JavaScript for Checkout Redirect
```javascript
// Stripe integration module (stripeIntegration.js)

// Initialize Stripe with your publishable key
let stripe;

export function initStripe(publishableKey) {
  if (typeof Stripe !== 'undefined') {
    stripe = Stripe(publishableKey);
    console.log('Stripe initialized');
  } else {
    console.error('Stripe.js not loaded');
  }
}

export async function redirectToCheckout() {
  if (!stripe) {
    console.error('Stripe not initialized');
    return;
  }
  
  try {
    // Create a Checkout Session
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: 'price_your_price_id', // Your Stripe price ID
      }),
    });
    
    const session = await response.json();
    
    // Redirect to Checkout
    const result = await stripe.redirectToCheckout({
      sessionId: session.id,
    });
    
    if (result.error) {
      console.error(result.error.message);
      // Handle error (e.g., show error message to user)
    }
  } catch (error) {
    console.error('Error:', error);
    // Handle error (e.g., show error message to user)
  }
}
```

### Connecting Button to Stripe
```javascript
// Update the button click handler in demo UI setup
import { redirectToCheckout } from './stripeIntegration.js';

// Setup payment button click handler
document.getElementById('get-accurate-results').addEventListener('click', async () => {
  console.log('Payment button clicked - redirecting to Stripe');
  await redirectToCheckout();
});
```

### Success Page Handler
```javascript
// Add to success.js
document.addEventListener('DOMContentLoaded', async () => {
  // Get the session_id from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');
  
  if (sessionId) {
    try {
      // Call your serverless function to verify the payment
      const response = await fetch(`/api/verify-payment?session_id=${sessionId}`);
      const data = await response.json();
      
      if (data.verified) {
        // Store the verification token in localStorage
        localStorage.setItem('payment_verified', data.token);
        localStorage.setItem('payment_timestamp', Date.now().toString());
        
        // Show success message
        document.getElementById('payment-status').textContent = 'Payment successful! You now have access to accurate interest rates.';
        
        // Redirect back to the calculator after a short delay
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } else {
        // Show error message
        document.getElementById('payment-status').textContent = 'Payment verification failed. Please contact support.';
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      document.getElementById('payment-status').textContent = 'Error verifying payment. Please try again or contact support.';
    }
  } else {
    document.getElementById('payment-status').textContent = 'No session information found.';
  }
});
```

## Acceptance Criteria
- Stripe integration is properly set up with the correct product and price
- Clicking the "Get Accurate Results" button redirects to Stripe Checkout
- Stripe Checkout displays the correct product and price ($24.99)
- After successful payment, the user is redirected to the success page
- The success page correctly captures the session_id from Stripe
- The application is prepared to handle the next step (payment verification)

## Notes
- Use Stripe's test mode during development
- Keep your Stripe API keys secure and never commit them to the repository
- For development, consider using a lower test price (e.g., $0.50) to avoid unnecessary charges
- The actual payment verification will be implemented in Task 47
- Consider adding a loading indicator when redirecting to Stripe Checkout
