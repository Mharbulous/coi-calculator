# Task 3.4: Add Offline Fallback Functionality

## Overview
Implement robust offline fallback functionality to ensure the calculator remains operational when the user has no internet connection or when Firebase services are temporarily unavailable. This task involves adding network status detection, graceful degradation, and offline mode indicators.

## Complexity
Simple

## Estimated Time
30 minutes

## Implementation Steps

1. Create a new file `firebase/connectivityService.js` to handle network status detection:
   ```javascript
   /**
    * Service to monitor network connectivity and Firebase availability
    */

   // Flag to track online status
   let isOnline = navigator.onLine;

   // Flag to track Firebase availability
   let isFirebaseAvailable = false;

   // List of callbacks to execute when status changes
   const statusChangeCallbacks = [];

   /**
    * Initializes the connectivity monitoring service
    */
   export function initConnectivityMonitoring() {
       // Set up online/offline event listeners
       window.addEventListener('online', handleOnlineStatus);
       window.addEventListener('offline', handleOnlineStatus);
       
       // Initial check
       checkFirebaseAvailability();
   }

   /**
    * Handles online/offline status changes
    */
   function handleOnlineStatus() {
       const wasOnline = isOnline;
       isOnline = navigator.onLine;
       
       // If status changed
       if (wasOnline !== isOnline) {
           // If we came back online, check Firebase availability
           if (isOnline) {
               checkFirebaseAvailability();
           } else {
               // If we went offline, mark Firebase as unavailable
               updateFirebaseAvailability(false);
           }
           
           // Notify listeners
           notifyStatusChange();
       }
   }

   /**
    * Checks if Firebase services are available
    * Uses a lightweight ping to Firebase to verify connectivity
    */
   export async function checkFirebaseAvailability() {
       if (!isOnline) {
           updateFirebaseAvailability(false);
           return false;
       }
       
       try {
           // Fetch a small resource from Firebase to check availability
           // This is just a simple ping to verify the service is responding
           const response = await fetch('https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel?database=projects/{YOUR_PROJECT_ID}/databases/(default)', {
               method: 'OPTIONS',
               mode: 'no-cors'
           });
           
           // Success means Firebase is likely available
           updateFirebaseAvailability(true);
           return true;
       } catch (error) {
           console.warn('Firebase availability check failed:', error);
           updateFirebaseAvailability(false);
           return false;
       }
   }

   /**
    * Updates the Firebase availability status
    * @param {boolean} available - Whether Firebase is available
    */
   function updateFirebaseAvailability(available) {
       const wasAvailable = isFirebaseAvailable;
       isFirebaseAvailable = available;
       
       // If status changed, notify listeners
       if (wasAvailable !== isFirebaseAvailable) {
           notifyStatusChange();
       }
   }

   /**
    * Registers a callback to be executed when connectivity status changes
    * @param {Function} callback - Function to call when status changes
    */
   export function onConnectivityChange(callback) {
       if (typeof callback === 'function' && !statusChangeCallbacks.includes(callback)) {
           statusChangeCallbacks.push(callback);
       }
   }

   /**
    * Removes a previously registered callback
    * @param {Function} callback - Function to remove
    */
   export function offConnectivityChange(callback) {
       const index = statusChangeCallbacks.indexOf(callback);
       if (index !== -1) {
           statusChangeCallbacks.splice(index, 1);
       }
   }

   /**
    * Notifies all registered callbacks about status changes
    */
   function notifyStatusChange() {
       const status = getConnectivityStatus();
       statusChangeCallbacks.forEach(callback => {
           try {
               callback(status);
           } catch (error) {
               console.error('Error in connectivity status callback:', error);
           }
       });
   }

   /**
    * Gets the current connectivity status
    * @returns {Object} Object containing online and firebase availability status
    */
   export function getConnectivityStatus() {
       return {
           isOnline,
           isFirebaseAvailable,
           isOfflineMode: !isFirebaseAvailable
       };
   }

   /**
    * Cleans up event listeners
    */
   export function cleanup() {
       window.removeEventListener('online', handleOnlineStatus);
       window.removeEventListener('offline', handleOnlineStatus);
       statusChangeCallbacks.length = 0;
   }
   ```

