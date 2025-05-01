const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });

/**
 * Firebase Cloud Function to verify if the client IP is authorized for test mode
 * @param {Object} request - The HTTP request object
 * @param {Object} response - The HTTP response object
 * @returns {Object} JSON response with authorization status
 */
exports.verifyIp = functions.https.onRequest((request, response) => {
  // Enable CORS using the 'cors' express middleware
  return cors(request, response, () => {
    try {
      // Get client IP from headers
      const clientIP = 
        request.headers['x-forwarded-for'] ||
        request.headers['x-appengine-user-ip'] ||
        request.headers['fastly-client-ip'] ||
        request.headers['true-client-ip'] ||
        request.headers['x-real-ip'] ||
        request.headers['x-cluster-client-ip'] ||
        request.headers['x-forwarded'] ||
        request.headers['forwarded-for'] ||
        request.headers['forwarded'] ||
        request.connection.remoteAddress ||
        '0.0.0.0';
      
      // Extract the first IP if there are multiple (common with proxies)
      const ip = clientIP.split(',')[0].trim();
      
      // Only allow access from this specific IP address
      const allowedIP = '207.6.212.70';
      
      // Check if client IP matches allowed IP
      const isAuthorized = ip === allowedIP;
      
      // Set cache control headers to prevent caching
      response.set('Cache-Control', 'no-store, max-age=0');
      
      // Return the result
      return response.status(200).json({
        authorized: isAuthorized,
        clientIP: ip
      });
    } catch (error) {
      console.error('Error in IP verification:', error);
      
      // Return error response
      return response.status(500).json({
        authorized: false,
        error: 'Internal server error'
      });
    }
  });
});
