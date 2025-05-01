# Production Deployment Checklist

This checklist guides you through the final steps to deploy the Court Order Interest Calculator paywall to production.

## Pre-Deployment Preparation

- [x] Update `stripeIntegration.js` with production values (completed)
- [x] Update `paymentVerification.js` with production domain (completed)
- [x] Ensure success and cancel pages are configured for production (completed)
- [ ] Obtain Stripe secret key and webhook signing secret (needed for environment variables)
- [ ] Create a backup of the current production environment

## Obtaining Stripe Production Credentials

1. Log in to your Stripe Dashboard at [dashboard.stripe.com](https://dashboard.stripe.com)
2. Navigate to Developers → API keys
3. Get your Secret Key (begins with `sk_live_`)
   - This key must be kept confidential and only stored in secure environment variables
4. Navigate to Developers → Webhooks
5. If not already set up, add a new webhook endpoint:
   - URL: `https://www.courtorderinterestcalculator.com/api/verify-payment`
   - Events to listen for: `checkout.session.completed`
6. Get your Webhook Signing Secret (begins with `whsec_`)
   - Click on the webhook endpoint
   - Under "Signing secret", click "Reveal" to see the signing secret

## Environment Variables Setup

Your production environment needs these environment variables:

```
STRIPE_PUBLISHABLE_KEY=pk_live_51RBUdxDKPUV593QMcEYvUeQujcCjUhOhqQITsM3FrPvFnM6FAxKW8ZV8fWD1xMkj0Oh8JKtL4R7BMNGZCjbFPgY800Ex0bXWRv
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

If you're hosting on a traditional web server:
1. Set these as server environment variables
2. Make sure the serverless function has access to them

If you're using Netlify or Vercel:
1. Log in to your Netlify/Vercel dashboard
2. Go to your site settings
3. Find the "Environment variables" section
4. Add the variables listed above with their values

## Deployment Process

1. Create a backup of your production environment:
   ```bash
   # Example backup command for the main directory
   cp -r BC\ COIA\ calculator/ BC\ COIA\ calculator_backup_$(date +%Y%m%d)
   ```

2. Deploy your code to the production server:
   - If using Git: Push changes to your production branch
   - If using FTP/SFTP: Upload the modified files to your server
   - If using Netlify/Vercel: Deploy through their dashboard or Git integration

3. Deploy the serverless function:
   - Ensure `functions/verify-payment.js` is properly deployed
   - Verify the API route is configured correctly (see netlify.toml for reference)

## Post-Deployment Verification

After deployment, perform these verification steps:

1. Load the production site in a private/incognito browser window
2. Verify demo mode works correctly
3. Click "Get Accurate Results" to test the payment flow
4. Use a Stripe test card to make a payment:
   - Test card: 4242 4242 4242 4242
   - Any future expiration date
   - Any 3-digit CVC
   - Any postal code
5. Verify the success page correctly processes the session
6. Check that the calculator loads with real interest rates after payment
7. Test the payment flow on both desktop and mobile devices
8. Check the Stripe dashboard to confirm test payments are recorded

## Troubleshooting Common Issues

### Payment Verification Failures
- Verify the webhook endpoint is correctly set up in Stripe
- Check that environment variables are properly set
- Look for errors in server logs related to the verification function

### Success Page Not Processing Session
- Check browser console for errors
- Verify the `paymentVerification.js` file is properly deployed
- Ensure the redirect URL in Stripe Checkout is correct

### Payment Flow Not Working
- Ensure the Stripe publishable key is correctly set in `stripeIntegration.js`
- Verify the Buy Button ID is correct
- Check that Stripe.js is loading properly (look for network requests)

## Rollback Plan

If issues occur that can't be quickly resolved:

1. Restore from your backup:
   ```bash
   # Example restore command
   rm -rf BC\ COIA\ calculator/
   cp -r BC\ COIA\ calculator_backup_YYYYMMDD/ BC\ COIA\ calculator/
   ```

2. If using Netlify/Vercel, roll back to a previous deploy through their dashboard

## Final Checklist

- [ ] All code deployed to production
- [ ] Environment variables set correctly
- [ ] Webhook endpoint configured in Stripe
- [ ] Test payment flow completed successfully
- [ ] Mobile testing completed
- [ ] Documentation updated with production details