2. Update the main calculator.core.js file to initialize connectivity monitoring and show offline status:
   ```javascript
   // Add to imports
   import { initConnectivityMonitoring, onConnectivityChange, getConnectivityStatus } from '../firebase/connectivityService.js';
   import { initializeRateData } from '../interestRates.js';

   // Add to initialization function
   export function initializeCalculator() {
       // Initialize existing calculator functionality
       // ...existing code...
       
       // Initialize connectivity monitoring
       initConnectivityMonitoring();
       
       // Register connectivity change handler
       onConnectivityChange(handleConnectivityChange);
       
       // Initialize rate data with appropriate feedback
       initializeRatesWithStatus();
   }

   /**
    * Handles connectivity status changes
    * @param {Object} status - Connectivity status object
    */
   function handleConnectivityChange(status) {
       // Update UI to show offline/online status
       updateConnectivityUI(status);
       
       // If we regained Firebase connectivity, refresh rate data
       if (status.isFirebaseAvailable) {
           initializeRatesWithStatus();
       }
   }

   /**
    * Updates UI elements to reflect connectivity status
    * @param {Object} status - Connectivity status object
    */
   function updateConnectivityUI(status) {
       const statusElement = document.getElementById('connectivity-status');
       
       if (!statusElement) {
           // Create status element if it doesn't exist
           const newStatusElement = document.createElement('div');
           newStatusElement.id = 'connectivity-status';
           newStatusElement.className = 'status-indicator';
           document.body.appendChild(newStatusElement);
           
           // Update the new element
           updateStatusElement(newStatusElement, status);
       } else {
           // Update existing element
           updateStatusElement(statusElement, status);
       }
   }

   /**
    * Updates a status element with appropriate styling and text
    * @param {HTMLElement} element - The status element to update
    * @param {Object} status - Connectivity status object
    */
   function updateStatusElement(element, status) {
       if (!status.isOnline) {
           element.className = 'status-indicator offline';
           element.textContent = 'Offline Mode: Using limited rate data';
           element.style.display = 'block';
       } else if (!status.isFirebaseAvailable) {
           element.className = 'status-indicator limited';
           element.textContent = 'Limited Connectivity: Using cached rates';
           element.style.display = 'block';
       } else {
           element.className = 'status-indicator online';
           element.textContent = 'Online: Using current rates';
           
           // Hide after 5 seconds when online
           element.style.display = 'block';
           setTimeout(() => {
               element.style.display = 'none';
           }, 5000);
       }
   }

   /**
    * Initializes interest rate data with status feedback
    */
   async function initializeRatesWithStatus() {
       const status = getConnectivityStatus();
       updateConnectivityUI(status);
       
       try {
           // Attempt to initialize rates
           const success = await initializeRateData('BC');
           
           // Update UI based on result
           if (success) {
               console.log('Rate data initialized successfully');
               // If we have the full rate data, update the status
               if (status.isFirebaseAvailable) {
                   updateConnectivityUI({
                       ...status,
                       message: 'Rate data updated successfully'
                   });
               }
           } else {
               console.warn('Using fallback rate data');
           }
       } catch (error) {
           console.error('Error initializing rate data:', error);
       }
   }
   ```

3. Add CSS for the connectivity status indicator:
   ```css
   /* Add to styles/components/connectivity-status.css */
   
   .status-indicator {
       position: fixed;
       top: 10px;
       right: 10px;
       padding: 8px 12px;
       border-radius: 4px;
       font-size: 14px;
       font-weight: bold;
       z-index: 1000;
       box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
       transition: all 0.3s ease;
   }
   
   .status-indicator.offline {
       background-color: #f44336;
       color: white;
   }
   
   .status-indicator.limited {
       background-color: #ff9800;
       color: white;
   }
   
   .status-indicator.online {
       background-color: #4caf50;
       color: white;
   }
   ```

## Testing Procedures
1. Test offline functionality by disconnecting from the internet
2. Verify that appropriate status messages are shown
3. Ensure calculator operates with fallback data when offline
4. Confirm that rate data is refreshed when coming back online
5. Test Firebase unavailability by blocking Firebase domains in the browser

## Expected Outcome
A reliable offline fallback system that:
- Detects network connectivity status
- Provides visual feedback about the connectivity state
- Gracefully degrades functionality when offline
- Automatically recovers when connectivity is restored
- Ensures users can continue working with essential functionality

## Notes
- Keep the UI notifications non-intrusive but clear
- Consider adding a manual refresh button for users to retry connectivity
- Ensure the connectivity detection is efficient and doesn't impact performance
- Test thoroughly with various network conditions to ensure robustness
