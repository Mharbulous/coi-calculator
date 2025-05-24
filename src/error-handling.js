// Error Handling Module
// This module provides functions for displaying error messages to the user

/**
 * Displays a Firebase error in the UI
 * @param {Error} error - The error object
 */
export function showFirebaseError(error) {
  // Get the main container
  const appContainer = document.querySelector('.ink-layer');
  
  // Create an error container
  const errorDiv = document.createElement('div');
  errorDiv.classList.add('firebase-error');
  
  // Add error content
  errorDiv.innerHTML = `
    <h2>Firebase Connection Error</h2>
    <p>The application failed to retrieve interest rate data from Firebase.</p>
    <pre>${error.message}</pre>
    <p>Check your Firebase configuration and ensure the database is properly set up.</p>
    <div class="error-details">
      <h3>Troubleshooting Tips:</h3>
      <ul>
        <li>Verify your internet connection is working</li>
        <li>Check if Firebase services are operational</li>
        <li>Ensure your Firebase configuration is correct</li>
      </ul>
    </div>
    <button id="retryButton">Retry Connection</button>
  `;
  
  // Clear the application UI and show the error
  appContainer.innerHTML = '';
  appContainer.appendChild(errorDiv);
  
  // Add event listener to the retry button
  document.getElementById('retryButton').addEventListener('click', () => {
    location.reload(); // Simple refresh to retry
  });
}

/**
 * Logs detailed error information to the console
 * @param {Error} error - The error object
 * @param {string} context - The context in which the error occurred
 */
export function logErrorDetails(error, context) {
  console.group('Firebase Error Details');
  console.error(`Error in ${context}:`, error);
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  console.groupEnd();
}
