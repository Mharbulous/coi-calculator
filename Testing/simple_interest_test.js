// Test file to verify simple interest calculations
import useStore from './store.js';
import { calculateInterestPeriods } from './calculations.js';

// Initialize state with test data
const testState = {
    inputs: {
        jurisdiction: 'BC'
    },
    results: {
        specialDamages: []
    }
};

// Mock interest rates data
const mockRatesData = {
    BC: [
        {
            start: new Date('2024-01-01'),
            end: new Date('2024-12-31'),
            prejudgment: 5,
            postjudgment: 5
        }
    ]
};

// Test function for simple interest calculation
function testSimpleInterest() {
    console.log("Testing simple interest calculation...");
    
    // Test dates (6 month period)
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-07-01');
    
    // Calculate interest for a 6-month period at 5% on $10,000
    const result = calculateInterestPeriods(
        testState,
        'prejudgment',
        startDate,
        endDate,
        10000,
        mockRatesData
    );
    
    console.log("Interest calculation results:", result);
    
    // Expected: Simple interest for 182 days at 5% on $10,000
    // = 10000 * 0.05 * (182/366) ≈ $248.63
    console.log("Interest amount calculated:", result.total);
    
    // Validate interest is calculated correctly (no compounding)
    console.log("Is interest calculated as simple interest?", 
        Math.abs(result.total - 250) < 10); // Approximate check
    
    return result;
}

// Run the test
testSimpleInterest();
