// Payment Verification Module
// This module handles payment verification checking and localStorage persistence

import { isTestMode } from './mode-manager.js';

// Define production domain for API endpoints
const PRODUCTION_DOMAIN = 'https://www.courtorderinterestcalculator.com';

/**
 * Check if user has a verified payment
 * @returns {boolean} Whether the user has a verified payment
 */
export function hasVerifiedPayment() {
  // Use different storage keys based on mode
  const storageKey = isTestMode() ? 'test_payment_token' : 'payment_token';
  const expiresKey = isTestMode() ? 'test_payment_expires_at' : 'payment_expires_at';
  
  const token = localStorage.getItem(storageKey);
  const expiresAt = localStorage.getItem(expiresKey);
  
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
    // Use the full production URL for the API endpoint
    const apiUrl = `${PRODUCTION_DOMAIN}/api/verify-payment?session_id=${encodeURIComponent(sessionId)}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.verified) {
      // Use different storage keys based on mode
      const storageKey = isTestMode() ? 'test_payment_token' : 'payment_token';
      const expiresKey = isTestMode() ? 'test_payment_expires_at' : 'payment_expires_at';
      const customerKey = isTestMode() ? 'test_customer_id' : 'customer_id';
      
      // Store the verification data in localStorage
      localStorage.setItem(storageKey, data.token);
      localStorage.setItem(expiresKey, data.expiresAt);
      localStorage.setItem(customerKey, data.customerId || '');
      
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
  // Use different storage keys based on mode
  const storageKey = isTestMode() ? 'test_payment_token' : 'payment_token';
  const expiresKey = isTestMode() ? 'test_payment_expires_at' : 'payment_expires_at';
  
  localStorage.setItem(storageKey, 'dev_token');
  localStorage.setItem(expiresKey, (Date.now() + 24 * 60 * 60 * 1000).toString());
  
  // Refresh the page to load real rates
  window.location.reload();
}

/**
 * Clear payment verification
 */
export function clearPaymentVerification() {
  // Use different storage keys based on mode
  const storageKey = isTestMode() ? 'test_payment_token' : 'payment_token';
  const expiresKey = isTestMode() ? 'test_payment_expires_at' : 'payment_expires_at';
  const customerKey = isTestMode() ? 'test_customer_id' : 'customer_id';
  
  localStorage.removeItem(storageKey);
  localStorage.removeItem(expiresKey);
  localStorage.removeItem(customerKey);
  
  // Refresh the page to load mock rates
  window.location.reload();
}

/**
 * Get payment verification expiration date
 * @returns {Date|null} The expiration date or null if no payment
 */
export function getPaymentExpirationDate() {
  // Use different storage key based on mode
  const expiresKey = isTestMode() ? 'test_payment_expires_at' : 'payment_expires_at';
  const expiresAt = localStorage.getItem(expiresKey);
  
  if (!expiresAt) return null;
  
  return new Date(parseInt(expiresAt));
}
