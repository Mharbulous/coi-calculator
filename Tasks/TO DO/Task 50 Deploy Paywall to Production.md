# Task 50: Deploy Paywall to Production

## Objective

Complete the final testing and deployment of the paywall implementation to the production environment.

## Estimated Time

1-2 hours

## Prerequisites

*   Task 48 testing phase completed
*   Stripe production account configured
*   Production deployment credentials
*   Deployment access to Netlify/Vercel

## Tasks

### 1\. Final Testing Before Deployment

*   Test the entire payment flow using Stripe test cards
*   Confirm the success page correctly processes the session\_id
*   Create a complete backup of the production environment

### 2\. Production Environment Configuration

*   Set up environment variables in production:
    *   `STRIPE_PUBLISHABLE_KEY`
    *   `STRIPE_SECRET_KEY`
    *   `STRIPE_WEBHOOK_SECRET`
*   Configure CORS settings for production domains
*   Verify Firebase access with production credentials

### 3\. Code Preparation

*   Update `stripeIntegration.js` with production values from `stripeIntegration.production.js`
*   Update success and cancel URLs to point to production domain
*   Remove any remaining console.log statements not needed in production

### 4\. Deployment Process

*   Deploy the application code to the production server
*   Configure Stripe webhook endpoints in production
*   Deploy serverless functions to Netlify/Vercel
*   Verify all assets are properly deployed and accessible

### 5\. Post-Deployment Verification

*   Perform end-to-end testing in the production environment
*   Verify Stripe integration works in production
*   Test on mobile devices to ensure responsive design
*   Check console for any errors or warnings

## Implementation Details

### Stripe Production Keys

Follow the Stripe production setup guide in `documents/paywall-deployment-guide.md` to obtain the following:

1. Production publishable key
2. Production secret key 
3. Production price ID
4. Production webhook signing secret
5. Production Buy Button ID

### Environment Variables

Configure these environment variables in your hosting platform (Netlify/Vercel):

```
STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
STRIPE_SECRET_KEY=sk_live_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret_here
```

### Webhook Configuration

```
Webhook endpoint URL: https://your-production-domain.com/.netlify/functions/verify-payment
Events to listen for: checkout.session.completed
```

### Test Cards for Final Production Testing

```
Test Card Numbers:
- Successful payment: 4242 4242 4242 4242
- Payment requiring authentication: 4000 0000 0000 9995
- Failed payment: 4000 0000 0000 0002

Expiration Date: Any future date
CVC: Any 3 digits
Postal Code: Any 5 digits
```

## Acceptance Criteria

*   Payment flow works end-to-end with Stripe Checkout in production
*   Application correctly switches between demo and paid modes
*   Serverless verification function works correctly in production
*   All features are fully functional in both demo and paid modes
*   No console errors or warnings in production
*   Mobile experience works correctly

## Notes

*   Refer to the `documents/paywall-deployment-guide.md` for detailed deployment steps
*   Document any issues encountered during deployment for future reference
*   Consider implementing analytics to track conversion rates
*   Create backup of the production environment before deployment
*   Have a rollback plan ready in case of issues
