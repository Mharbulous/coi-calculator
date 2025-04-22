# Task 3.5: Implement Error Handling and Logging

## Overview
Enhance the interest rates module with comprehensive error handling and logging capabilities to improve reliability, debuggability, and user experience. This task involves implementing structured error handling, user-friendly error messages, and logging mechanisms for monitoring and troubleshooting.

## Complexity
Simple

## Estimated Time
30 minutes

## Implementation Steps

1. Create a new file `firebase/errorService.js` to provide centralized error handling:
   ```javascript
   /**
    * Error handling and logging service for Firebase operations
    */

   // Error types for categorization
   export const ERROR_TYPES = {
       AUTHENTICATION: 'authentication',
       NETWORK: 'network',
       DATA_FETCH: 'data_fetch',
       DATA_PARSE: 'data_parse',
       AUTHORIZATION: 'authorization',
       CACHE: 'cache',
       UNKNOWN: 'unknown'
   };

   // Error severity levels
   export const ERROR_SEVERITY = {
       CRITICAL: 'critical',   // Prevents app from functioning
       ERROR: 'error',         // Major feature broken
       WARNING: 'warning',     // Non-critical issue
       INFO: 'info'            // Informational
   };

   // Map Firebase error codes to types
   const errorCodeMap = {
       'permission-denied': ERROR_TYPES.AUTHORIZATION,
       'unauthenticated': ERROR_TYPES.AUTHENTICATION,
       'unavailable': ERROR_TYPES.NETWORK,
       'not-found': ERROR_TYPES.DATA_FETCH,
       // Add more mappings as needed
   };

   /**
    * Processes an error to categorize and format it consistently
    * @param {Error} error - The original error
    * @param {string} context - Where the error occurred
    * @param {string} severity - Error severity
    * @returns {Object} Processed error object with additional metadata
    */
   export function processError(error, context, severity = ERROR_SEVERITY.ERROR) {
       // Extract Firebase error code if present
       const firebaseCode = error.code || '';
       
       // Determine error type
       const errorType = firebaseCode && errorCodeMap[firebaseCode]
           ? errorCodeMap[firebaseCode]
           : determineErrorType(error);
       
       // Create structured error object
       const processedError = {
           originalError: error,
           message: getUserFriendlyMessage(error, errorType),
           technicalMessage: error.message,
           context,
           timestamp: new Date(),
           type: errorType,
           severity,
           code: firebaseCode || null
       };
       
       // Log the error
       logError(processedError);
       
       return processedError;
   }

   /**
    * Determines the type of error from its properties
    * @param {Error} error - The error to analyze
    * @returns {string} The determined error type
    */
   function determineErrorType(error) {
       if (!navigator.onLine || error.message?.includes('network') || 
           error.message?.includes('connection') || error.name === 'NetworkError') {
           return ERROR_TYPES.NETWORK;
       }
       
       if (error.message?.includes('auth') || error.message?.includes('login') || 
           error.message?.includes('sign in')) {
           return ERROR_TYPES.AUTHENTICATION;
       }
       
       if (error.message?.includes('parse') || error.message?.includes('JSON') || 
           error.name === 'SyntaxError') {
           return ERROR_TYPES.DATA_PARSE;
       }
       
       return ERROR_TYPES.UNKNOWN;
   }

   /**
    * Returns a user-friendly error message
    * @param {Error} error - The original error
    * @param {string} errorType - The type of error
    * @returns {string} A message suitable for displaying to users
    */
   function getUserFriendlyMessage(error, errorType) {
       // Custom messages based on error types
       const errorMessages = {
           [ERROR_TYPES.AUTHENTICATION]: 'Please sign in to access current interest rates.',
           [ERROR_TYPES.AUTHORIZATION]: 'You don\'t have permission to access this data. Please check your subscription.',
           [ERROR_TYPES.NETWORK]: 'Unable to connect to the server. Please check your internet connection.',
           [ERROR_TYPES.DATA_FETCH]: 'Could not retrieve interest rates. Using locally cached data instead.',
           [ERROR_TYPES.DATA_PARSE]: 'There was a problem processing the data. Please try again later.',
           [ERROR_TYPES.CACHE]: 'There was a problem with the cached data. Fresh data will be fetched.',
           [ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred. Please try again later.'
       };
       
       return errorMessages[errorType] || 'Something went wrong. Please try again later.';
   }

   /**
    * Logs error information to console and potentially to a monitoring service
    * @param {Object} processedError - The processed error object
    */
   function logError(processedError) {
       // For critical and error severity, log to console.error
       if (processedError.severity === ERROR_SEVERITY.CRITICAL || 
           processedError.severity === ERROR_SEVERITY.ERROR) {
           console.error(
               `[${processedError.severity.toUpperCase()}] ${processedError.context}: ${processedError.message}`,
               processedError
           );
       } 
       // For warnings, use console.warn
       else if (processedError.severity === ERROR_SEVERITY.WARNING) {
           console.warn(
               `[WARNING] ${processedError.context}: ${processedError.message}`,
               processedError
           );
       }
       // For info, use console.info
       else {
           console.info(
               `[INFO] ${processedError.context}: ${processedError.message}`,
               processedError
           );
       }
       
       // In a production app, you would send to a monitoring service like Sentry
       // Example: if (typeof Sentry !== 'undefined') { Sentry.captureException(processedError.originalError, { extra: processedError }); }
   }

   /**
    * Shows a user-friendly error message in the UI
    * @param {Object} processedError - The processed error object
    */
   export function showErrorToUser(processedError) {
       // Only show user-facing errors for critical and error severity
       if (processedError.severity === ERROR_SEVERITY.INFO) {
           return;
       }
       
       const errorElement = document.getElementById('error-message');
       
       if (!errorElement) {
           // Create error element if it doesn't exist
           const newErrorElement = document.createElement('div');
           newErrorElement.id = 'error-message';
           newErrorElement.className = `error-notification ${processedError.severity}`;
           document.body.appendChild(newErrorElement);
           
           // Update the new element
           updateErrorElement(newErrorElement, processedError);
       } else {
           // Update existing element
           updateErrorElement(errorElement, processedError);
       }
   }

   /**
    * Updates an error element with appropriate content
    * @param {HTMLElement} element - The error element to update
    * @param {Object} processedError - The processed error object
    */
   function updateErrorElement(element, processedError) {
       element.textContent = processedError.message;
       element.className = `error-notification ${processedError.severity}`;
       element.style.display = 'block';
       
       // For non-critical errors, auto-hide after delay
       if (processedError.severity !== ERROR_SEVERITY.CRITICAL) {
           setTimeout(() => {
               element.style.display = 'none';
           }, 5000);
       }
   }
   ```

