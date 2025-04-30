// Paywall Testing Script
// This script provides functions to test the various components of the paywall implementation

/**
 * Test the demo mode functionality
 * Run these tests when in demo mode (no payment token)
 */
function testDemoMode() {
  console.group('DEMO MODE TESTS');
  
  // Check for demo mode banner
  const demoBanner = document.getElementById('demo-mode-banner');
  console.log('Demo banner exists:', !!demoBanner);
  console.log('Demo banner is visible:', demoBanner && getComputedStyle(demoBanner).top === '0px');
  
  // Check for watermarks
  const watermarks = document.querySelectorAll('.demo-watermark');
  console.log('Watermarks exist:', watermarks.length > 0);
  
  // Check body class for demo mode
  console.log('Body has demo-mode class:', document.body.classList.contains('demo-mode'));
  
  // Check that payment button exists
  const paymentButton = document.getElementById('get-accurate-results');
  console.log('Payment button exists:', !!paymentButton);
  
  // Verify data is mock data by checking last updated date
  import('../mockRates.js').then(module => {
    const lastUpdated = module.lastUpdated;
    console.log('Using mock data:', !!lastUpdated);
    console.log('Mock data last updated:', lastUpdated);
  }).catch(err => {
    console.error('Error loading mock rates:', err);
  });
  
  console.groupEnd();
}

/**
 * Test paid mode functionality
 * Run these tests when in paid mode (with payment token)
 */
function testPaidMode() {
  console.group('PAID MODE TESTS');
  
  // Check that demo banner is NOT present
  const demoBanner = document.getElementById('demo-mode-banner');
  console.log('Demo banner does not exist:', !demoBanner);
  
  // Check that watermarks are NOT present
  const watermarks = document.querySelectorAll('.demo-watermark');
  console.log('No watermarks exist:', watermarks.length === 0);
  
  // Check body class does NOT have demo-mode
  console.log('Body does not have demo-mode class:', !document.body.classList.contains('demo-mode'));
  
  // Check for paid mode indicator
  const paidIndicator = document.getElementById('paid-mode-indicator');
  console.log('Paid mode indicator exists:', !!paidIndicator);
  
  // Check localStorage for payment token
  const hasToken = !!localStorage.getItem('payment_token');
  const expiresAt = localStorage.getItem('payment_expires_at');
  console.log('Has payment token:', hasToken);
  console.log('Token expiration:', expiresAt ? new Date(parseInt(expiresAt)) : 'Not set');
  console.log('Token is valid:', expiresAt && (parseInt(expiresAt) > Date.now()));
  
  console.groupEnd();
}

/**
 * Test payment verification function
 * @param {string} sessionId - Test session ID
 */
async function testPaymentVerification(sessionId = 'test_session_123') {
  console.group('PAYMENT VERIFICATION TESTS');
  
  try {
    // Import the payment verification module
    const { verifyPayment } = await import('../paymentVerification.js');
    
    // Test with a mock session ID
    console.log('Testing payment verification with session ID:', sessionId);
    
    try {
      const result = await verifyPayment(sessionId);
      console.log('Verification result:', result);
      console.log('Verification success:', result.success);
      
      // Check if localStorage was updated
      const hasToken = !!localStorage.getItem('payment_token');
      console.log('localStorage token set:', hasToken);
    } catch (error) {
      console.error('Verification error:', error);
    }
  } catch (error) {
    console.error('Module import error:', error);
  }
  
  console.groupEnd();
}

/**
 * Test the persistence of payment status across page refreshes
 */
function testPaymentPersistence() {
  console.group('PAYMENT PERSISTENCE TESTS');
  
  // Get current token state
  const originalToken = localStorage.getItem('payment_token');
  const originalExpiration = localStorage.getItem('payment_expires_at');
  
  console.log('Original token:', originalToken);
  console.log('Original expiration:', originalExpiration ? new Date(parseInt(originalExpiration)) : 'Not set');
  
  // Test with a mock token
  const testToken = 'test_token_' + Date.now();
  const testExpiration = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now
  
  localStorage.setItem('payment_token', testToken);
  localStorage.setItem('payment_expires_at', testExpiration.toString());
  
  console.log('Test token set:', testToken);
  console.log('Test expiration set:', new Date(testExpiration));
  
  // Verifying storage
  const storedToken = localStorage.getItem('payment_token');
  const storedExpiration = localStorage.getItem('payment_expires_at');
  
  console.log('Stored token matches:', storedToken === testToken);
  console.log('Stored expiration matches:', storedExpiration === testExpiration.toString());
  
  // Reload prompt
  console.log('To fully test persistence, reload the page and run testPaidMode()');
  
  // Clean up or restore original state
  if (confirm('Restore original token state?')) {
    if (originalToken) {
      localStorage.setItem('payment_token', originalToken);
      localStorage.setItem('payment_expires_at', originalExpiration);
      console.log('Original state restored');
    } else {
      localStorage.removeItem('payment_token');
      localStorage.removeItem('payment_expires_at');
      console.log('Tokens removed');
    }
  }
  
  console.groupEnd();
}

