// Netlify Serverless Function for IP Verification
// This is a Netlify Function, not a Firebase Function.
// Part of the hybrid deployment architecture where:
// - Firebase handles application hosting
// - Netlify provides serverless functions for API endpoints
exports.handler = async function(event, context) {
  // Get client IP from headers
  const clientIP = event.headers['client-ip'] || 
                   event.headers['x-forwarded-for'] || 
                   '0.0.0.0';
  
  // Only allow access from this specific IP address
  const allowedIP = '207.6.212.70';
  
  // Check if client IP matches allowed IP
  const isAuthorized = clientIP === allowedIP;
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0'
    },
    body: JSON.stringify({
      authorized: isAuthorized,
      clientIP: clientIP
    })
  };
};
