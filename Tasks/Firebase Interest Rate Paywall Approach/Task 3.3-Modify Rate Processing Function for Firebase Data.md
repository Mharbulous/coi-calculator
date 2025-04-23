# Task 3.3: Modify Rate Processing Function for Firebase Data

## Overview
Refactor the existing interestRates.js module to work with the Firebase data structure. This task involves updating the core rate processing functions to seamlessly work with data from both Firebase and the original hardcoded structure, ensuring backward compatibility while enabling the transition to cloud-based data.

## Complexity
Simple

## Estimated Time
30 minutes

## Implementation Steps

1. Update the interestRates.js file to integrate with the Firebase services:
   ```javascript
   // Interest Rate Data Module with Firebase Integration
   import { fetchRates, checkRatesAccess } from '../firebase/rateService.js';
   import { getCachedRatesData, cacheRatesData, cacheNeedsRefresh } from '../firebase/cacheService.js';

   // Helper function to parse date strings consistently to UTC Date objects
   function parseUTCDate(dateString) {
       // Keep original implementation
       // ...existing code...
   }

   // Helper function to set the time to the end of the day in UTC
   function endOfDayUTC(date) {
       // Keep original implementation
       // ...existing code...
   }

   // Fallback data in case Firebase is unavailable
   const fallbackRates = {
       BC: [
           // Include only the most recent rates as fallback
           { start: "2024-07-01", prejudgment: 4.95, postjudgment: 6.95 },
           { start: "2025-01-01", prejudgment: 3.45, postjudgment: 5.45 },
       ],
       // Minimal fallback data for other jurisdictions
       AB: [],
       ON: []
   };

   // Fallback metadata
   const fallbackLastUpdated = parseUTCDate("2025-04-19");
   const fallbackValidUntil = parseUTCDate("2025-06-30");

   // Process the raw rates into Date objects for easier comparison
   function processRates(rawRates) {
       const processed = {};
       
       for (const jurisdiction in rawRates) {
           // Sort rates by start date to ensure proper order
           const sortedRates = [...rawRates[jurisdiction]]
               .map(rate => ({
                   ...rate,
                   start: rate.start instanceof Date ? rate.start : parseUTCDate(rate.start)
               }))
               .filter(rate => rate.start !== null) // Skip invalid entries
               .sort((a, b) => a.start - b.start); // Ensure rates are sorted by start date
           
           // Calculate end dates dynamically
           processed[jurisdiction] = sortedRates.map((rate, index) => {
               // If this is not the last rate period, the end date is the day before the next period starts
               if (index < sortedRates.length - 1) {
                   const nextStartDate = new Date(sortedRates[index + 1].start);
                   // Set end date to the day before the next period starts
                   const endDate = new Date(nextStartDate);
                   endDate.setUTCDate(endDate.getUTCDate() - 1);
                   return {
                       ...rate,
                       end: endOfDayUTC(endDate) // Ensure end date includes the whole day
                   };
               } 
               // For the last rate period, use validUntil as the end date
               else {
                   return {
                       ...rate,
                       end: endOfDayUTC(currentValidUntil) // Use the current validUntil date
                   };
               }
           });
       }
       
       return processed;
   }

   // Initialize with fallback data
   let processedRates = processRates(fallbackRates);
   let lastUpdated = fallbackLastUpdated;
   let validUntil = fallbackValidUntil;
   let currentValidUntil = fallbackValidUntil;

   /**
    * Initializes the rate data by fetching from Firebase or using cached data
    * @param {string} jurisdiction - The jurisdiction code (e.g., 'BC')
    * @returns {Promise<boolean>} - Whether the initialization was successful
    */
   export async function initializeRateData(jurisdiction = 'BC') {
       try {
           // Check if the user has access to rates
           const hasAccess = await checkRatesAccess();
           
           if (!hasAccess) {
               console.warn('No access to interest rates. Using limited fallback data.');
               return false;
           }
           
           // Check for valid cached data first
           const cachedData = getCachedRatesData(jurisdiction);
           
           if (cachedData && !cacheNeedsRefresh()) {
               console.log('Using cached interest rates');
               
               // Update the module data with cached values
               const jurisdictionRates = {};
               jurisdictionRates[jurisdiction] = cachedData.rates;
               
               processedRates = processRates(jurisdictionRates);
               lastUpdated = cachedData.lastUpdated;
               validUntil = cachedData.validUntil;
               currentValidUntil = validUntil;
               
               return true;
           }
           
           // Fetch fresh data from Firebase
           const firebaseData = await fetchRates(jurisdiction);
           
           // Cache the fresh data
           cacheRatesData(firebaseData, jurisdiction);
           
           // Update the module data
           const jurisdictionRates = {};
           jurisdictionRates[jurisdiction] = firebaseData.rates;
           
           processedRates = processRates(jurisdictionRates);
           lastUpdated = firebaseData.lastUpdated;
           validUntil = firebaseData.validUntil;
           currentValidUntil = validUntil;
           
           return true;
       } catch (error) {
           console.error('Failed to initialize rate data:', error);
           return false;
       }
   }

   // Export the processed rates, lastUpdated date, validUntil date, and init function
   export { processedRates as default, lastUpdated, validUntil, initializeRateData };
   ```

2. Create a test for the modified interestRates.js:
   ```javascript
   // Test the modified interestRates.js
   import rateData, { lastUpdated, validUntil, initializeRateData } from './interestRates.js';

   async function testInterestRatesModule() {
       console.log('Initial rate data:', rateData);
       console.log('Last updated:', lastUpdated);
       console.log('Valid until:', validUntil);
       
       // Initialize with fresh data
       const success = await initializeRateData('BC');
       console.log('Initialization successful:', success);
       
       // Check updated data
       console.log('Updated rate data:', rateData);
       console.log('New last updated:', lastUpdated);
       console.log('New valid until:', validUntil);
   }

   // Run the test
   testInterestRatesModule();
   ```

## Testing Procedures
1. Run the test script to verify the module can initialize with fallback data
2. Test with authenticated user to ensure Firebase data is fetched
3. Verify that cached data is used when available
4. Confirm that rate processing works correctly with the new data structure
5. Check that end dates are calculated correctly

## Expected Outcome
A refactored interestRates.js module that:
- Seamlessly works with Firebase data
- Provides backward compatibility
- Handles initialization of rate data
- Properly processes data into the required format
- Uses cached data when appropriate

## Notes
- The module should maintain the same API to avoid breaking changes in other parts of the application
- The initialization function should be called at app startup
- Error handling should gracefully fall back to local data when Firebase is unavailable
- Consider performance implications of async data loading
