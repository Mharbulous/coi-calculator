# Paywall Deployment Guide

This document provides comprehensive instructions for deploying the Court Order Interest Calculator's paywall implementation to production. It combines checklist items, configuration steps, and testing procedures to ensure a smooth deployment.

## Deployment Overview

The paywall implementation consists of several components:
1. Demo mode and UI elements
2. Stripe payment integration
3. Serverless payment verification function
4. Token-based access control system

## Pre-Deployment Testing Checklist

Before deploying to production, ensure the following tests pass in the staging/development environment:

### ✓ Demo Mode Testing
- ✓ Demo mode banner displays correctly
- ✓ Watermark appears on calculation results
- ✓ Mock data is being used when in demo mode
- ✓ All application features work correctly in demo mode
- ✓ "Get Accurate Results" button appears and functions correctly
- ✓ Demo modal appears at appropriate times

### ✓ Payment Flow Testing
- ✓ Stripe checkout integration works correctly with test cards
- ✓ Success page correctly processes the session_id
- ✓ Verification token is stored properly in localStorage
- ✓ Error handling works properly for failed payments
- ✓ Redirect back to application works after payment

### ✓ Data Switching Testing
- ✓ Application correctly switches to real data after payment
- ✓ Demo mode banner disappears after payment
- ✓ Paid mode indicator appears after payment
- ✓ Calculations are accurate with real data
- ✓ Payment status persists across page refreshes

### ✓ Cross-Browser Testing
- ✓ Works in Chrome, Firefox, Edge and other modern browsers
- ✓ Responsive design works on mobile devices

## 1. Stripe Production Setup

### 1.1. Stripe Account Configuration

1. Log in to your Stripe Dashboard at [dashboard.stripe.com](https://dashboard.stripe.com)
2. Ensure you're viewing the production environment (not test mode)

### 1.2. Product and Price Setup

1. Navigate to Products → Create Product
2. Create a product with the following details:
   - Name: "Court Order Interest Calculator"
   - Description: "Access to accurate court order interest rates"
   - Price: $24.99 USD
   - Billing: One-time payment
3. Note the `price_id` of your new product (you'll need this later)

### 1.3. Webhook Configuration

1. Navigate to Developers → Webhooks → Add endpoint
2. Set the endpoint URL to your production verify-payment function:
   ```
   https://your-production-domain.com/.netlify/functions/verify-payment
   ```
3. Select events to listen for:
   - `checkout.session.completed`
4. Get your webhook signing secret and store it safely

### 1.4. API Keys

1. Navigate to Developers → API keys
2. Copy your production Publishable key
3. Copy your production Secret key (treat this as sensitive data)

## 2. Environment Configuration

### 2.1. Environment Variables Setup

Set these environment variables in your hosting platform (Netlify/Vercel):

```
STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
STRIPE_SECRET_KEY=sk_live_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret_here
```

### 2.2. Firebase Configuration

1. Verify Firebase rules are configured correctly for production
2. Confirm interest rate data is up-to-date in production Firebase
3. Test access to Firebase interest rates with production credentials

## 3. Code Preparation

### 3.1. Update Stripe Integration

Replace the test version of stripeIntegration.js with the production version:

1. Open the file `stripeIntegration.production.js` and update the following values:
   ```javascript
   const STRIPE_PUBLISHABLE_KEY = 'pk_live_your_publishable_key_here';
   const PRODUCT_PRICE_ID = 'price_live_your_price_id_here';
   const PAYMENT_LINK = 'https://buy.stripe.com/live_your_payment_link_here';
   const BUY_BUTTON_ID = 'buy_btn_live_your_button_id_here';
   ```

2. Update the success and cancel URLs in your application:
   ```javascript
   const successUrl = 'https://your-production-domain.com/success.html?session_id={CHECKOUT_SESSION_ID}';
   const cancelUrl = 'https://your-production-domain.com/cancel.html';
   ```

3. Rename `stripeIntegration.production.js` to `stripeIntegration.js` to replace the test version.

### 3.2. Code Cleanup

1. Remove any console.log statements not needed in production
2. Ensure test cards and development keys are not in production code
3. Update version numbers if applicable
4. Run final validation tests on staging environment

## 4. Deployment Process

### 4.1. Backup

1. Create backup of current production environment
2. Document rollback procedure (see Rollback Plan section)

### 4.2. Deploy Application

1. Deploy application code to production server
2. Deploy serverless functions to Netlify/Vercel
3. Verify all assets are properly deployed and accessible
4. Check all file paths and URLs are correct for production

### 4.3. Post-Deployment Verification

1. Perform complete end-to-end testing in production
2. Verify Stripe integration works in production
3. Check that Firebase data is loading properly
4. Test demo mode and payment flow with real cards
5. Test with test cards in production:
   - Successful payment: 4242 4242 4242 4242
   - Payment requiring authentication: 4000 0000 0000 9995
   - Declined payment: 4000 0000 0000 0002

## 5. Monitoring and Analytics

1. Set up analytics to track conversion rates
2. Configure monitoring for serverless functions
3. Set up alerts for payment failures or errors
4. Implement logging for debugging production issues

## 6. Support Documentation

1. Update user documentation with payment information
2. Prepare support documentation for users with payment issues
3. Document the refund process and policy:
   - Time window for refunds (e.g., 30 days)
   - Eligible reasons for refunds
   - Process for customers to request refunds

## 7. Rollback Plan

If issues are encountered during deployment:

1. **Identify Issue**: Determine the specific problem that requires rollback.
2. **Decision Point**: Decide if a full rollback is needed or if a hotfix can address the issue.
3. **Restore Backup**: If full rollback is needed, restore from the backup created before deployment.
4. **Revert Code**: Use git revert or restore from previous release.
5. **Revert Functions**: Roll back serverless functions to previous versions.
6. **Revert Environment Variables**: Reset any changed environment variables to previous values.
7. **Verify Rollback**: Test that the rollback restored functionality properly.
8. **Notify Users**: Communicate any downtime or issues to users.
9. **Document Issue**: Document what happened for future reference.

## 8. Common Issues and Troubleshooting

### Payment Verification Failures
- Check that your webhook endpoint is correctly configured
- Verify CORS headers are set correctly
- Ensure your serverless function has proper permissions

### Checkout Not Loading
- Verify Stripe.js is loading properly
- Check browser console for errors
- Confirm your publishable key is correct

### Successful Payment But No Access
- Check localStorage for payment tokens
- Verify the verification function is returning the correct token format
- Look for errors in the browser console or server logs

---

## Final Sign-off

The deployment has been reviewed and approved by:

- [ ] Product Owner: __________________ Date: __________
- [ ] Technical Lead: _________________ Date: __________
