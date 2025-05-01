// Mode Manager Module
// Handles detection and management of test vs. live mode

// State variable to track if test mode is enabled
let isTestModeEnabled = false;

/**
 * Initialize the mode manager
 * Checks if the user is authorized to access test mode
 * @returns {Promise<boolean>} Whether test mode was successfully initialized
 */
export async function initializeModeManager() {
  try {
    console.log('Initializing mode manager, pathname:', window.location.pathname);
    
    // Only check authorization if the URL indicates test mode
    if (window.location.pathname.includes('/test')) {
      console.log('Test mode path detected, checking IP authorization');
      
      // For development/testing, you can bypass IP check by setting this to true
      // This is useful for local testing where the IP check would fail
      const bypassIpCheck = false;
      
      if (bypassIpCheck) {
        console.log('IP check bypassed for development');
        isTestModeEnabled = true;
        return true;
      }
      
      // Try to verify if user is allowed to access test mode
      // Use Firebase function URL format
      const verifyUrl = '/api/verify-ip'; // Firebase will rewrite this to the function
      console.log('Fetching IP verification from:', verifyUrl);
      
      try {
        const response = await fetch(verifyUrl);
        
        if (!response.ok) {
          console.error('IP verification failed:', response.status);
          // Don't redirect immediately, try direct IP check
          const directCheck = await checkIpDirectly();
          if (directCheck) {
            isTestModeEnabled = true;
            return true;
          }
          
          redirectToLiveMode();
          return false;
        }
        
        const data = await response.json();
        console.log('IP verification response:', data);
        
        // Set test mode if authorized
        isTestModeEnabled = data.authorized;
        
        // If user is trying to access test mode but isn't authorized, redirect to live mode
        if (!data.authorized) {
          console.log('IP not authorized, redirecting to live mode');
          redirectToLiveMode();
          return false;
        }
        
        console.log('Test mode authorized for IP:', data.clientIP);
        return true;
      } catch (fetchError) {
        console.error('Error fetching IP verification:', fetchError);
        
        // If the fetch fails, try a direct IP check as fallback
        const directCheck = await checkIpDirectly();
        if (directCheck) {
          isTestModeEnabled = true;
          return true;
        }
        
        redirectToLiveMode();
        return false;
      }
    } else {
      // Not trying to access test mode, so keep it disabled
      console.log('Not a test mode path, running in live mode');
      isTestModeEnabled = false;
      return true;
    }
  } catch (error) {
    console.error('Error in mode manager initialization:', error);
    
    // Redirect to live mode if there's an error checking authorization
    if (window.location.pathname.includes('/test')) {
      redirectToLiveMode();
    }
    
    return false;
  }
}

/**
 * Fallback method to check IP directly using a public IP API
 * This is used when the serverless function fails
 * @returns {Promise<boolean>} Whether the IP is authorized
 */
async function checkIpDirectly() {
  try {
    console.log('Attempting direct IP check as fallback');
    
    // Use a public IP API to get the client's IP
    const response = await fetch('https://api.ipify.org?format=json');
    if (!response.ok) {
      console.error('Direct IP check failed:', response.status);
      return false;
    }
    
    const data = await response.json();
    const clientIP = data.ip;
    console.log('Client IP from direct check:', clientIP);
    
    // Check if the IP matches the allowed IP
    const allowedIP = '207.6.212.70';
    const isAuthorized = clientIP === allowedIP;
    
    console.log('Direct IP check result:', isAuthorized ? 'authorized' : 'not authorized');
    return isAuthorized;
  } catch (error) {
    console.error('Error in direct IP check:', error);
    return false;
  }
}

/**
 * Check if the application is running in test mode
 * @returns {boolean} Whether test mode is enabled
 */
export function isTestMode() {
  return isTestModeEnabled;
}

/**
 * Get a label indicating the current environment
 * @returns {string} Environment label (TEST MODE or LIVE MODE)
 */
export function getEnvironmentLabel() {
  return isTestMode() ? 'TEST MODE' : 'LIVE MODE';
}

/**
 * Redirect to the live mode (root URL)
 */
function redirectToLiveMode() {
  // Extract the domain from the current URL
  const currentUrl = window.location.href;
  const baseUrl = currentUrl.split('/test')[0];
  
  // Redirect to the root URL
  window.location.href = baseUrl;
}

/**
 * Set test mode status (for development/testing purposes)
 * @param {boolean} enabled - Whether test mode should be enabled
 */
export function setTestMode(enabled) {
  isTestModeEnabled = enabled;
}

/**
 * Add a visual indicator for test mode
 * @param {boolean} force - Whether to force adding the indicator even if not in test mode
 */
export function addTestModeIndicator(force = false) {
  if (!isTestMode() && !force) return;
  
  // Load the test mode CSS
  if (!document.getElementById('test-mode-css')) {
    const link = document.createElement('link');
    link.id = 'test-mode-css';
    link.rel = 'stylesheet';
    link.href = 'styles/components/test-mode.css';
    document.head.appendChild(link);
  }
  
  // Add class to body for CSS targeting
  document.body.classList.add('has-test-mode-indicator');
  
  // Create and add the test mode indicator
  const testModeIndicator = document.createElement('div');
  testModeIndicator.id = 'test-mode-indicator';
  testModeIndicator.className = 'test-mode-indicator';
  testModeIndicator.textContent = force ? 'FORCED TEST MODE' : getEnvironmentLabel();
  
  document.body.insertBefore(testModeIndicator, document.body.firstChild);
}
