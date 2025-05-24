import { calculateInterestPeriods } from './src/calculations.js';
import { daysBetween, normalizeDate } from './src/utils.date.js';

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
    const mockState = {
        inputs: { jurisdiction: 'BC' },
        results: { specialDamages: [] }
    };
    
    const principal = 10000;
    const startDate = createUTCDate(2022, 1, 1); // Jan 1, 2022
    const endDate = createUTCDate(2022, 1, 2);   // Jan 2, 2022 (one day after start)
    
    // Check days between dates
    const days = daysBetween(startDate, endDate);
    
    // Calculate interest for this period
    const result = calculateInterestPeriods(
        mockState,
        'prejudgment',
        startDate,
        endDate,
        principal,
        mockRatesData
    );
    
    return {
        days,
        result,
        hasInterestRow: result.details.length > 0
    };
}

// Test case 2: Judgment date is the same as prejudgment start date (2022-01-01)
function testSameDayPeriod() {
    const mockState = {
        inputs: { jurisdiction: 'BC' },
        results: { specialDamages: [] }
    };
    
    const principal = 10000;
    const startDate = createUTCDate(2022, 1, 1); // Jan 1, 2022
    const endDate = createUTCDate(2022, 1, 1);   // Jan 1, 2022 (same as start)
    
    // Check days between dates
    const days = daysBetween(startDate, endDate);
    
    // Calculate interest for this period
    const result = calculateInterestPeriods(
        mockState,
        'prejudgment',
        startDate,
        endDate,
        principal,
        mockRatesData
    );
    
    return {
        days,
        result,
        hasInterestRow: result.details.length > 0
    };
}

// Export the test functions instead of running them directly
export { testOneDayPeriod, testSameDayPeriod };
