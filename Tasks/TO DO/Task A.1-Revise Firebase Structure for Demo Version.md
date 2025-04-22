# Task A.1: Revise Firebase Structure for Demo Version

## Overview
This task involves reviewing existing plans for the Firebase implementation and enhancing the database structure to support both real and mock interest rate data. The goal is to enable a demonstration version of the app that uses intentionally inaccurate interest rates while storing both real and demo rates securely in Firebase.

## Implementation Details

### 1. Review Existing Firebase Structure Plan
- Review Task 1.2-Design and Create Interest Rates Collection Structure
- Identify all components that need modification to support demo rates

### 2. Enhance Firebase Database Design
Modify the planned Firebase structure to include separate documents for real and demo rates:

```
interestRates (collection)
|
├── BC (document - real rates)
|   └── rates (array)
|       ├── { start: "1993-01-01", prejudgment: 5.25, postjudgment: 7.25 }
|       └── ...additional rates
|
├── BC_demo (document - demo rates)
|   └── rates (array)
|       ├── { start: "1993-01-01", prejudgment: 5.59, postjudgment: 7.64 }
|       └── ...additional rates
|
├── metadata (document)
|   ├── lastUpdated: "2025-04-19"
|   └── validUntil: "2025-06-30"
|
└── ... other jurisdictions (with both real and demo versions)
```

### 3. Update Data Migration Strategy
- Modify the data migration script to handle both real and demo rates
- Use the existing `mockRates.js` as the source for demo rates
- Ensure a consistent structure between real and demo rate documents

### 4. Update Security Rules Plan
- Review Task 5.1-Implement Authentication-Based Security Rules
- Modify security rules to allow unauthenticated access to demo rate documents
- Maintain strict authentication requirements for real rate documents

### 5. Testing Strategy
- Develop specific tests to verify both rate types can be retrieved
- Ensure separation between demo and real rates is maintained
- Verify correct fallback behavior if demo rates are unavailable

## Dependencies
- Task 1.1-Create Firebase Project and Database
- Task 1.2-Design and Create Interest Rates Collection Structure
- Task 1.6-Configure Basic Security Rules

## Deliverables
1. Updated Firebase structure documentation
2. Modified migration script that handles both real and demo rates
3. Updated security rules documentation
4. Test cases for verifying the enhanced structure

## Estimated Time
1 hour
