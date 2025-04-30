# Task 45: Implement Mock Interest Rate Data

## Objective
Create a modified version of the interest rate data for demo mode and implement a mechanism to switch between real and mock data based on payment status.

## Estimated Time
1-2 hours

## Prerequisites
- Understanding of the current interest rate data structure
- Knowledge of ES modules and JavaScript export patterns

## Tasks

### 1. Create Mock Interest Rate Data
- Make a copy of the real interest rate data
- Modify the interest rates by small amounts (±0.25-0.5%)
- Keep the same date ranges and structure to ensure calculations work correctly
- Ensure the modifications are consistent and logical

### 2. Implement Payment Status Check
- Create a function to check if the user has made a payment
- Use localStorage to persist payment status
- Implement timestamp checking to enforce time-limited access if desired

### 3. Implement Data Switching Logic
- Modify the interest rates module to export either real or mock data based on payment status
- Ensure the switching mechanism is clean and doesn't cause side effects
- Add appropriate logging for debugging purposes

### 4. Update Import References
- Update any import references in the codebase that use the interest rate data
- Ensure backward compatibility with existing code

## Implementation Details

### Mock Data Implementation

```javascript
// In interestRates.js or a new mockInterestRates.js file

// Original rates (keep as is)
export const realRates = {
  BC: [
    { start: "1993-01-01", prejudgment: 5.25, postjudgment: 7.25 },
    { start: "1993-07-01", prejudgment: 4.00, postjudgment: 6.00 },
    // ... other rates
  ]
};

// Mock rates (slightly modified)
export const mockRates = {
  BC: [
    { start: "1993-01-01", prejudgment: 5.00, postjudgment: 7.00 },
    { start: "1993-07-01", prejudgment: 3.75, postjudgment: 5.75 },
    // ... other rates with small modifications
  ]
};

// Function to check if user has verified payment
export const hasVerifiedPayment = () => {
  const token = localStorage.getItem('payment_verified');
  const timestamp = localStorage.getItem('payment_timestamp');
  
  // Check if payment is recent (e.g., within 24 hours)
  const isRecent = timestamp && (Date.now() - parseInt(timestamp) < 24 * 60 * 60 * 1000);
  
  return token && isRecent;
};

// Export the appropriate rates based on payment status
const ratesData = hasVerifiedPayment() ? realRates : mockRates;

// Export additional metadata
export const lastUpdated = new Date().toISOString().split('T')[0]; // Today's date
export const validUntil = "2026-12-31"; // Set an appropriate end date

// Default export for backward compatibility
export default ratesData;
```

### JavaScript for Logging Rate Source

```javascript
// Add to the initialization code
import { hasVerifiedPayment } from './interestRates.js';

function logRateSource() {
  if (hasVerifiedPayment()) {
    console.log('%c✅ USING REAL INTEREST RATES: Payment verified', 'color: green; font-weight: bold');
  } else {
    console.log('%c⚠️ USING MOCK INTEREST RATES: Demo mode active', 'color: orange; font-weight: bold');
  }
}

// Call this on application initialization
document.addEventListener('DOMContentLoaded', logRateSource);
```

## Acceptance Criteria
- Mock interest rate data is created with appropriate modifications (±0.25-0.5%)
- Payment status checking function works correctly with localStorage
- The application correctly switches between real and mock data based on payment status
- All calculations work correctly with both real and mock data
- Console logging clearly indicates which data set is being used

## Notes
- Be careful not to modify the real interest rates accidentally
- Keep modifications to mock data small enough to be realistic but noticeable in calculations
- Consider adding a mechanism to clear payment status for testing purposes
- Ensure the localStorage implementation works across different browsers
