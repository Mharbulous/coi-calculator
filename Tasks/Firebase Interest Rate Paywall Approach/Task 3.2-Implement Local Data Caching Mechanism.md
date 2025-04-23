# Task 3.2: Implement Local Data Caching Mechanism

## Overview
Implement a caching mechanism for storing interest rate data locally to improve performance, reduce network requests, and support offline access. This will ensure the calculator remains functional even when temporarily offline.

## Complexity
Simple

## Estimated Time
30 minutes

## Implementation Steps

1. Create a new file `firebase/cacheService.js` to handle local caching:
   ```javascript
   // Constants for cache keys and expiration
   const CACHE_KEYS = {
       RATES_DATA: 'coia_rates_data',
       CACHE_TIMESTAMP: 'coia_cache_timestamp',
       CACHE_EXPIRY: 86400000 // 24 hours in milliseconds
   };

   /**
    * Saves interest rate data to local storage
    * @param {Object} data - Interest rate data to cache
    * @param {string} jurisdiction - Jurisdiction code for the rates
    */
   export function cacheRatesData(data, jurisdiction) {
       try {
           // Create a cache entry with metadata
           const cacheEntry = {
               jurisdiction,
               data,
               timestamp: Date.now()
           };
           
           // Save to localStorage
           localStorage.setItem(
               `${CACHE_KEYS.RATES_DATA}_${jurisdiction}`, 
               JSON.stringify(cacheEntry)
           );
           
           // Update the cache timestamp
           localStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
           
           console.log(`Cached interest rates for ${jurisdiction}`);
       } catch (error) {
           console.error('Error caching interest rates:', error);
       }
   }

   /**
    * Retrieves cached interest rate data from local storage
    * @param {string} jurisdiction - Jurisdiction code for the rates
    * @returns {Object|null} - The cached data or null if not found/expired
    */
   export function getCachedRatesData(jurisdiction) {
       try {
           // Get the cached data
           const cachedJson = localStorage.getItem(`${CACHE_KEYS.RATES_DATA}_${jurisdiction}`);
           
           if (!cachedJson) {
               return null;
           }
           
           const cachedEntry = JSON.parse(cachedJson);
           
           // Check if cache is expired
           const now = Date.now();
           if (now - cachedEntry.timestamp > CACHE_KEYS.CACHE_EXPIRY) {
               // Cache expired, clear it
               localStorage.removeItem(`${CACHE_KEYS.RATES_DATA}_${jurisdiction}`);
               return null;
           }
           
           // Process dates that were stringified in JSON
           const processedData = {
               ...cachedEntry.data,
               lastUpdated: new Date(cachedEntry.data.lastUpdated),
               validUntil: new Date(cachedEntry.data.validUntil)
           };
           
           // Process rate dates
           if (processedData.rates) {
               processedData.rates = processedData.rates.map(rate => ({
                   ...rate,
                   start: new Date(rate.start),
                   end: rate.end ? new Date(rate.end) : undefined
               }));
           }
           
           return processedData;
       } catch (error) {
           console.error('Error retrieving cached rates:', error);
           return null;
       }
   }

   /**
    * Clears all cached interest rate data
    */
   export function clearRatesCache() {
       try {
           // Get all localStorage keys
           const keys = Object.keys(localStorage);
           
           // Filter and remove all interest rate cache entries
           keys.forEach(key => {
               if (key.startsWith(CACHE_KEYS.RATES_DATA) || 
                   key === CACHE_KEYS.CACHE_TIMESTAMP) {
                   localStorage.removeItem(key);
               }
           });
           
           console.log('Interest rates cache cleared');
       } catch (error) {
           console.error('Error clearing rates cache:', error);
       }
   }

   /**
    * Checks if the cache is valid or needs refreshing
    * @returns {boolean} - Whether the cache needs refreshing
    */
   export function cacheNeedsRefresh() {
       const timestamp = localStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP);
       
       if (!timestamp) {
           return true;
       }
       
       const now = Date.now();
       return (now - parseInt(timestamp, 10)) > CACHE_KEYS.CACHE_EXPIRY;
   }
   ```

2. Update the test script to include cache testing:
   ```javascript
   // Test the cache service
   import { cacheRatesData, getCachedRatesData, clearRatesCache } from './firebase/cacheService.js';

   function testCacheService() {
       // Example rates data
       const testData = {
           rates: [
               { start: new Date('2025-01-01'), prejudgment: 3.45, postjudgment: 5.45 }
           ],
           lastUpdated: new Date('2025-04-19'),
           validUntil: new Date('2025-06-30')
       };
       
       // Test caching
       cacheRatesData(testData, 'BC');
       
       // Retrieve from cache
       const cachedData = getCachedRatesData('BC');
       console.log('Retrieved from cache:', cachedData);
       
       // Clear cache
       clearRatesCache();
       
       // Verify cleared
       const afterClear = getCachedRatesData('BC');
       console.log('After clearing cache:', afterClear);
   }

   // Run the test
   testCacheService();
   ```

## Testing Procedures
1. Run the cache test script to verify data can be stored and retrieved
2. Validate that cache expiration works correctly
3. Test cache refresh logic
4. Verify that cached dates are correctly converted back to Date objects

## Expected Outcome
A reliable caching mechanism that:
- Efficiently stores interest rate data in localStorage
- Properly handles data serialization/deserialization
- Implements appropriate cache expiration policies
- Provides methods to check, retrieve, and clear cached data

## Notes
- Keep in mind localStorage size limitations (typically 5-10MB)
- Consider implementing compression for larger datasets if needed
- Ensure date objects are properly serialized and deserialized
- The cache should be transparent to the rest of the application
