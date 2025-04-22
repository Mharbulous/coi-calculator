# Task 3.6: Create Rate Data Refresh Mechanism

## Overview
Implement a mechanism to periodically check for and refresh interest rate data from Firebase. This ensures users always have access to the most up-to-date rates without needing to reload the application. The refresh mechanism will manage both automatic background updates and manual refresh capabilities.

## Complexity
Simple

## Estimated Time
30 minutes

## Implementation Steps

1. Create a new file `firebase/refreshService.js` to handle rate data refresh operations:
   ```javascript
   /**
    * Service to handle periodic and manual refreshing of interest rate data
    */
   import { fetchRates, checkRatesAccess } from './rateService.js';
   import { cacheRatesData, cacheNeedsRefresh } from './cacheService.js';
   import { processError, showErrorToUser, ERROR_SEVERITY } from './errorService.js';
   import { getConnectivityStatus } from './connectivityService.js';
   import { initializeRateData } from '../interestRates.js';

   // Configuration
   const CONFIG = {
       // Check for updates every 4 hours by default
       REFRESH_INTERVAL: 4 * 60 * 60 * 1000,
       // Minimum time between refresh attempts (to prevent excessive requests)
       MIN_REFRESH_INTERVAL: 30 * 1000,
       // Default jurisdiction
       DEFAULT_JURISDICTION: 'BC'
   };

   // State tracking
   let refreshInterval = null;
   let lastRefreshAttempt = 0;
   let refreshInProgress = false;
   let refreshCallbacks = [];

   /**
    * Initializes the refresh service
    * @param {number} interval - Optional custom refresh interval in milliseconds
    */
   export function initRefreshService(interval = CONFIG.REFRESH_INTERVAL) {
       // Clear any existing interval
       if (refreshInterval) {
           clearInterval(refreshInterval);
       }
       
       // Set up periodic refresh
       refreshInterval = setInterval(
           () => refreshRateData(CONFIG.DEFAULT_JURISDICTION, true),
           interval
       );
       
       // Do an initial refresh
       refreshRateData(CONFIG.DEFAULT_JURISDICTION, true);
       
       console.log(`Refresh service initialized with ${interval}ms interval`);
   }

   /**
    * Stops the refresh service
    */
   export function stopRefreshService() {
       if (refreshInterval) {
           clearInterval(refreshInterval);
           refreshInterval = null;
       }
   }

   /**
    * Refreshes the interest rate data
    * @param {string} jurisdiction - Jurisdiction code
    * @param {boolean} isSilent - Whether to perform a silent refresh (no UI updates for success)
    * @returns {Promise<boolean>} Whether the refresh was successful
    */
   export async function refreshRateData(jurisdiction = CONFIG.DEFAULT_JURISDICTION, isSilent = false) {
       // Check if refresh is already in progress
       if (refreshInProgress) {
           console.log('Rate refresh already in progress. Skipping.');
           return false;
       }
       
       // Check if we're respecting the minimum refresh interval
       const now = Date.now();
       if (now - lastRefreshAttempt < CONFIG.MIN_REFRESH_INTERVAL) {
           console.log('Refresh attempted too soon. Skipping.');
           return false;
       }
       
       // Check connectivity
       const status = getConnectivityStatus();
       if (!status.isOnline || !status.isFirebaseAvailable) {
           console.log('Cannot refresh rates: offline or Firebase unavailable');
           return false;
       }
       
       try {
           // Mark refresh as in progress
           refreshInProgress = true;
           lastRefreshAttempt = now;
           
           // Check if cache needs refresh
           if (!cacheNeedsRefresh() && isSilent) {
               console.log('Cache is still valid. Skipping silent refresh.');
               return true;
           }
           
           // Update UI to show refresh is happening (for manual refreshes)
           if (!isSilent) {
               updateRefreshUI(true);
           }
           
           // Check access
           const hasAccess = await checkRatesAccess();
           if (!hasAccess) {
               console.log('No access to rates. Refresh canceled.');
               return false;
           }
           
           // Fetch fresh data
           const freshData = await fetchRates(jurisdiction);
           
           // Cache the data
           cacheRatesData(freshData, jurisdiction);
           
           // Reinitialize the rate data module
           await initializeRateData(jurisdiction);
           
           // Notify registered callbacks about successful refresh
           notifyRefreshComplete(true, jurisdiction);
           
           // Update UI to show success (for manual refreshes)
           if (!isSilent) {
               updateRefreshUI(false, true);
           }
           
           console.log(`Rate data successfully refreshed for ${jurisdiction}`);
           return true;
       } catch (error) {
           // Process error
           const processedError = processError(error, 'Rate Refresh', ERROR_SEVERITY.WARNING);
           
           // Show error to user for manual refreshes
           if (!isSilent) {
               showErrorToUser(processedError);
               updateRefreshUI(false, false);
           }
           
           // Notify callbacks about failed refresh
           notifyRefreshComplete(false, jurisdiction, processedError);
           
           console.warn('Rate refresh failed:', processedError.message);
           return false;
       } finally {
           // Mark refresh as complete
           refreshInProgress = false;
       }
   }

   /**
    * Updates UI elements to show refresh status
    * @param {boolean} isRefreshing - Whether a refresh is in progress
    * @param {boolean} success - Whether the refresh was successful
    */
   function updateRefreshUI(isRefreshing, success = false) {
       // Find or create refresh indicator
       const refreshIndicator = document.getElementById('refresh-indicator') || 
           createRefreshIndicator();
       
       if (isRefreshing) {
           refreshIndicator.className = 'refresh-indicator refreshing';
           refreshIndicator.textContent = 'Refreshing interest rates...';
           refreshIndicator.style.display = 'block';
       } else if (success) {
           refreshIndicator.className = 'refresh-indicator success';
           refreshIndicator.textContent = 'Interest rates updated successfully!';
           refreshIndicator.style.display = 'block';
           
           // Hide after delay
           setTimeout(() => {
               refreshIndicator.style.display = 'none';
           }, 3000);
       } else {
           refreshIndicator.className = 'refresh-indicator error';
           refreshIndicator.textContent = 'Failed to refresh interest rates.';
           refreshIndicator.style.display = 'block';
           
           // Hide after delay
           setTimeout(() => {
               refreshIndicator.style.display = 'none';
           }, 3000);
       }
   }

   /**
    * Creates a refresh indicator element
    * @returns {HTMLElement} The created element
    */
   function createRefreshIndicator() {
       const indicator = document.createElement('div');
       indicator.id = 'refresh-indicator';
       indicator.className = 'refresh-indicator';
       document.body.appendChild(indicator);
       return indicator;
   }

   /**
    * Registers a callback to be notified when refresh completes
    * @param {Function} callback - Function to call when refresh completes
    */
   export function onRefreshComplete(callback) {
       if (typeof callback === 'function' && !refreshCallbacks.includes(callback)) {
           refreshCallbacks.push(callback);
       }
   }

   /**
    * Removes a previously registered callback
    * @param {Function} callback - Function to remove
    */
   export function offRefreshComplete(callback) {
       const index = refreshCallbacks.indexOf(callback);
       if (index !== -1) {
           refreshCallbacks.splice(index, 1);
       }
   }

   /**
    * Notifies all registered callbacks when refresh completes
    * @param {boolean} success - Whether the refresh was successful
    * @param {string} jurisdiction - The jurisdiction that was refreshed
    * @param {Object} error - Error object if refresh failed
    */
   function notifyRefreshComplete(success, jurisdiction, error = null) {
       const result = {
           success,
           jurisdiction,
           timestamp: new Date(),
           error
       };
       
       refreshCallbacks.forEach(callback => {
           try {
               callback(result);
           } catch (callbackError) {
               console.error('Error in refresh callback:', callbackError);
           }
       });
   }
   ```

