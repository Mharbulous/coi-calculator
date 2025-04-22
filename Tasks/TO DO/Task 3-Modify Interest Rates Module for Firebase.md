# Step 3: Modify Interest Rates Module for Firebase

## Overview
This step involves refactoring the interestRates.js file to fetch rate data from Firebase instead of using hardcoded values. This is the core component of our paywall implementation, as it places the essential interest rate data behind Firebase authentication.

## Implementation Details

### Modify Existing File
Update the `interestRates.js` file in the BC COIA calculator directory to fetch data from Firebase.

### Current Implementation
The current implementation:
- Contains hardcoded interest rate data for all jurisdictions
- Processes rates to calculate end dates
- Exports the rates directly

### Required Changes

#### 1. Import Firebase Dependencies
Add imports for the Firebase configuration and access control module:

```javascript
// Import Firebase dependencies
import { db } from './firebase-config.js';
import FirebaseAccessControl from './firebase-access-control.js';
```

#### 2. Modify Rate Retrieval Logic
Replace hardcoded rates with Firebase retrieval:

```javascript
// Helper functions remain the same
function parseUTCDate(dateString) {
    // Keep existing implementation
}

function endOfDayUTC(date) {
    // Keep existing implementation
}

// Create a function to fetch and process rates
async function fetchRatesFromFirebase(jurisdiction) {
    try {
        // Use the access control module to get rates
        const ratesArray = await FirebaseAccessControl.getInterestRates(jurisdiction);
        
        if (!ratesArray || ratesArray.length === 0) {
            console.error(`No rates found for jurisdiction: ${jurisdiction}`);
            return [];
        }
        
        // Sort rates by start date
        const sortedRates = [...ratesArray].sort((a, b) => a.start - b.start);
        
        // Calculate end dates dynamically
        return sortedRates.map((rate, index) => {
            // If this is not the last rate period, end date is day before next period
            if (index < sortedRates.length - 1) {
                const nextStartDate = new Date(sortedRates[index + 1].start);
                const endDate = new Date(nextStartDate);
                endDate.setUTCDate(endDate.getUTCDate() - 1);
                return {
                    ...rate,
                    end: endOfDayUTC(endDate)
                };
            } 
            // For the last rate period, use validUntil from metadata
            else {
                return {
                    ...rate,
                    end: endOfDayUTC(validUntil)
                };
            }
        });
    } catch (error) {
        console.error(`Error fetching rates for ${jurisdiction}:`, error);
        // Return empty array on error
        return [];
    }
}

// Function to fetch metadata
async function fetchMetadata() {
    try {
        return await FirebaseAccessControl.getInterestRatesMetadata();
    } catch (error) {
        console.error('Error fetching metadata:', error);
        return { 
            lastUpdated: new Date(), 
            validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        };
    }
}
```

#### 3. Create a Lazy-Loading Cache Mechanism
Implement a mechanism to fetch rates only when needed and cache them:

```javascript
// Cache for processed rates
let processedRates = {};
let lastUpdated = null;
let validUntil = null;
let metadataFetched = false;

// Function to get rates for a jurisdiction
async function getRates(jurisdiction) {
    // Check if we need to fetch metadata first
    if (!metadataFetched) {
        const metadata = await fetchMetadata();
        lastUpdated = metadata.lastUpdated;
        validUntil = metadata.validUntil;
        metadataFetched = true;
    }
    
    // Check if we already have rates for this jurisdiction
    if (!processedRates[jurisdiction]) {
        // Fetch and process rates
        processedRates[jurisdiction] = await fetchRatesFromFirebase(jurisdiction);
    }
    
    return processedRates[jurisdiction];
}

// Function to clear cache (used when authentication state changes)
function clearRatesCache() {
    processedRates = {};
    metadataFetched = false;
}

// Listen for auth state changes to clear cache
document.addEventListener('auth-state-changed', (event) => {
    if (!event.detail.authenticated) {
        clearRatesCache();
    }
});
```

#### 4. Modify Export Strategy
Change the export to use Promise-based access:

```javascript
/**
 * Get interest rates for a specific jurisdiction
 * @param {string} jurisdiction - The jurisdiction code (e.g., 'BC')
 * @returns {Promise<Array>} Promise resolving to array of rate objects
 */
async function getInterestRatesForJurisdiction(jurisdiction) {
    return await getRates(jurisdiction);
}

/**
 * Get metadata about when rates were last updated and until when they're valid
 * @returns {Object} Object with lastUpdated and validUntil dates
 */
function getMetadata() {
    return {
        lastUpdated,
        validUntil
    };
}

// Provide a backwards compatibility layer for existing code
export default {
    async getJurisdictionRates(jurisdiction) {
        return await getRates(jurisdiction);
    },
    getLastUpdated() {
        return lastUpdated;
    },
    getValidUntil() {
        return validUntil;
    },
    // Original export structure for backward compatibility
    BC: [], // This will be populated on first access
    AB: [],
    ON: []
};

// Also export the new async methods
export { 
    getInterestRatesForJurisdiction,
    getMetadata,
    clearRatesCache
};
```

