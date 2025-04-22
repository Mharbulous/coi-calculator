# Task 2.5: Create Payment Verification Integration

## Overview

This task involves implementing the payment verification integration for the calculator app. You'll create the necessary functions to verify payment status, update payment records after successful transactions, and seamlessly integrate payment verification with the authentication system.

## Complexity

Simple

## Estimated Time

30 minutes

## Implementation Steps

### 1. Implement Payment Status Management Functions

1. Add a function to store payment status after a successful payment:
   ```javascript
   /**
    * Store payment status after successful payment
    * @param {string} userId - Firebase user ID
    * @param {Object} paymentDetails - Payment transaction details
    * @returns {Promise<void>}
    */
   async function storePaymentStatus(userId, paymentDetails) {
     try {
       // Calculate expiry date (e.g., 1 year from now)
       const oneYearFromNow = new Date();
       oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
       
       // Store in Firebase
       await db.collection('users').doc(userId).set({
         hasAccess: true,
         accessExpiry: oneYearFromNow,
         paymentDetails: {
           transactionId: paymentDetails.transactionId,
           amount: paymentDetails.amount,
           currency: paymentDetails.currency,
           timestamp: new Date()
         }
       }, { merge: true });
       
       // Update cache
       setInCache(`payment_${userId}`, {
         hasAccess: true,
         expiry: oneYearFromNow.getTime()
       });
       
       // Trigger any necessary UI updates
       document.dispatchEvent(new CustomEvent('payment-status-updated', { 
         detail: { hasAccess: true, expiry: oneYearFromNow }
       }));
       
       // Generate a new access token
       await generateAccessToken();
       
       return true;
     } catch (error) {
       console.error('Payment status update error:', error);
       throw error;
     }
   }
   ```

2. Add a function to check if a payment is required:
   ```javascript
   /**
    * Check if payment is required for the current user
    * @returns {Promise<Object>} Payment requirement status
    */
   async function checkPaymentRequired() {
     try {
       const user = auth.currentUser;
       
       if (!user) {
         return { paymentRequired: true, reason: 'not_authenticated' };
       }
       
       // Check cached payment status
       const cachedStatus = getFromCache(`payment_${user.uid}`);
       if (cachedStatus && cachedStatus.hasAccess && cachedStatus.expiry > Date.now()) {
         return { paymentRequired: false };
       }
       
       // Check Firebase payment status
       const hasAccess = await verifyPaymentStatus(user.uid);
       if (hasAccess) {
         return { paymentRequired: false };
       }
       
       return { 
         paymentRequired: true, 
         reason: 'no_payment',
         userId: user.uid
       };
     } catch (error) {
       console.error('Payment check error:', error);
       return { paymentRequired: true, reason: 'error', error: error.message };
     }
   }
   ```

### 2. Implement Mock Payment Processing for Testing

1. Add functions to simulate payment processing:
   ```javascript
   /**
    * Process a mock payment (for testing purposes)
    * @param {Object} paymentDetails - Payment details (amount, etc.)
    * @returns {Promise<Object>} Transaction result
    */
   async function processMockPayment(paymentDetails) {
     try {
       const user = auth.currentUser;
       if (!user) {
         throw new Error('User must be logged in to make a payment');
       }
       
       // Simulate payment processing delay
       await new Promise(resolve => setTimeout(resolve, 1500));
       
       // Generate a mock transaction ID
       const transactionId = 'txn_' + Math.random().toString(36).substring(2, 15);
       
       // Prepare payment result
       const paymentResult = {
         success: true,
         transactionId,
         amount: paymentDetails.amount,
         currency: paymentDetails.currency || 'USD',
         timestamp: new Date()
       };
       
       // Store payment status
       await storePaymentStatus(user.uid, paymentResult);
       
       return paymentResult;
     } catch (error) {
       console.error('Mock payment processing error:', error);
       return { success: false, error: error.message };
     }
   }
   ```

