# Simplified Paywall Implementation for COI Calculator

## Overview

This document outlines a simplified approach to implementing a paywall for the Court Order Interest Calculator. The focus is on achieving three core goals with minimal development effort:

1.  Charge users $24.99 per use of the app using Stripe integration
2.  Provide a demo version with full features but using mock interest rate data
3.  Keep development effort to an absolute minimum

## Implementation Plan

### 1\. Mock Data Demo Mode (1-2 hours)

*   Keep all interest rate data client-side in the existing interestRates.js file
*   Create a "demo mode" that uses slightly modified interest rate data:
    *   Modify the existing interest rates by small amounts (±0.25-0.5%)
    *   Keep the same date ranges and structure
    *   All app features remain fully functional
*   Add clear visual indicator that the app is in demo mode with mock data
*   Add "Get Accurate Results - $24.99" button that initiates payment flow

### 2\. Stripe Integration (2-3 hours)

*   Set up Stripe account and create a product for the calculator ($24.99)
*   Implement Stripe Checkout redirect when "Get Accurate Results" is clicked
*   Create a simple serverless function (Netlify/Vercel) to verify payment success
*   Store payment verification token in localStorage

### 3\. Data Switching Implementation (1-2 hours)

*   Create a simple mode toggle system to switch between mock and real data
*   Implement checks to verify payment status before showing real data
*   Add visual indicator when using real data
*   Implement localStorage to persist payment status

### 4\. Testing and Deployment (1-2 hours)

*   Test payment flow and verification
*   Test demo/paid mode switching
*   Deploy to production

## Technical Implementation Details

### Mock Data Implementation

```javascript
// In interestRates.js

// Original rates
const realRates = {
  BC: [
    { start: "1993-01-01", prejudgment: 5.25, postjudgment: 7.25 },
    { start: "1993-07-01", prejudgment: 4.00, postjudgment: 6.00 },
    // ... other rates
  ]
};

// Mock rates (slightly modified)
const mockRates = {
  BC: [
    { start: "1993-01-01", prejudgment: 5.00, postjudgment: 7.00 },
    { start: "1993-07-01", prejudgment: 3.75, postjudgment: 5.75 },
    // ... other rates with small modifications
  ]
};

// Check if user has paid
const hasVerifiedPayment = () => {
  const token = localStorage.getItem('payment_verified');
  const timestamp = localStorage.getItem('payment_timestamp');
  
  // Optional: Check if payment is recent (e.g., within 24 hours)
  const isRecent = timestamp && (Date.now() - timestamp < 24 * 60 * 60 * 1000);
  
  return token && isRecent;
};

// Export the appropriate rates based on payment status
export default hasVerifiedPayment() ? realRates : mockRates;
```

### Payment Verification Flow

User clicks "Get Accurate Results"

App redirects to Stripe Checkout with:

After payment, Stripe redirects to success\_url with session\_id

App calls verification serverless function:

App stores verification token in localStorage:

App refreshes to use real interest rate data

## User Experience

### Demo Mode

*   Clear banner at top: "DEMO MODE - Using approximate interest rates"
*   All features fully functional
*   Results calculated with slightly modified interest rates
*   Prominent "Get Accurate Results - $24.99" button
*   Optional tooltip explaining that demo calculations are approximate

### After Payment

*   Banner changes to "FULL VERSION - Using official interest rates"
*   All calculations use the real interest rates
*   "Get Accurate Results" button disappears

## Benefits of This Approach

1.  **Simplicity**: No need for Firebase setup or server-side data
2.  **Full Feature Demo**: Users can experience all features before paying
3.  **User Experience**: Clear distinction between demo and paid modes
4.  **Maintenance**: No need to maintain separate rate databases
5.  **Cost-Effective**: Minimal serverless functions needed
6.  **Minimal Development**: Very few code changes required

## Future Enhancements (Optional)

*   Add expiration to payment (e.g., 24 hours access)
*   Implement multi-user access with team pricing
*   Add more premium features over time
*   Implement usage analytics

## Implementation Timeline

Total estimated time: 5-9 hours

This simplified approach achieves all core goals while minimizing development effort and complexity.

```javascript
localStorage.setItem('payment_verified', token);
localStorage.setItem('payment_timestamp', Date.now());
```

```javascript
// Serverless function (Netlify/Vercel)
exports.handler = async function(event) {
  const { session_id } = event.queryStringParameters;
  
  // Verify payment with Stripe
  const session = await stripe.checkout.sessions.retrieve(session_id);
  
  if (session.payment_status === 'paid') {
    // Generate a verification token
    const token = generateToken();
    
    return {
      statusCode: 200,
      body: JSON.stringify({ verified: true, token })
    };
  }
  
  return {
    statusCode: 403,
    body: JSON.stringify({ verified: false })
  };
}
```

```javascript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{
    price: 'price_1234567890', // Your Stripe price ID
    quantity: 1,
  }],
  mode: 'payment',
  success_url: 'https://your-app.com/success?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://your-app.com/cancel',
});
```