2. Update the CSS for error display:
   ```css
   /* Add to styles/components/error-notification.css */
   
   .error-notification {
       position: fixed;
       bottom: 20px;
       left: 50%;
       transform: translateX(-50%);
       padding: 12px 20px;
       border-radius: 4px;
       font-size: 14px;
       max-width: 90%;
       text-align: center;
       box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
       z-index: 1001;
       animation: slide-up 0.3s ease-out;
   }
   
   .error-notification.critical {
       background-color: #d32f2f;
       color: white;
       border-left: 5px solid #b71c1c;
   }
   
   .error-notification.error {
       background-color: #f44336;
       color: white;
       border-left: 5px solid #d32f2f;
   }
   
   .error-notification.warning {
       background-color: #ff9800;
       color: white;
       border-left: 5px solid #f57c00;
   }
   
   @keyframes slide-up {
       from {
           opacity: 0;
           transform: translate(-50%, 20px);
       }
       to {
           opacity: 1;
           transform: translate(-50%, 0);
       }
   }
   ```

3. Update the Firebase rate service to use the error handling:
   ```javascript
   // In firebase/rateService.js, update the fetchRates function
   
   import { processError, showErrorToUser, ERROR_TYPES, ERROR_SEVERITY } from './errorService.js';

   /**
    * Fetches interest rates for a specified jurisdiction from Firebase
    * @param {string} jurisdiction - Jurisdiction code (e.g., 'BC', 'AB', 'ON')
    * @returns {Promise<Object>} - Object containing rates, lastUpdated, and validUntil
    */
   export async function fetchRates(jurisdiction) {
       try {
           // Check authentication
           if (!auth.currentUser) {
               const error = new Error('User not authenticated');
               error.code = 'unauthenticated';
               throw error;
           }

           // ... existing implementation ...
           
       } catch (error) {
           // Process and log the error
           const processedError = processError(
               error, 
               'Rate Data Fetching', 
               error.code === 'unauthenticated' ? ERROR_SEVERITY.WARNING : ERROR_SEVERITY.ERROR
           );
           
           // Show error to user if appropriate
           showErrorToUser(processedError);
           
           // Rethrow to allow caller to handle
           throw processedError;
       }
   }
   ```

## Testing Procedures
1. Test error handling with no internet connection
2. Verify authentication errors are handled appropriately
3. Test with invalid data scenarios
4. Check that error messages are user-friendly and appropriate
5. Ensure errors are properly logged

## Expected Outcome
A robust error handling system that:
- Categorizes errors based on type and severity
- Provides user-friendly error messages
- Logs detailed error information for debugging
- Shows appropriate UI notifications for errors
- Handles different error scenarios gracefully

## Notes
- Focus on user experience by providing clear, helpful error messages
- Ensure error notifications don't interfere with the main UI functionality
- Consider adding error tracking analytics for production
- Keep logs structured for easier analysis
