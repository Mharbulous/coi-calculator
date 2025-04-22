# Task 3.1: Create Firebase Data Fetching Service with Mode Awareness

## Overview
This task involves creating a service to fetch interest rate data from Firebase, with support for both demo and real rate data. The service will handle retrieving data based on the current application mode, with appropriate caching and error handling.

## Complexity
Medium (increased from Simple due to mode-aware functionality)

## Estimated Time
45 minutes (increased from 30 minutes to accommodate dual-mode support)

## Implementation Steps

### 1. Create Mode-Aware Data Fetching Service
1. Implement a service to fetch interest rates from Firebase
   - Support fetching from both real and demo rate documents
   - Accept a mode parameter to determine which rates to fetch
   - Use document naming convention (e.g., "BC" for real rates, "BC_demo" for demo rates)
2. Implement type checking and data validation
   - Ensure retrieved data matches expected structure
   - Handle potential data format inconsistencies

### 2. Implement Separate Caching Strategies
1. Create separate caching mechanisms for demo and real rates
   - Use distinct cache keys for each mode and jurisdiction
   - Implement appropriate cache expiration times
2. Implement cache management functions
   - Add methods to clear demo or real rate caches independently
   - Add function to verify cache integrity

### 3. Add Mode-Specific Error Handling
1. Implement enhanced error handling for different modes
   - For demo mode errors, attempt to use local mock data as fallback
   - For real mode errors, offer to switch to demo mode
   - Include detailed error logging with mode context
2. Create fallback mechanisms
   - Import local mockRates.js as last resort for demo mode
   - Implement graceful degradation strategy

### 4. Add Mode Transition Support
1. Implement functionality to handle mode transitions
   - Clear appropriate cache when switching modes
   - Manage in-flight requests when mode changes
   - Ensure smooth transitions between modes

### 5. Ensure Offline Compatibility
1. Add support for offline operation in both modes
   - Prioritize cache use when offline
   - Include timestamps to identify potentially stale data
   - Add visual indicators for offline/cached data usage

### 6. Create a Clean API for Rate Retrieval
1. Design a simple API for other components to use
   - Hide mode complexity behind a clean interface
   - Provide methods that automatically use current application mode
   - Include helper methods for common rate operations

## Testing Procedures
1. Test fetching rates in demo mode without authentication
2. Test fetching rates in paid mode with authentication
3. Test caching behavior for both modes
4. Test fallback mechanisms when Firebase is unavailable
5. Test proper error handling for various failure scenarios
6. Test mode transitions and their effect on cached data

## Expected Outcome
1. A complete data fetching service that supports both demo and real modes
2. Efficient caching strategy with mode-specific considerations
3. Robust error handling with appropriate fallbacks
4. Smooth mode transition support
5. Clean API that hides mode complexity from other components

## Notes
- The service should be designed to work seamlessly with the mode management system
- Demo mode should work without authentication, while real mode requires valid authentication
- Error handling should provide helpful information for debugging without exposing sensitive details
- This implementation integrates elements from Task A.2 (Modify Access Control for Demo Mode)
