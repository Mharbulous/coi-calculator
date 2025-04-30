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
    const { session_id } = event.queryStringParameters || {};
    
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
      
      // You could store this token in a database with expiration
      // For simplicity, we're just returning it to be stored in localStorage
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          verified: true, 
          token,
          customerId: session.customer,
          expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours from now
        })
      };
    } else {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          verified: false, 
          error: 'Payment not completed',
          status: session.payment_status
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
        error: 'Error verifying payment',
        message: error.message
      })
    };
  }
}
