# Task 47: Implement Payment Verification Serverless Function

## Objective
Create a serverless function to verify Stripe payment status and provide a verification token for the application.

## Estimated Time
2-3 hours

## Prerequisites
- Stripe account with API keys
- Netlify or Vercel account for hosting serverless functions
- Knowledge of serverless function deployment

## Tasks

### 1. Set Up Serverless Development Environment
- Install necessary development dependencies (Netlify CLI or Vercel CLI)
- Configure the serverless function environment
- Set up environment variables for Stripe secret key

### 2. Create Payment Verification Function
- Implement a serverless function that verifies a Stripe session using the session_id
- Generate a secure verification token when payment is confirmed
- Return appropriate responses for successful and failed verifications

### 3. Deploy Serverless Function
- Test the function locally to ensure it works correctly
- Deploy the function to Netlify or Vercel
- Update the application to use the deployed function URL

### 4. Add Error Handling
- Implement robust error handling for API issues
- Add logging for troubleshooting
- Create user-friendly error messages

## Implementation Details

### Netlify Serverless Function

```javascript
// functions/verify-payment.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');

// Generate a random verification token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

exports.handler = async function(event) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };
  
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  try {
    // Get session_id from query parameters
    const { session_id } = event.queryStringParameters;
    
    if (!session_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          verified: false, 
          error: 'Missing session_id parameter' 
        })
      };
    }
    
    // Verify payment with Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    // Check if payment was successful
    if (session.payment_status === 'paid') {
      // Generate a verification token
      const token = generateToken();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          verified: true, 
          token 
        })
      };
    } else {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          verified: false, 
          error: 'Payment not completed' 
        })
      };
    }
  } catch (error) {
    console.error('Stripe verification error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        verified: false, 
        error: 'Error verifying payment' 
      })
    };
  }
}
```

### Netlify Configuration

```toml
# netlify.toml
[build]
  functions = "functions"

[dev]
  functions = "functions"
  publish = "public"
  port = 8888

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

### Environment Variables (in .env file, not committed to repository)

```
STRIPE_SECRET_KEY=sk_test_your_secret_key
```

### Testing the Function Locally

```bash
# Install Netlify CLI
npm install netlify-cli -g

# Run local development server
netlify dev
```

## Acceptance Criteria
- Serverless function successfully verifies Stripe payment status
- Function returns a verification token for successful payments
- Function handles errors gracefully with appropriate status codes
- CORS is properly configured to allow cross-origin requests
- The function is securely deployed with environment variables properly set
- The application correctly processes the verification response

## Notes
- Never expose your Stripe secret key in client-side code
- Add appropriate logging to track payment verifications
- Consider adding rate limiting to prevent abuse
- For improved security, consider adding additional verification steps (e.g., email confirmation)
- Ensure all sensitive data is properly handled according to relevant regulations (GDPR, etc.)
