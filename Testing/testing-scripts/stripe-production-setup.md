# Stripe Production Setup Guide

This guide provides instructions for transitioning the Stripe integration from test mode to production mode. Follow these steps to ensure a smooth deployment of the payment system.

## 1. Stripe Account Configuration

### Access Your Stripe Dashboard
1. Log in to your Stripe Dashboard at [dashboard.stripe.com](https://dashboard.stripe.com)
2. Ensure you're viewing the production environment (not test mode)

### Product and Price Setup
1. Navigate to Products → Create Product
2. Create a product with the following details:
   - Name: "Court Order Interest Calculator"
   - Description: "Access to accurate court order interest rates"
   - Price: $24.99 USD
   - Billing: One-time payment
3. Note the `price_id` of your new product (you'll need this later)

### Webhook Configuration
1. Navigate to Developers → Webhooks → Add endpoint
2. Set the endpoint URL to your production verify-payment function:
   ```
   https://your-production-domain.com/.netlify/functions/verify-payment
   ```
3. Select events to listen for:
   - `checkout.session.completed`
4. Get your webhook signing secret and store it safely

## 2. API Keys

### Gather Production Keys
1. Navigate to Developers → API keys
2. Copy your production Publishable key
3. Copy your production Secret key (treat this as sensitive data)

### Update Environment Variables
Update the following environment variables in your hosting platform (Netlify/Vercel):

```
STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
STRIPE_SECRET_KEY=sk_live_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret_here
```

## 3. Code Updates

### Update Stripe Integration File
Update the following values in `stripeIntegration.js`:

```javascript
// Stripe publishable key (production)
const STRIPE_PUBLISHABLE_KEY = 'pk_live_your_publishable_key_here';

// Price ID for the COI Calculator product (production)
const PRODUCT_PRICE_ID = 'price_live_your_price_id_here';

// Stripe direct payment link (production)
const PAYMENT_LINK = 'https://buy.stripe.com/live_your_payment_link_here';

// Stripe Buy Button ID (production)
const BUY_BUTTON_ID = 'buy_btn_live_your_button_id_here';
```

### Update Success and Cancel URLs
Ensure the success and cancel URLs are set to your production domain:

```javascript
// In your checkout creation code or Stripe dashboard settings
const successUrl = 'https://your-production-domain.com/success.html?session_id={CHECKOUT_SESSION_ID}';
const cancelUrl = 'https://your-production-domain.com/cancel.html';
```

## 4. Testing in Production

### Test Purchase Flow
1. Make a real purchase with a real card (you can refund it afterward)
2. Verify the checkout process works correctly
3. Confirm the success page properly verifies the payment
4. Check that the application switches to using real interest rates

### Test Webhook
1. Make a purchase to trigger a webhook event
2. Check your Netlify/Vercel function logs to confirm the webhook was received
3. Verify the payment verification process worked end-to-end

### Monitoring
1. Set up Stripe webhook monitoring in your Stripe Dashboard
2. Configure logging for your serverless functions
3. Set up error notifications for payment failures

## 5. Refund Process

### How to Process Refunds
1. Log in to the Stripe Dashboard
2. Navigate to Payments
3. Find the payment you want to refund
4. Click "Refund payment"
5. Enter the amount to refund and a reason
6. Click "Refund"

### Customer Refund Policy
Consider documenting your refund policy:
- Time window for refunds (e.g., 30 days)
- Eligible reasons for refunds
- Process for customers to request refunds

## 6. Going Live Checklist

Before officially launching, verify:

- [ ] All test keys and endpoints replaced with production values
- [ ] Success and cancel URLs point to production domain
- [ ] Webhooks configured and tested in production
- [ ] Environment variables set in production environment
- [ ] Test purchases and refunds completed successfully
- [ ] Application correctly handles payments and provides access to real data
- [ ] Proper error handling for payment failures
- [ ] Analytics in place to track conversion rates
- [ ] Customer support process documented for payment issues

## 7. Common Issues and Troubleshooting

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

## 8. Stripe Test Cards for Final Testing

While you should make at least one real purchase for full testing, you can also use these test cards in your production environment:

| Card Number         | Description                  |
|--------------------|------------------------------|
| 4242 4242 4242 4242 | Successful payment           |
| 4000 0000 0000 9995 | Successful payment requiring authentication |
| 4000 0000 0000 0002 | Declined payment             |

For all test cards, use:
- Any future expiration date
- Any 3-digit CVC
- Any postal code

> **Note:** Never store actual credit card details in your code, logs, or any unsecured location.
