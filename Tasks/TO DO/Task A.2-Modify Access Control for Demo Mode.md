# Task A.2: Modify Access Control for Demo Mode

## Overview
This task involves reviewing and modifying the access control module to support both demo and paid modes in the application. The goal is to allow unauthenticated users to access demo rates while still requiring authentication and payment verification for access to real rates.

## Implementation Details

### 1. Review Existing Access Control Plan
- Review Task 2-Create Access Control Module for Firebase and all subtasks
- Identify components that need modification to support demo/paid mode switching

### 2. Enhance Access Control Module Design
Update the `firebase-access-control.js` module to handle different access modes:

```javascript
/**
 * Fetch interest rates for a specific jurisdiction
 * @param {string} jurisdiction - Jurisdiction code (e.g., 'BC')
 * @param {boolean} demoMode - Whether to fetch demo rates (default: false)
 * @returns {Promise<Array>} Array of interest rate objects
 */
async function getInterestRates(jurisdiction, demoMode = false) {
  try {
    // If demo mode, fetch demo rates (no authentication required)
    if (demoMode) {
      // Use appropriate document ID for demo rates
      const docId = `${jurisdiction}_demo`;
      
      // Check cache first
      const cacheKey = `rates_demo_${jurisdiction}`;
      const cachedRates = getFromCache(cacheKey);
      if (cachedRates) {
        return cachedRates;
      }
      
      // Fetch demo rates from Firebase
      const demoDoc = await db.collection('interestRates').doc(docId).get();
      
      if (!demoDoc.exists) {
        throw new Error(`No demo rates found for jurisdiction: ${jurisdiction}`);
      }
      
      const ratesData = demoDoc.data();
      const rates = ratesData.rates || [];
      
      // Process and cache demo rates
      const processedRates = rates.map(rate => ({
        ...rate,
        start: new Date(rate.start)
      }));
      
      // Cache the result (for 1 day)
      setInCache(cacheKey, processedRates, 24 * 60 * 60 * 1000);
      
      return processedRates;
    }
    
    // For real rates, check authentication and payment status first
    const hasAccess = await checkAuthStatus();
    if (!hasAccess) {
      throw new Error('Access denied. Payment required.');
    }
    
    // Proceed with existing code for authenticated access to real rates
    // ...
  } catch (error) {
    console.error(`Error fetching rates for ${jurisdiction}:`, error);
    throw error;
  }
}
```

### 3. Add Mode Awareness to Data Access Methods
- Update all data access methods to accept a mode parameter
- Implement caching strategies for both demo and real rates
- Ensure error messages are clear about whether demo or real access failed

### 4. Enhance Error Handling
Modify error handling to support graceful fallbacks:

```javascript
/**
 * Enhanced error handling for rate retrieval
 * @param {Error} error - The error that occurred
 * @param {string} jurisdiction - The jurisdiction code
 * @param {boolean} demoMode - Whether this was a demo mode request
 * @returns {Promise<Array|null>} Fallback rates or null
 */
async function handleRateRetrievalError(error, jurisdiction, demoMode) {
  // If in real mode and access is denied, suggest switching to demo mode
  if (!demoMode && error.message.includes('Access denied')) {
    document.dispatchEvent(new CustomEvent('suggest-demo-mode', {
      detail: { error: error.message }
    }));
    return null;
  }
  
  // If in demo mode and rates not found, try to use fallback mock data
  if (demoMode) {
    console.warn(`Demo rates fetch failed, using local fallback for ${jurisdiction}`);
    // Attempt to use local fallback mock data
    try {
      // Import directly from mockRates.js as last resort
      const { default: mockRates } = await import('../mockRates.js');
      return mockRates[jurisdiction] || [];
    } catch (fallbackError) {
      console.error('Fallback retrieval failed:', fallbackError);
      return [];
    }
  }
  
  // For other errors, propagate normally
  throw error;
}
```

### 5. Add Mode Switching Capabilities
Create methods to support switching between demo and paid modes:

```javascript
/**
 * Switch to demo mode
 * @returns {Promise<void>}
 */
async function switchToDemoMode() {
  // Clear any cached real rates
  clearRealRatesCache();
  
  // Dispatch event for UI updates
  document.dispatchEvent(new CustomEvent('mode-changed', {
    detail: { mode: 'demo' }
  }));
}

/**
 * Switch to paid mode after successful payment
 * @returns {Promise<void>}
 */
async function switchToPaidMode() {
  // Clear any cached demo rates
  clearDemoRatesCache();
  
  // Dispatch event for UI updates
  document.dispatchEvent(new CustomEvent('mode-changed', {
    detail: { mode: 'paid' }
  }));
}
```

## Dependencies
- Task 2-Create Access Control Module for Firebase
- Task A.1-Revise Firebase Structure for Demo Version

## Deliverables
1. Updated `firebase-access-control.js` module with demo mode support
2. Enhanced error handling for mode-specific scenarios
3. Mode switching capabilities integrated with access control
4. Documentation of demo mode access control features

## Estimated Time
1 hour