2. Add CSS for the refresh indicator:
   ```css
   /* Add to styles/components/refresh-indicator.css */
   
   .refresh-indicator {
       position: fixed;
       top: 10px;
       left: 50%;
       transform: translateX(-50%);
       padding: 8px 12px;
       border-radius: 4px;
       font-size: 14px;
       background-color: #f5f5f5;
       z-index: 1000;
       box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
       display: none;
   }
   
   .refresh-indicator.refreshing {
       background-color: #2196f3;
       color: white;
       animation: pulse 2s infinite;
   }
   
   .refresh-indicator.success {
       background-color: #4caf50;
       color: white;
   }
   
   .refresh-indicator.error {
       background-color: #f44336;
       color: white;
   }
   
   @keyframes pulse {
       0% {
           opacity: 1;
       }
       50% {
           opacity: 0.7;
       }
       100% {
           opacity: 1;
       }
   }
   ```

3. Add a manual refresh button to the UI:
   ```javascript
   // Add to calculator.ui.js or appropriate UI initialization file
   
   import { refreshRateData } from '../firebase/refreshService.js';

   /**
    * Adds a refresh button to the interface
    */
   export function addRefreshButton() {
       // Find appropriate container (e.g., next to jurisdiction selector)
       const container = document.querySelector('.rate-controls') || 
           document.querySelector('.calculator-controls');
       
       if (!container) {
           console.warn('Could not find container for refresh button');
           return;
       }
       
       // Create button
       const refreshButton = document.createElement('button');
       refreshButton.id = 'refresh-rates-button';
       refreshButton.className = 'refresh-button';
       refreshButton.innerHTML = '<span class="refresh-icon">↻</span> Refresh Rates';
       refreshButton.title = 'Refresh interest rates from server';
       
       // Add event listener
       refreshButton.addEventListener('click', async () => {
           // Disable button during refresh
           refreshButton.disabled = true;
           
           // Add loading class
           refreshButton.classList.add('loading');
           
           // Attempt refresh
           await refreshRateData('BC', false);
           
           // Re-enable button
           refreshButton.disabled = false;
           refreshButton.classList.remove('loading');
       });
       
       // Add to container
       container.appendChild(refreshButton);
   }
   ```