### 3. Create Payment UI Integration Functions

1. Add functions to handle payment-related UI events:
   ```javascript
   /**
    * Show payment dialog and process payment
    * @param {Object} options - Configuration options
    * @returns {Promise<Object>} Payment result
    */
   async function showPaymentDialog(options = {}) {
     try {
       // Check if user is authenticated
       const user = auth.currentUser;
       if (!user) {
         // Trigger authentication flow first
         document.dispatchEvent(new CustomEvent('auth-access-required'));
         throw new Error('Authentication required before payment');
       }
       
       // Trigger payment required event
       document.dispatchEvent(new CustomEvent('payment-dialog-shown'));
       
       // In a real implementation, this would integrate with a payment processor
       // For this implementation, we'll use mock payment processing
       const result = await processMockPayment({
         amount: options.amount || 49.99,
         currency: options.currency || 'USD',
         plan: options.plan || 'annual'
       });
       
       if (result.success) {
         document.dispatchEvent(new CustomEvent('payment-successful', { 
           detail: result 
         }));
       } else {
         document.dispatchEvent(new CustomEvent('payment-failed', { 
           detail: { error: result.error } 
         }));
       }
       
       return result;
     } catch (error) {
       console.error('Payment dialog error:', error);
       document.dispatchEvent(new CustomEvent('payment-failed', { 
         detail: { error: error.message } 
       }));
       return { success: false, error: error.message };
     }
   }
   ```

2. Add function to check subscription status:
   ```javascript
   /**
    * Get subscription details for the current user
    * @returns {Promise<Object>} Subscription details
    */
   async function getSubscriptionDetails() {
     try {
       const user = auth.currentUser;
       if (!user) {
         return { hasSubscription: false };
       }
       
       // Check Firebase for subscription details
       const userDoc = await db.collection('users').doc(user.uid).get();
       
       if (!userDoc.exists) {
         return { hasSubscription: false };
       }
       
       const userData = userDoc.data();
       
       if (!userData.hasAccess) {
         return { hasSubscription: false };
       }
       
       // Format expiry date
       const expiry = userData.accessExpiry?.toDate?.() || userData.accessExpiry;
       const expiryDate = expiry instanceof Date ? expiry : new Date(expiry);
       
       // Calculate days remaining
       const now = new Date();
       const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
       
       return {
         hasSubscription: true,
         expiryDate,
         daysRemaining: Math.max(0, daysRemaining),
         plan: userData.paymentDetails?.plan || 'standard',
         renewalEnabled: userData.renewalEnabled !== false
       };
     } catch (error) {
       console.error('Subscription details error:', error);
       return { hasSubscription: false, error: error.message };
     }
   }
   ```

### 4. Implement Access Denial and Payment Prompting

1. Add function to handle access denial and prompt for payment:
   ```javascript
   /**
    * Handle access denial and prompt for payment
    * @returns {Promise<boolean>} True if access was granted after payment
    */
   async function handleAccessDenialWithPayment() {
     try {
       // Check if payment is required
       const paymentCheck = await checkPaymentRequired();
       
       if (!paymentCheck.paymentRequired) {
         return true; // Already has access
       }
       
       if (paymentCheck.reason === 'not_authenticated') {
         // Show authentication UI
         document.dispatchEvent(new CustomEvent('auth-access-required'));
         return false;
       }
       
       // Show payment UI
       document.dispatchEvent(new CustomEvent('payment-required'));
       
       // Note: In a real implementation, we would wait for the payment result
       // For this implementation, we'll return false and let the UI handle it
       return false;
     } catch (error) {
       console.error('Access denial handling error:', error);
       return false;
     }
   }
   ```

### 5. Update Module Exports

```javascript
// Update the exported module interface
const FirebaseAccessControl = {
  // Previous exports...
  
  // Payment verification (new)
  storePaymentStatus,
  checkPaymentRequired,
  processMockPayment,
  showPaymentDialog,
  getSubscriptionDetails,
  handleAccessDenialWithPayment
};

export default FirebaseAccessControl;
```

