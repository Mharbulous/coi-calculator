# COI Calculator Serverless Functions

This directory contains serverless functions for the BC Court Order Interest Calculator, primarily for handling payment verification through Stripe.

## Overview

The payment verification serverless function verifies Stripe payment sessions and issues tokens for authenticated users. This allows the COI Calculator to validate payments securely without exposing Stripe API keys in client-side code.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory with your Stripe secret key:

```
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

## Local Development

To run the serverless functions locally:

```bash
npm run dev
```

This will start the Netlify development server on port 8888. You can access the local serverless function at:

```
http://localhost:8888/.netlify/functions/verify-payment
```

Or via the redirect path:

```
http://localhost:8888/api/verify-payment
```

## Testing

To test the payment verification:

1. Use a Stripe test checkout session ID
2. Browse to the success.html page with a query parameter: `?session_id=cs_test_your_session_id`
3. The page will call the serverless function to verify the payment

For local testing without a real Stripe session, the success page will fall back to a test mode if no session_id is provided.

## Deployment

Deploy to Netlify using the Netlify CLI:

```bash
netlify login
netlify deploy --prod
```

Make sure to set up environment variables in the Netlify dashboard for production:

1. Go to your site settings in Netlify
2. Navigate to Settings > Build & deploy > Environment
3. Add the environment variable:
   - Key: STRIPE_SECRET_KEY
   - Value: Your production Stripe secret key

## Function Details

### verify-payment

**Purpose**: Verifies a Stripe checkout session and issues a verification token

**Parameters**:
- `session_id` (query parameter): The Stripe checkout session ID to verify

**Returns**:
- Success response: `{ verified: true, token: "...", customerId: "...", expiresAt: 123456789 }`
- Error response: `{ verified: false, error: "Error message" }`

## Security Considerations

- The Stripe secret key is stored as an environment variable and never exposed client-side
- CORS headers are configured to allow cross-origin requests
- Tokens expire after 24 hours by default (configurable)
- Error handling obscures sensitive details in responses