4. Add CSS for the refresh button:
   ```css
   /* Add to styles/components/refresh-button.css */
   
   .refresh-button {
       padding: 8px 12px;
       border-radius: 4px;
       background-color: #f5f5f5;
       border: 1px solid #ddd;
       display: flex;
       align-items: center;
       gap: 5px;
       cursor: pointer;
       transition: all 0.2s ease;
   }
   
   .refresh-button:hover {
       background-color: #e0e0e0;
   }
   
   .refresh-button:active {
       background-color: #d5d5d5;
   }
   
   .refresh-button.loading .refresh-icon {
       animation: spin 1s linear infinite;
   }
   
   .refresh-button:disabled {
       opacity: 0.7;
       cursor: not-allowed;
   }
   
   .refresh-icon {
       display: inline-block;
       font-size: 16px;
   }
   
   @keyframes spin {
       0% {
           transform: rotate(0deg);
       }
       100% {
           transform: rotate(360deg);
       }
   }
   ```

5. Initialize the refresh service in the main application:
   ```javascript
   // Add to main entry point (e.g., index.js)
   
   import { initRefreshService } from './firebase/refreshService.js';
   import { initializeCalculator } from './calculator.core.js';
   import { addRefreshButton } from './calculator.ui.js';

   // Initialize calculator
   initializeCalculator();

   // Add refresh button to UI
   addRefreshButton();

   // Initialize refresh service
   initRefreshService();
   ```

## Testing Procedures
1. Test automatic background refresh functionality
2. Verify manual refresh works when clicking the refresh button
3. Confirm appropriate UI feedback during and after refresh
4. Test error handling during refresh operations
5. Ensure callbacks are properly notified of refresh events

## Expected Outcome
A complete refresh mechanism that:
- Automatically refreshes rate data at configured intervals
- Provides a manual refresh option via UI button
- Shows appropriate loading and success/error indicators
- Properly handles and reports errors during refresh
- Notifies the application of rate data changes
- Respects minimum refresh intervals to prevent excessive requests

## Notes
- Ensure the refresh mechanism doesn't interfere with active calculations
- Consider user experience when showing loading indicators
- Balance freshness of data with network usage
- The refresh interval should be configurable for different environments