### 6. Connect Payment Verification to Interest Rates Access

Add a function to verify payment status before accessing interest rates:

```javascript
/**
 * Check access before retrieving interest rate data
 * @param {Function} onAccessDenied - Optional callback when access is denied
 * @returns {Promise<boolean>} True if user has access
 */
async function checkAccessBeforeRateRetrieval(onAccessDenied) {
  try {
    // First check if user has a valid session
    const authStatus = await getAuthenticationStatus();
    
    if (authStatus.hasAccess) {
      return true;
    }
    
    // Handle access denial
    const accessGranted = await handleAccessDenialWithPayment();
    
    if (!accessGranted && typeof onAccessDenied === 'function') {
      onAccessDenied(authStatus.authenticated ? 'payment' : 'authentication');
    }
    
    return accessGranted;
  } catch (error) {
    console.error('Rate access check error:', error);
    return false;
  }
}

// Add to exports
const FirebaseAccessControl = {
  // Previous exports...
  checkAccessBeforeRateRetrieval
};
```

## Testing Procedures

1. Test payment status storage:
   ```javascript
   // Test storing payment status
   async function testPaymentStorage() {
     try {
       // Ensure a user is logged in
       let user = auth.currentUser;
       if (!user) {
         user = await FirebaseAccessControl.signInAnonymously();
       }
       
       // Store mock payment
       const mockPayment = {
         transactionId: 'test_txn_123',
         amount: 49.99,
         currency: 'USD'
       };
       
       await FirebaseAccessControl.storePaymentStatus(user.uid, mockPayment);
       
       // Verify payment was stored
       const hasAccess = await FirebaseAccessControl.verifyPaymentStatus(user.uid);
       console.log('Payment storage test result:', hasAccess);
       return hasAccess;
     } catch (error) {
       console.error('Payment storage test failed:', error);
       return false;
     }
   }
   ```

2. Test mock payment processing:
   ```javascript
   // Test mock payment processing
   async function testMockPayment() {
     try {
       const result = await FirebaseAccessControl.processMockPayment({
         amount: 49.99,
         currency: 'USD',
         plan: 'annual'
       });
       
       console.log('Mock payment result:', result);
       return result.success;
     } catch (error) {
       console.error('Mock payment test failed:', error);
       return false;
     }
   }
   ```

3. Test payment requirement check:
   ```javascript
   // Test payment requirement check
   async function testPaymentRequirement() {
     try {
       // First, ensure no payment is stored
       await FirebaseAccessControl.signOut();
       await FirebaseAccessControl.signInAnonymously();
       
       // Check if payment is required (should be true)
       let paymentCheck = await FirebaseAccessControl.checkPaymentRequired();
       console.log('Payment required before payment:', paymentCheck);
       
       // Make a payment
       await testMockPayment();
       
       // Check if payment is required again (should be false)
       paymentCheck = await FirebaseAccessControl.checkPaymentRequired();
       console.log('Payment required after payment:', paymentCheck);
       
       return !paymentCheck.paymentRequired;
     } catch (error) {
       console.error('Payment requirement test failed:', error);
       return false;
     }
   }
   ```

## Expected Outcome

By the end of this task, you should have:

1. A complete payment verification system integrated with Firebase
2. Functions to store and verify payment status
3. Mock payment processing for testing purposes
4. UI integration functions to show payment dialogs and handle payment events
5. Subscription status tracking and display
6. Integration with the interest rates access system

## Notes

- The mock payment system is only for testing and development purposes
- In a production environment, you would integrate with a real payment processor
- The implementation assumes Firebase is already configured and the authentication system is in place
- Access rights are set to expire after one year by default, but this can be customized
- For a real implementation, consider adding more robust error handling and recovery mechanisms
