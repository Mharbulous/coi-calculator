// IP verification function for test mode access control
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
