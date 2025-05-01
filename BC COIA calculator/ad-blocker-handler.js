/**
 * Ad Blocker Handler
 * This module adds a warning notification when ad blockers are detected
 * that might interfere with payment processing
 */

import { isAdBlockerDetected } from './stripeIntegration.js';

/**
 * Create and show ad blocker warning notification
 */
function showAdBlockerWarning() {
  // If warning already exists, don't add another one
  if (document.getElementById('ad-blocker-warning')) {
    return;
  }
  
  // Create warning element
  const warningElement = document.createElement('div');
  warningElement.id = 'ad-blocker-warning';
  warningElement.className = 'ad-blocker-warning';
  
  // Add content
  warningElement.innerHTML = `
    <span class="ad-blocker-warning-close" id="close-ad-blocker-warning">&times;</span>
    <div class="ad-blocker-warning-content">
      <strong>Ad Blocker Detected</strong>
      <p>We noticed you're using an ad blocker, which may interfere with our payment processor. 
      If you experience issues when making a purchase, please temporarily disable your ad blocker for this site or use the direct payment link.</p>
    </div>
  `;
  
  // Add it to the page - insert after the title container
  const titleContainer = document.getElementById('title-container');
  if (titleContainer && titleContainer.parentNode) {
    titleContainer.parentNode.insertBefore(warningElement, titleContainer.nextSibling);
    
    // Add close button handler
    document.getElementById('close-ad-blocker-warning').addEventListener('click', () => {
      warningElement.classList.remove('active');
      
      // Remember that user dismissed the warning
      try {
        localStorage.setItem('ad_blocker_warning_dismissed', 'true');
      } catch (e) {
        // Ignore errors with localStorage
      }
      
      // Remove after animation
      setTimeout(() => {
        warningElement.remove();
      }, 500);
    });
    
    // Show with animation after a short delay
    setTimeout(() => {
      warningElement.classList.add('active');
    }, 1000);
  }
}

/**
 * Check if the warning has been dismissed before
 * @returns {boolean} True if the warning was previously dismissed
 */
function wasWarningDismissed() {
  try {
    return localStorage.getItem('ad_blocker_warning_dismissed') === 'true';
  } catch (e) {
    return false;
  }
}

/**
 * Initialize the ad blocker handler
 */
function initAdBlockerHandler() {
  // Only show warning if ad blocker is detected and user hasn't dismissed it
  if (isAdBlockerDetected() && !wasWarningDismissed()) {
    // Wait for DOM to be fully loaded before showing warning
    setTimeout(showAdBlockerWarning, 2000);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initAdBlockerHandler);

// Re-export the ad blocker detection function
export { isAdBlockerDetected, showAdBlockerWarning };
