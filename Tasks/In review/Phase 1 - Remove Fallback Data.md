# Phase 1: Remove Fallback Data

## Objective
Remove the hardcoded fallback data mechanism to verify that Firebase integration is working correctly.

## Estimated Time
1-2 hours

## Tasks

### 1. Modify `firebaseRates.js`
- Remove the import of local rates from `interestRates.js`
- Remove the fallback to local rates when Firebase fetch fails
- Ensure proper error propagation when Firebase data cannot be retrieved

### 2. Update `firebaseIntegration.js`
- Remove the fallback mechanism that returns local rates when Firebase fails
- Add proper error handling to clearly show when Firebase fails
- Ensure errors are propagated to the application

### 3. Test the Application
- Verify the application works correctly when Firebase is available
- Verify the application fails appropriately when Firebase is unavailable
- Check console logs to confirm Firebase data is being used

## Implementation Details

### Changes to `firebaseRates.js`

```javascript
// Remove this import
import { default as localRates, lastUpdated as localLastUpdated, validUntil as localValidUntil } from "./interestRates.js";

// Remove these initializations with local data
let firebaseRates = { ...localRates };
let firebaseLastUpdated = localLastUpdated;
let firebaseValidUntil = localValidUntil;

// Update the fetchRatesFromFirebase function to not fall back to local rates
export async function fetchRatesFromFirebase() {
  try {
    console.log("Fetching interest rates from Firebase...");
    const ratesCollection = collection(db, "interestRates");
    
    // Get all jurisdiction documents
    const querySnapshot = await getDocs(ratesCollection);
    
    // Temporary storage for the fetched rates
    const fetchedRates = {};
    let fetchedLastUpdated = null;
    let fetchedValidUntil = null;
    
    // Process each jurisdiction document
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const jurisdictionCode = docSnapshot.id.split('-')[0]; // Extract BC from BC-COIA
      
      // Store the rates for this jurisdiction
      if (data.rates && Array.isArray(data.rates)) {
        fetchedRates[jurisdictionCode] = data.rates;
      }
      
      // Update lastUpdated and validUntil if available
      if (data.lastUpdated) {
        fetchedLastUpdated = parseUTCDate(data.lastUpdated);
      }
      
      if (data.validUntil) {
        fetchedValidUntil = parseUTCDate(data.validUntil);
      }
    });
    
    // If we got data from Firebase, process it
    if (Object.keys(fetchedRates).length > 0) {
      console.log("Successfully fetched rates from Firebase");
      
      // Process the fetched rates
      const processedFetchedRates = {};
      for (const jurisdiction in fetchedRates) {
        // Sort rates by start date to ensure proper order
        const sortedRates = [...fetchedRates[jurisdiction]]
          .map(rate => ({
            ...rate,
            start: parseUTCDate(rate.start)
          }))
          .filter(rate => rate.start !== null) // Skip invalid entries
          .sort((a, b) => a.start - b.start); // Ensure rates are sorted by start date
        
        // Calculate end dates dynamically
        processedFetchedRates[jurisdiction] = sortedRates.map((rate, index) => {
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
              end: endOfDayUTC(fetchedValidUntil) // Ensure end date includes the whole day
            };
          }
        });
      }
      
      // Return the processed rates with source information
      return {
        rates: processedFetchedRates,
        lastUpdated: fetchedLastUpdated,
        validUntil: fetchedValidUntil,
        source: 'firebase'
      };
    } else {
      // If no data was retrieved, throw an error
      throw new Error("No interest rate data retrieved from Firebase");
    }
  } catch (error) {
    console.error("Error fetching rates from Firebase:", error);
    // Instead of falling back to local rates, throw the error to be handled by the caller
    throw error;
  }
}

// Update exports to remove local fallback references
export { fetchRatesFromFirebase };
```

### Changes to `firebaseIntegration.js`

```javascript
// Update the imports to remove the local rates
import { firebaseApp, db } from './firebaseConfig.js';
import { fetchRatesFromFirebase } from './firebaseRates.js';
// Remove this import: import { default as localRates, lastUpdated, validUntil } from './interestRates.js';

// Function to fetch rates and handle errors
export async function getInterestRates() {
  try {
    // Try to fetch rates from Firebase
    const result = await fetchRatesFromFirebase();
    
    // Check if we got data from Firebase
    if (result.source === 'firebase') {
      console.log('%c✅ USING FIREBASE DATA: Successfully fetched interest rates from Firebase', 'color: green; font-weight: bold');
      return result;
    } else {
      // This should not happen with our updated fetchRatesFromFirebase function
      // But just in case, throw an error
      console.error('Unexpected result from fetchRatesFromFirebase');
      throw new Error('Failed to fetch interest rates from Firebase');
    }
  } catch (error) {
    // Log error and propagate it (no fallback to local rates)
    console.error('Error fetching interest rates from Firebase:', error);
    console.log('%c❌ FIREBASE ERROR: Unable to load interest rates', 'color: red; font-weight: bold');
    
    // Propagate the error instead of falling back to local rates
    throw error;
  }
}

// Export Firebase instances for potential future use
export { firebaseApp, db };
```

## Expected Outcomes

1. When Firebase is properly connected and has data:
   - The application should function normally
   - Console logs should show "USING FIREBASE DATA"
   - All interest calculations should work with the Firebase data

2. When Firebase is unavailable or fails:
   - The application should show errors
   - Console logs should show "FIREBASE ERROR"
   - The application will not fall back to hardcoded data

## Success Criteria

The main success criterion is that you can definitively verify whether the application is using data from Firebase or not. If Firebase is unavailable, the application should fail rather than silently using hardcoded data.
