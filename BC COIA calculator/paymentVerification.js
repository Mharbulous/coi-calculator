// Payment Verification Module
// This module handles payment verification checking and localStorage persistence

/**
 * Check if user has a verified payment
 * @returns {boolean} Whether the user has a verified payment
 */
export function hasVerifiedPayment() {
  const token = localStorage.getItem('payment_token');
  const expiresAt = localStorage.getItem('payment_expires_at');
  
  // Check if payment token exists and is not expired
  const isValid = token && expiresAt && (parseInt(expiresAt) > Date.now());
  
  return isValid;
}

/**
 * Verify payment with the serverless function
 * @param {string} sessionId - The Stripe session ID to verify
 * @returns {Promise<Object>} Result of the verification
 */
export async function verifyPayment(sessionId) {
  if (!sessionId) {
    throw new Error('No session ID provided');
  }
  
  try {
    // Call our serverless function to verify the payment
    const response = await fetch(`/api/verify-payment?session_id=${encodeURIComponent(sessionId)}`);
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.verified) {
      // Store the verification data in localStorage
      localStorage.setItem('payment_token', data.token);
      localStorage.setItem('payment_expires_at', data.expiresAt);
      localStorage.setItem('customer_id', data.customerId || '');
      
      return {
        success: true,
        message: 'Payment verified successfully'
      };
    } else {
      return {
        success: false,
        message: data.error || 'Payment verification failed'
      };
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    throw error;
  }
}

/**
 * Set payment as verified (for testing/development purposes)
 * In production, this would be called after successful payment processing
 * @deprecated Use verifyPayment() instead
 */
export function setPaymentVerified() {
  localStorage.setItem('payment_token', 'dev_token');
  localStorage.setItem('payment_expires_at', (Date.now() + 24 * 60 * 60 * 1000).toString());
  
  // Refresh the page to load real rates
  window.location.reload();
}

/**
 * Clear payment verification
 */
export function clearPaymentVerification() {
  localStorage.removeItem('payment_token');
  localStorage.removeItem('payment_expires_at');
  localStorage.removeItem('customer_id');
  
  // Refresh the page to load mock rates
  window.location.reload();
}

/**
 * Get payment verification expiration date
 * @returns {Date|null} The expiration date or null if no payment
 */
export function getPaymentExpirationDate() {
  const expiresAt = localStorage.getItem('payment_expires_at');
  
  if (!expiresAt) return null;
  
  return new Date(parseInt(expiresAt));
}
