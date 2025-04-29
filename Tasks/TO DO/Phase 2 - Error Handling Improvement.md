# Phase 2: Error Handling Improvement

## Objective
Add proper error handling to the application to gracefully handle Firebase connection failures and data retrieval errors, making it clear when the application cannot function due to missing data.

## Estimated Time
1-2 hours

## Tasks

### 1. Create Error Handling UI
- Create a simple error UI component to display Firebase errors
- Ensure the error messages are user-friendly and informative
- Add relevant debug information to help troubleshoot Firebase connection issues

### 2. Update Calculator UI
- Modify the application initialization to catch Firebase errors
- Display the error UI when Firebase data cannot be retrieved
- Ensure the application doesn't attempt to run with missing data

### 3. Add Error Recovery Options
- Add a reload button to retry Firebase connections
- Add clear error messages with suggested actions

## Implementation Details

### 1. Create Error Handling UI

Create a simple JavaScript function to display errors:

```javascript
// Add to calculator.ui.js or create a new file like error-handling.js

/**
 * Displays a Firebase error in the UI
 * @param {Error} error - The error object
 */
function showFirebaseError(error) {
  // Get the main container
  const appContainer = document.querySelector('.ink-layer');
  
  // Create an error container
  const errorDiv = document.createElement('div');
  errorDiv.classList.add('firebase-error');
  errorDiv.style.cssText = 'background: #ffebee; color: #c62828; padding: 20px; margin: 20px; border-radius: 4px; border: 1px solid #ef9a9a;';
  
  // Add error content
  errorDiv.innerHTML = `
    <h2>Firebase Connection Error</h2>
    <p>The application failed to retrieve interest rate data from Firebase.</p>
    <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto;">${error.message}</pre>
    <p>Check your Firebase configuration and ensure the database is properly set up.</p>
    <button id="retryButton" style="background: #c62828; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; margin-top: 10px;">Retry Connection</button>
  `;
  
  // Clear the application UI and show the error
  appContainer.innerHTML = '';
  appContainer.appendChild(errorDiv);
  
  // Add event listener to the retry button
  document.getElementById('retryButton').addEventListener('click', () => {
    location.reload(); // Simple refresh to retry
  });
}

// Export the function if using ES modules
export { showFirebaseError };
```

### 2. Update Calculator UI Initialization

Modify the application initialization in `calculator.ui.js` to handle Firebase errors:

```javascript
// In calculator.ui.js - at the beginning of the file
import { getInterestRates } from './firebaseIntegration.js';
import { showFirebaseError } from './error-handling.js'; // If you created a separate file

// In the initialization function or DOMContentLoaded event handler
async function initializeApplication() {
  try {
    console.log('Initializing application...');
    
    // Fetch interest rates from Firebase
    console.log('Fetching interest rates...');
    const ratesData = await getInterestRates();
    
    // Continue with normal initialization if we got the rates
    console.log('Interest rates fetched successfully:', ratesData.source);
    
    // Initialize the rest of the application with the rates data
    // ...existing initialization code...
    
  } catch (error) {
    // Handle Firebase errors
    console.error('Failed to initialize application due to Firebase error:', error);
    showFirebaseError(error);
    
    // Don't proceed with application initialization
    return;
  }
}

// Call initialization when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApplication);
```

### 3. Update Firebase Loader

Update `firebaseLoader.js` to propagate errors properly:

```javascript
// Firebase Loader Script
import { getInterestRates } from './firebaseIntegration.js';

// Log a message to indicate that the Firebase loader is running
console.log('*************************************************************');
console.log('***************** FIREBASE LOADER RUNNING *******************');
console.log('*************************************************************');

// Function to load interest rates from Firebase
async function loadFirebaseRates() {
  console.log('Loading interest rates from Firebase...');
  
  try {
    // Get interest rates from Firebase
    const result = await getInterestRates();
    
    // Log the result
    console.log('Interest rates loaded:');
    console.log('- Source:', result.source);
    console.log('- Last Updated:', result.lastUpdated);
    console.log('- Valid Until:', result.validUntil);
    console.log('- Number of BC rates:', result.rates.BC ? result.rates.BC.length : 0);
    
    // Return the result
    return result;
  } catch (error) {
    console.error('Error loading interest rates:', error);
    
    // Publish a custom event that the main application can listen for
    const errorEvent = new CustomEvent('firebase-rates-error', { detail: error });
    document.dispatchEvent(errorEvent);
    
    // Propagate the error
    throw error;
  }
}

// Load the rates but don't catch errors here, let them propagate
loadFirebaseRates();

// Export the function for potential future use
export { loadFirebaseRates };
```

## Expected Outcomes

1. When Firebase fails to connect or retrieve data:
   - A clear error message is displayed to the user
   - The error message includes details about what went wrong
   - A retry button allows the user to attempt to reload the application

2. The application properly halts initialization when rates cannot be loaded:
   - No partially initialized UI is shown
   - No JavaScript errors occur due to missing data
   - The error message is clear and noticeable

3. Developer experience is improved:
   - Error messages in the console are detailed and helpful
   - The source of errors is clearly indicated
   - Debugging is easier with more context about failures

## Success Criteria

1. When Firebase fails, the application shows a clear error message instead of partially initializing or silently failing
2. The error UI is user-friendly and provides useful troubleshooting information
3. The application can be refreshed to retry the Firebase connection
4. No silent failures or mysterious behavior occurs when Firebase is unavailable
