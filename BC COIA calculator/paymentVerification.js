// Payment Verification Module
// This module handles payment verification checking and localStorage persistence

/**
 * Check if user has a verified payment
 * @returns {boolean} Whether the user has a verified payment
 */
export function hasVerifiedPayment() {
  const token = localStorage.getItem('payment_verified');
  const timestamp = localStorage.getItem('payment_timestamp');
  
  // Check if payment is recent (within 24 hours for demonstration)
  // In a production environment, this might connect to a server to verify
  const isRecent = timestamp && (Date.now() - parseInt(timestamp) < 24 * 60 * 60 * 1000);
  
  return token === 'true' && isRecent;
}

/**
 * Set payment as verified (for testing/development purposes)
 * In production, this would be called after successful payment processing
 */
export function setPaymentVerified() {
  localStorage.setItem('payment_verified', 'true');
  localStorage.setItem('payment_timestamp', Date.now().toString());
  
  // Refresh the page to load real rates
  window.location.reload();
}

/**
 * Clear payment verification (for testing/development purposes)
 */
export function clearPaymentVerification() {
  localStorage.removeItem('payment_verified');
  localStorage.removeItem('payment_timestamp');
  
  // Refresh the page to load mock rates
  window.location.reload();
}

/**
 * Get payment verification expiration date
 * @returns {Date|null} The expiration date or null if no payment
 */
export function getPaymentExpirationDate() {
  const timestamp = localStorage.getItem('payment_timestamp');
  
  if (!timestamp) return null;
  
  const expirationDate = new Date(parseInt(timestamp) + 24 * 60 * 60 * 1000);
  return expirationDate;
}