/**
 * Test clearing payment verification
 */
function testClearPayment() {
  console.group('CLEAR PAYMENT TESTS');
  
  // Import the payment verification module
  import('../paymentVerification.js').then(module => {
    const { clearPaymentVerification } = module;
    
    // Get current token state
    const originalToken = localStorage.getItem('payment_token');
    const originalExpiration = localStorage.getItem('payment_expires_at');
    
    console.log('Original token:', originalToken);
    console.log('Original expiration:', originalExpiration ? new Date(parseInt(originalExpiration)) : 'Not set');
    
    if (confirm('Clear payment verification? (This will reload the page)')) {
      clearPaymentVerification();
      // The page will reload automatically
    } else {
      console.log('Clear operation cancelled');
    }
  }).catch(err => {
    console.error('Error importing module:', err);
  });
  
  console.groupEnd();
}

/**
 * Test Stripe integration
 */
function testStripeIntegration() {
  console.group('STRIPE INTEGRATION TESTS');
  
  // Import the stripe integration module
  import('../stripeIntegration.js').then(module => {
    const { initStripe, redirectToCheckout } = module;
    
    // Test Stripe initialization
    const stripeInitialized = initStripe();
    console.log('Stripe initialized:', stripeInitialized);
    
    // Check if stripe.js is loaded
    console.log('Stripe.js loaded:', typeof Stripe !== 'undefined');
    
    // Prompt for redirect test
    if (confirm('Test redirect to Stripe checkout? (This will navigate away from the page)')) {
      redirectToCheckout()
        .catch(error => {
          console.error('Checkout error:', error);
        });
    } else {
      console.log('Redirect test skipped');
    }
  }).catch(err => {
    console.error('Error importing module:', err);
  });
  
  console.groupEnd();
}

/**
 * Test interest rate data sources
 */
async function testRateDataSources() {
  console.group('RATE DATA SOURCES TESTS');
  
  try {
    // Test firebase rates
    console.log('Testing Firebase rates...');
    try {
      const { fetchRatesFromFirebase } = await import('../firebaseRates.js');
      const firebaseRates = await fetchRatesFromFirebase();
      console.log('Firebase rates retrieved:', !!firebaseRates);
      console.log('Firebase rates last updated:', firebaseRates.lastUpdated);
      console.log('Firebase rates source:', firebaseRates.source);
      console.log('BC rates count:', firebaseRates.rates.BC ? firebaseRates.rates.BC.length : 0);
    } catch (error) {
      console.error('Firebase rates error:', error);
    }
    
    // Test mock rates
    console.log('Testing mock rates...');
    try {
      const mockRatesModule = await import('../mockRates.js');
      const mockRates = mockRatesModule.default;
      const lastUpdated = mockRatesModule.lastUpdated;
      console.log('Mock rates retrieved:', !!mockRates);
      console.log('Mock rates last updated:', lastUpdated);
      console.log('BC rates count:', mockRates.BC ? mockRates.BC.length : 0);
    } catch (error) {
      console.error('Mock rates error:', error);
    }
    
  } catch (error) {
    console.error('Module import error:', error);
  }
  
  console.groupEnd();
}

// Export all test functions
export {
  testDemoMode,
  testPaidMode,
  testPaymentVerification,
  testPaymentPersistence,
  testClearPayment,
  testStripeIntegration,
  testRateDataSources
};

// Provide instructions on how to use
console.log(`
PAYWALL TESTING SCRIPT
----------------------
This script provides several functions to test the paywall implementation.
Open browser console and run these functions to test different aspects:

1. testDemoMode() - Test demo mode features
2. testPaidMode() - Test paid mode features
3. testPaymentVerification('test_session_id') - Test payment verification
4. testPaymentPersistence() - Test localStorage persistence
5. testClearPayment() - Test clearing payment data
6. testStripeIntegration() - Test Stripe integration
7. testRateDataSources() - Test interest rate data sources

Example:
  import * as PaywallTests from './testing-scripts/paywall-testing-script.js';
  PaywallTests.testDemoMode();
`);
