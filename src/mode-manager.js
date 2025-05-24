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
      
      // Check for a URL parameter that can be used to bypass the IP check
      // This is useful for testing on your own device without having to modify the code
      const urlParams = new URLSearchParams(window.location.search);
      const testKey = urlParams.get('key');
      
      // A simple secret key that only you know
      // This is not highly secure but provides a basic level of protection
      // without requiring server-side verification
      const secretKey = 'coi-test-mode-2025';
      
      if (testKey === secretKey) {
        console.log('Test mode authorized via secret key');
        isTestModeEnabled = true;
        
        // Store the authorization in session storage so it persists during the session
        sessionStorage.setItem('test_mode_authorized', 'true');
        
        return true;
      }
      
      // Check if we've already been authorized in this session
      const sessionAuthorized = sessionStorage.getItem('test_mode_authorized') === 'true';
      if (sessionAuthorized) {
        console.log('Test mode authorized via session storage');
        isTestModeEnabled = true;
        return true;
      }
      
      // Use a direct IP check since we can't use Firebase Functions
      const directCheck = await checkIpDirectly();
      if (directCheck) {
        console.log('Test mode authorized via IP check');
        isTestModeEnabled = true;
        
        // Store the authorization in session storage so it persists during the session
        sessionStorage.setItem('test_mode_authorized', 'true');
        
        return true;
      }
      
      // If we get here, the user is not authorized
      console.log('Not authorized for test mode, redirecting to live mode');
      redirectToLiveMode();
      return false;
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
 * Check IP directly using multiple public IP APIs
 * @returns {Promise<boolean>} Whether the IP is authorized
 */
async function checkIpDirectly() {
  try {
    console.log('Checking IP authorization');
    
    // Try multiple IP APIs for redundancy
    const ipApis = [
      'https://api.ipify.org?format=json',
      'https://ipinfo.io/json',
      'https://api.db-ip.com/v2/free/self'
    ];
    
    // The allowed IP address
    const allowedIP = '207.6.212.70';
    
    // Try each API until one works
    for (const apiUrl of ipApis) {
      try {
        console.log(`Trying IP API: ${apiUrl}`);
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          console.warn(`API ${apiUrl} returned status ${response.status}`);
          continue;
        }
        
        const data = await response.json();
        
        // Different APIs return the IP in different fields
        let clientIP;
        if (data.ip) {
          clientIP = data.ip;
        } else if (data.ipAddress) {
          clientIP = data.ipAddress;
        } else if (data.clientIP) {
          clientIP = data.clientIP;
        }
        
        if (!clientIP) {
          console.warn(`API ${apiUrl} did not return an IP address`);
          continue;
        }
        
        console.log(`Client IP from ${apiUrl}: ${clientIP}`);
        
        // Check if the IP matches the allowed IP
        const isAuthorized = clientIP === allowedIP;
        
        console.log(`IP check result: ${isAuthorized ? 'authorized' : 'not authorized'}`);
        
        if (isAuthorized) {
          return true;
        }
      } catch (error) {
        console.warn(`Error with API ${apiUrl}:`, error);
        // Continue to the next API
      }
    }
    
    // If we get here, none of the APIs authorized the IP
    return false;
  } catch (error) {
    console.error('Error in IP check:', error);
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
