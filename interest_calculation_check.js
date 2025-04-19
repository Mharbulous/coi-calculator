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

// Test case 1: Judgment date is one day after prejudgment start date (2022-01-02)
function testOneDayPeriod() {
    console.log("Test Case 1: One-day period (2022-01-01 to 2022-01-02)");
    
    const mockState = {
        inputs: { jurisdiction: 'BC' },
        results: { specialDamages: [] }
    };
    
    const principal = 10000;
    const startDate = createUTCDate(2022, 1, 1); // Jan 1, 2022
    const endDate = createUTCDate(2022, 1, 2);   // Jan 2, 2022 (one day after start)
    
    // First, check that daysBetween correctly calculates 2 days for this range
    const days = daysBetween(startDate, endDate);
    console.log(`Days between ${startDate.toISOString()} and ${endDate.toISOString()}: ${days}`);
    
    // Now calculate interest for this period
    const result = calculateInterestPeriods(
        mockState,
        'prejudgment',
        startDate,
        endDate,
        principal,
        mockRatesData
    );
    
    console.log("Result details:", result.details);
    console.log("Total interest:", result.total);
    
    // Verify that we have a row for this period
    if (result.details.length === 0) {
        console.error("❌ Test failed: No interest row generated for one-day period");
    } else {
        console.log("✅ Test passed: Interest row generated for one-day period");
        console.log(`Description: ${result.details[0].description}`);
        console.log(`Interest: ${result.details[0].interest}`);
    }
}

// Test case 2: Judgment date is the same as prejudgment start date (2022-01-01)
function testSameDayPeriod() {
    console.log("\nTest Case 2: Same-day period (2022-01-01 to 2022-01-01)");
    
    const mockState = {
        inputs: { jurisdiction: 'BC' },
        results: { specialDamages: [] }
    };
    
    const principal = 10000;
    const startDate = createUTCDate(2022, 1, 1); // Jan 1, 2022
    const endDate = createUTCDate(2022, 1, 1);   // Jan 1, 2022 (same as start)
    
    // First, check that daysBetween correctly calculates 1 day for this range
    const days = daysBetween(startDate, endDate);
    console.log(`Days between ${startDate.toISOString()} and ${endDate.toISOString()}: ${days}`);
    
    // Now calculate interest for this period
    const result = calculateInterestPeriods(
        mockState,
        'prejudgment',
        startDate,
        endDate,
        principal,
        mockRatesData
    );
    
    console.log("Result details:", result.details);
    console.log("Total interest:", result.total);
    
    // Verify that we have a row for this period
    if (result.details.length === 0) {
        console.error("❌ Test failed: No interest row generated for same-day period");
    } else {
        console.log("✅ Test passed: Interest row generated for same-day period");
        console.log(`Description: ${result.details[0].description}`);
        console.log(`Interest: ${result.details[0].interest}`);
    }
}

// Run the tests
console.log("=== Testing One-Day Interest Period Fix ===");
testOneDayPeriod();
testSameDayPeriod();
