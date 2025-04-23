# Task 1.2: Design and Create Interest Rates Collection Structure

## Overview
This task focuses on defining and implementing the database structure for storing interest rates in Firestore. We'll create a collection structure that supports both real (accurate) rates and demo (intentionally inaccurate) rates to enable a demonstration version of the app alongside the full paid version.

## Complexity
Simple

## Estimated Time
45 minutes (increased from 30 minutes to accommodate demo version structure)

## Implementation Steps

### 1. Set Up Interest Rates Collection
1. In the Firebase Console, navigate to your Firestore Database
2. Create a new collection called `interestRates`
3. Create a document for BC jurisdiction with ID `BC` for real rates
4. Create a document with ID `BC_demo` for demo rates

### 2. Add Real Rate Data
1. In the BC document, create an array field called `rates` with the following structure:
   ```
   rates: [
     { start: "1993-01-01", prejudgment: 5.25, postjudgment: 7.25 },
     { start: "1993-07-01", prejudgment: 4.00, postjudgment: 6.00 },
     // Add more records matching the current interestRates.js data
   ]
   ```
2. Import at least 5-10 rate entries from the current interestRates.js file for testing
3. Ensure the date format follows "YYYY-MM-DD" and rate values are numbers

### 3. Add Demo Rate Data
1. In the BC_demo document, create an array field called `rates` with a structure similar to the real rates but with slightly modified values:
   ```
   rates: [
     { start: "1993-01-01", prejudgment: 5.59, postjudgment: 7.64 },
     { start: "1993-07-01", prejudgment: 4.35, postjudgment: 6.42 },
     // Add more records based on mockRates.js data
   ]
   ```
2. Import rate entries from the mockRates.js file, ensuring they're intentionally different from real rates
3. Ensure a consistent structure between real and demo rate documents

### 4. Add Metadata Document
1. Create a separate document in the `interestRates` collection with ID `metadata`
2. Add the following fields:
   - `lastUpdated`: current date in "YYYY-MM-DD" format
   - `validUntil`: date until which rates are valid (e.g., "2025-06-30")

### 5. Document Database Structure
1. Create documentation describing the dual structure for real and demo rates
2. Define the naming convention: real rates use jurisdiction code (e.g., "BC"), demo rates append "_demo" (e.g., "BC_demo")
3. Document that only demo rate documents will be accessible without authentication

## Testing Steps
1. Verify the collection structure in the Firestore Database console
2. Confirm that both real and demo rate data are properly formatted
3. Compare real and demo rates to ensure they're different but structurally identical
4. Validate that the metadata document contains the correct fields

## Expected Outcome
By the end of this subtask, you should have:
1. A properly structured `interestRates` collection in Firestore
2. BC jurisdiction document with real rate data
3. BC_demo jurisdiction document with intentionally modified rate data
4. Metadata document with lastUpdated and validUntil information
5. Documentation of the database structure supporting both modes

## Notes
- The structure supports both real and demo rates while maintaining separation
- Demo rates should be based on real rates but modified to ensure they're clearly different
- This dual structure allows unauthenticated users to access demo rates while protecting real rates
- This implementation integrates requirements from Task A.1 (Revise Firebase Structure for Demo Version)