#### 5. Fallback Mechanism for Development and Error Cases
Add a fallback mechanism for development or when Firebase is unavailable:

```javascript
// Hardcoded fallback rates for development or when Firebase is unavailable
const fallbackRates = {
    BC: [
        { start: parseUTCDate("2024-01-01"), prejudgment: 5.20, postjudgment: 7.20 },
        { start: parseUTCDate("2024-07-01"), prejudgment: 4.95, postjudgment: 6.95 },
        { start: parseUTCDate("2025-01-01"), prejudgment: 3.45, postjudgment: 5.45 }
    ],
    // Add minimal fallback rates for other jurisdictions
};

// Modify fetchRatesFromFirebase to use fallback if needed
async function fetchRatesFromFirebase(jurisdiction) {
    try {
        // Try to fetch from Firebase first
        const ratesArray = await FirebaseAccessControl.getInterestRates(jurisdiction);
        
        if (!ratesArray || ratesArray.length === 0) {
            console.warn(`No rates found for ${jurisdiction}, using fallback`);
            return fallbackRates[jurisdiction] || [];
        }
        
        // Continue with existing implementation...
    } catch (error) {
        console.error(`Error fetching rates for ${jurisdiction}, using fallback:`, error);
        return fallbackRates[jurisdiction] || [];
    }
}
```

#### 6. Add Support for Transparent Property Access
To maintain compatibility with existing code that directly accesses properties:

```javascript
// Create a proxy to handle property access to jurisdiction rates
const interestRatesProxy = new Proxy({
    getJurisdictionRates: async (jurisdiction) => await getRates(jurisdiction),
    getLastUpdated: () => lastUpdated,
    getValidUntil: () => validUntil
}, {
    get: function(target, prop) {
        // If the property is a method, return it
        if (typeof target[prop] === 'function') {
            return target[prop];
        }
        
        // If it's a jurisdiction code (BC, AB, etc.), trigger async loading
        if (['BC', 'AB', 'ON'].includes(prop)) {
            // Start loading the rates asynchronously
            getRates(prop).catch(err => console.error(`Error pre-loading rates for ${prop}:`, err));
            
            // Return a reference to the cache
            return processedRates[prop] || [];
        }
        
        // For other properties, return undefined
        return undefined;
    }
});

export default interestRatesProxy;
```

### Handling the Asynchronous Nature
Since Firebase access is asynchronous but the original module was synchronous, we need to handle this transition:

1. Use a default empty array that will be populated asynchronously
2. Add clear warning comments about the asynchronous nature
3. Provide a separate async API for new code
4. Consider adding a loading state flag

```javascript
// Add a loading state tracker
let isLoading = false;
let loadingPromise = null;

// Function to preload common jurisdictions
async function preloadCommonJurisdictions() {
    isLoading = true;
    try {
        // Load metadata first
        await fetchMetadata();
        
        // Start loading BC rates (most commonly used)
        await getRates('BC');
        
        // Optionally load other jurisdictions in the background
        getRates('AB').catch(() => {}); // Ignore errors
        getRates('ON').catch(() => {}); // Ignore errors
    } catch (error) {
        console.error('Error preloading interest rates:', error);
    } finally {
        isLoading = false;
    }
}

// Add loading status accessor
export function isLoadingRates() {
    return isLoading;
}

// Export preload function
export { preloadCommonJurisdictions };
```

### Add a Comment Block Explaining the Changes
Add a prominent comment block at the top of the file:

```javascript
/**
 * Interest Rate Data - Firebase Implementation
 * 
 * IMPORTANT: This module has been updated to fetch interest rates from Firebase
 * instead of using hardcoded values. This has the following implications:
 * 
 * 1. Rate data is now loaded ASYNCHRONOUSLY. The first access may return empty arrays
 *    until data is loaded.
 * 
 * 2. Direct property access (like interestRates.BC) will work but may initially
 *    return empty arrays. For reliable access, use the async methods:
 *    - await interestRates.getJurisdictionRates('BC')
 *    - or: import { getInterestRatesForJurisdiction } from './interestRates.js'
 *      then: await getInterestRatesForJurisdiction('BC')
 * 
 * 3. Authentication is required to access rate data. If the user is not
 *    authenticated, an error will be thrown.
 * 
 * 4. To preload rates, call: preloadCommonJurisdictions()
 * 
 * This implementation uses a combination of Firebase, caching, and fallback
 * mechanisms to ensure reliability while providing paywall protection.
 */
```

## Integration With Calculator
The calculator.js file may need to be updated to handle the async nature of rates:

1. Call `preloadCommonJurisdictions()` during initialization
2. Add error handling for rate retrieval failures
3. Update any code that directly accesses jurisdiction properties

## Testing Considerations
- Test with and without Firebase connectivity
- Test with authenticated and unauthenticated users
- Verify caching works correctly
- Test fallback mechanisms

## Next Steps
After modifying the interest rates module, you'll need to implement Firebase authentication in the calculator UI to allow users to sign in and pay for access.
