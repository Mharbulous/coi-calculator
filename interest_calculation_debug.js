import { calculateInterestPeriods } from './BC COIA calculator/calculations.js';
import { daysBetween, normalizeDate } from './BC COIA calculator/utils.date.js';

// Helper to create UTC date without time component
const createUTCDate = (year, month, day) => new Date(Date.UTC(year, month - 1, day));

// Mock interest rates data for testing
const mockRatesData = {
    BC: [
        // Period 1: Jan 1, 2022 - Jun 30, 2022
        { start: createUTCDate(2022, 1, 1), end: createUTCDate(2022, 6, 30), prejudgment: 2.0, postjudgment: 3.0 },
        // Period 2: Jul 1, 2022 - Dec 31, 2022
        { start: createUTCDate(2022, 7, 1), end: createUTCDate(2022, 12, 31), prejudgment: 2.5, postjudgment: 3.5 },
    ]
};

// We can't directly access getApplicableRatePeriods since it's not exported

// Debug the calculateInterestPeriods function
function debugCalculateInterestPeriods() {
    console.log("\n=== Debugging calculateInterestPeriods ===");
    
    const mockState = {
        inputs: { jurisdiction: 'BC' },
        results: { specialDamages: [] }
    };
    
    const principal = 10000;
    
    // Test case 1: Same-day period (2022-01-01 to 2022-01-01)
    const startDate1 = createUTCDate(2022, 1, 1); // Jan 1, 2022
    const endDate1 = createUTCDate(2022, 1, 1);   // Jan 1, 2022 (same as start)
    
    console.log(`Test Case 1: Same-day period (${startDate1.toISOString()} to ${endDate1.toISOString()})`);
    
    // Call calculateInterestPeriods
    const result1 = calculateInterestPeriods(
        mockState,
        'prejudgment',
        startDate1,
        endDate1,
        principal,
        mockRatesData
    );
    
    console.log("Result details:", result1.details);
    console.log("Total interest:", result1.total);
    
    // Test case 2: One-day period (2022-01-01 to 2022-01-02)
    const startDate2 = createUTCDate(2022, 1, 1); // Jan 1, 2022
    const endDate2 = createUTCDate(2022, 1, 2);   // Jan 2, 2022 (one day after start)
    
    console.log(`\nTest Case 2: One-day period (${startDate2.toISOString()} to ${endDate2.toISOString()})`);
    
    // Call calculateInterestPeriods
    const result2 = calculateInterestPeriods(
        mockState,
        'prejudgment',
        startDate2,
        endDate2,
        principal,
        mockRatesData
    );
    
    console.log("Result details:", result2.details);
    console.log("Total interest:", result2.total);
}

// Run the debug function
debugCalculateInterestPeriods();
