# Task 1.2: Design and Create Interest Rates Collection Structure

## Overview
This subtask focuses on defining and implementing the database structure for storing interest rates in Firestore. We'll create the collection structure and add sample data based on our current hardcoded values.

## Complexity
Simple

## Estimated Time
30 minutes

## Implementation Steps

### 1. Set Up Interest Rates Collection
1. In the Firebase Console, navigate to your Firestore Database
2. Create a new collection called `interestRates`
3. Create a document for BC jurisdiction with ID `BC`

### 2. Add Sample Rate Data
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

### 3. Add Metadata Document
1. Create a separate document in the `interestRates` collection with ID `metadata`
2. Add the following fields:
   - `lastUpdated`: current date in "YYYY-MM-DD" format
   - `validUntil`: date until which rates are valid (e.g., "2025-06-30")

## Testing Steps
1. Verify the collection structure in the Firestore Database console
2. Confirm that rate data is properly formatted
3. Validate that the metadata document contains the correct fields

## Expected Outcome
By the end of this subtask, you should have:
1. A properly structured `interestRates` collection in Firestore
2. BC jurisdiction document with sample rate data
3. Metadata document with lastUpdated and validUntil information

## Notes
- This structure mirrors how the data is currently organized in interestRates.js
- The structure is designed to be easily queryable and expandable for future jurisdictions
- No application code changes are made in this subtask
