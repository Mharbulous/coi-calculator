# Court Order Interest Calculator - Production Troubleshooting Guide

This guide addresses common issues that may occur during or after deploying the Court Order Interest Calculator to production. Follow these steps to diagnose and resolve problems.

## Payment Flow Issues

### Payment Verification Failures

**Symptoms:**
- Success page shows "Payment verification failed"
- User is not granted access to real interest rates after payment
- Error messages in browser console related to payment verification

**Troubleshooting Steps:**

1. **Check Environment Variables**
   - Verify `STRIPE_SECRET_KEY` is correctly set in Netlify environment variables
   - Verify `STRIPE_WEBHOOK_SECRET` is correctly set in Netlify environment variables
   - Confirm there are no extra spaces or characters in the values

2. **Verify Webhook Configuration**
   - Log in to your Stripe Dashboard at [dashboard.stripe.com](https://dashboard.stripe.com)
   - Navigate to Developers → Webhooks
   - Confirm the webhook endpoint is set to `https://www.courtorderinterestcalculator.com/api/verify-payment`
   - Check that the webhook is configured to listen for `checkout.session.completed` events
   - Review recent webhook delivery attempts for failures

3. **Check Serverless Function Logs**
   - Log in to Netlify dashboard
   - Navigate to Functions tab
   - Look for errors in the `verify-payment` function logs
   - Common errors include malformed request data, invalid signature, or timeout issues

4. **Test the API Endpoint Directly**
   - Use a tool like Postman or curl to test the endpoint directly
   ```bash
   curl -X GET "https://www.courtorderinterestcalculator.com/api/verify-payment?session_id=YOUR_TEST_SESSION_ID"
   ```
   - Check the response for error messages

### Success Page Not Processing Session

**Symptoms:**
- Page loads but stays in "verifying payment" state
- Error messages in browser console related to fetch or CORS
- User is redirected to calculator still in demo mode

**Troubleshooting Steps:**

1. **Check Browser Console**
   - Open browser developer tools (F12)
   - Look for errors in the console related to:
     - Failed fetch requests
     - CORS issues
     - JavaScript syntax errors
     - Missing scripts

2. **Verify Session ID Parameter**
   - Check if the success page URL contains a valid `session_id` parameter
   - URL should look like: `https://www.courtorderinterestcalculator.com/success.html?session_id=cs_test_...`

3. **Check Network Requests**
   - In browser developer tools, go to the Network tab
   - Look for requests to `/api/verify-payment`
   - Check status codes and response bodies for errors

4. **Verify paymentVerification.js**
   - Confirm the `PRODUCTION_DOMAIN` constant is set correctly in paymentVerification.js
   - Verify the file is properly deployed and accessible

### Stripe Checkout Not Loading

**Symptoms:**
- Clicking "Get Accurate Results" doesn't redirect to Stripe
- Stripe loading indicator appears but never completes
- Error messages in console related to Stripe

**Troubleshooting Steps:**

1. **Check Stripe.js Loading**
   - Verify Stripe.js is loading properly in the Network tab
   - Look for errors related to loading Stripe.js

2. **Verify Stripe Keys**
   - Confirm `STRIPE_PUBLISHABLE_KEY` in stripeIntegration.js matches the value in your Stripe dashboard
   - Verify the `BUY_BUTTON_ID` is correct

3. **Check Ad Blocker Interference**
   - Disable ad blockers and try again
   - Verify the direct payment link fallback works correctly

4. **Test Stripe Direct Payment Link**
   - Try accessing the direct payment link defined in stripeIntegration.js
   - Confirm it leads to the correct Stripe checkout page

## Firebase Integration Issues

### Interest Rates Not Loading

**Symptoms:**
- "Error loading interest rates" message
- Calculator shows no rates or incorrect rates
- Console errors related to Firebase

**Troubleshooting Steps:**

1. **Check Firestore Rules**
   - Verify Firestore security rules allow reading rates
   - Check if the rules include proper conditions for authenticated vs. demo users

2. **Verify Firebase Configuration**
   - Confirm firebaseConfig.js contains correct project details
   - Check for any console errors related to Firebase initialization

3. **Test Firebase Connection**
   - Use Firebase console to verify the database is accessible
   - Check for any service outages in the Firebase status page

## Local Storage Issues

### Payment Status Not Persisting

**Symptoms:**
- User loses access to paid features after refreshing or returning to the site
- "Payment verified" state doesn't persist between sessions

**Troubleshooting Steps:**

1. **Check localStorage Implementation**
   - Examine browser local storage to verify payment tokens are being stored
   - Check `localStorage.getItem('payment_token')` and `localStorage.getItem('payment_expires_at')` in console

2. **Clear and Test Storage**
   - Have the user clear site data and try again
   - Check for browser settings that might be clearing localStorage

## Network and CORS Issues

### API Requests Failing with CORS Errors

**Symptoms:**
- Console errors mentioning "Cross-Origin Request Blocked"
- API calls fail but server logs show no request received

**Troubleshooting Steps:**

1. **Check CORS Headers**
   - Verify the serverless function includes proper CORS headers
   - Headers should include:
     ```
     'Access-Control-Allow-Origin': '*'
     'Access-Control-Allow-Headers': 'Content-Type'
     'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
     ```

2. **Test Preflight Requests**
   - Check if OPTIONS requests are being handled correctly
   - Verify the function responds to OPTIONS requests with appropriate headers

## Performance Issues

### Slow Loading or Calculations

**Symptoms:**
- Calculator takes a long time to load
- Calculations are slow to process
- UI feels sluggish

**Troubleshooting Steps:**

1. **Check Network Performance**
   - Use browser dev tools to check network request times
   - Look for slow-loading resources

2. **Optimize Firebase Requests**
   - Verify Firebase queries are optimized
   - Check if caching is implemented correctly

## Rollback Procedure

If issues cannot be resolved quickly, use the following procedure to roll back to a previous version:

1. **Stop the Current Deployment**
   - In Netlify dashboard, go to "Deploys"
   - Find the problematic deployment and click "Stop deploy"

2. **Restore from Backup**
   ```bash
   rm -rf BC\ COIA\ calculator/
   cp -r BC\ COIA\ calculator_backup_YYYYMMDD/ BC\ COIA\ calculator/
   ```

3. **Deploy the Backup Version**
   - Push the restored version to your repository
   - Trigger a new deployment in Netlify

## Contacting Support

If you're unable to resolve the issue using this guide, collect the following information before seeking help:

1. Detailed description of the issue
2. Steps to reproduce
3. Browser console logs
4. Network request logs
5. Relevant server-side logs from Netlify
6. Screenshot of the issue (if applicable)

## Prevention Tips

To minimize issues in future deployments:

1. Always create a backup before deploying
2. Test all changes in a staging environment first
3. Deploy during low-traffic periods
4. Implement feature flags for major changes
5. Monitor error logs after deployment
