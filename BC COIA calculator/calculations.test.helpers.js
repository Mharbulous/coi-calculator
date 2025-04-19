import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculateInterestPeriods } from './calculations.js';

// Import the helper functions for testing
// Note: Since these are not exported, we'll test them indirectly through the main function

// Helper to create UTC date without time component
const createUTCDate = (year, month, day) => new Date(Date.UTC(year, month - 1, day));

// Helper function for comparing floating point numbers
const expectToBeCloseTo = (actual, expected, precision = 2) => {
    expect(actual).toBeCloseTo(expected, precision);
};

// Mock interest rates data for testing
const mockRatesData = {
    BC: [
        // Period 1: Jan 1, 2022 - Jul 1, 2022 (half-open interval)
        { start: createUTCDate(2022, 1, 1), end: createUTCDate(2022, 7, 1), prejudgment: 2.0, postjudgment: 3.0 },
        // Period 2: Jul 1, 2022 - Jan 1, 2023 (half-open interval)
        { start: createUTCDate(2022, 7, 1), end: createUTCDate(2023, 1, 1), prejudgment: 2.5, postjudgment: 3.5 },
        // Period 3: Jan 1, 2023 - Jul 1, 2023 (half-open interval)
        { start: createUTCDate(2023, 1, 1), end: createUTCDate(2023, 7, 1), prejudgment: 3.0, postjudgment: 4.0 },
        // Period 4: Jul 1, 2023 - Jan 1, 2024 (half-open interval)
        { start: createUTCDate(2023, 7, 1), end: createUTCDate(2024, 1, 1), prejudgment: 3.5, postjudgment: 4.5 },
    ]
};

describe('Interest Calculation Helper Functions', () => {
    // Test the simplified flow with no special damages
    it('should calculate interest correctly with no special damages', () => {
        const mockState = {
            inputs: { jurisdiction: 'BC' },
            results: { specialDamages: [] }
        };
        
        const principal = 10000;
        const startDate = createUTCDate(2023, 1, 1); // Jan 1, 2023
        const endDate = createUTCDate(2023, 6, 30); // Jun 30, 2023
        
        const result = calculateInterestPeriods(
            mockState,
            'prejudgment',
            startDate,
            endDate,
            principal,
            mockRatesData
        );
        
        // Verify the result structure
        expect(result).toHaveProperty('details');
        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('principal');
        expect(result).toHaveProperty('finalPeriodDamageInterestDetails');
        
        // Verify the details
        expect(result.details.length).toBe(1);
        expect(result.details[0].rate).toBe(3.0);
        expect(result.details[0].principal).toBe(principal);
        
        // Verify the principal remains unchanged
        expect(result.principal).toBe(principal);
        
        // Verify no final period damage details
        expect(result.finalPeriodDamageInterestDetails.length).toBe(0);
    });
    
    // Test the simplified flow with special damages
    it('should calculate interest correctly with special damages', () => {
        const specialDamages = [
            { date: '2023-02-15', amount: 500, description: 'Damage 1' },
            { date: '2023-04-20', amount: 750, description: 'Damage 2' },
            // Add a damage on the end date to test the edge case
            { date: '2023-06-30', amount: 250, description: 'Damage 3 (on end date)' }
        ];
        
        const mockState = {
            inputs: { jurisdiction: 'BC' },
            results: { specialDamages }
        };
        
        const principal = 10000;
        const startDate = createUTCDate(2023, 1, 1); // Jan 1, 2023
        const endDate = createUTCDate(2023, 6, 30); // Jun 30, 2023
        
        const result = calculateInterestPeriods(
            mockState,
            'prejudgment',
            startDate,
            endDate,
            principal,
            mockRatesData
        );
        
        // Verify the result structure
        expect(result).toHaveProperty('details');
        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('principal');
        expect(result).toHaveProperty('finalPeriodDamageInterestDetails');
        
        // Verify the details
        expect(result.details.length).toBe(1);
        expect(result.details[0].rate).toBe(3.0);
        
        // Verify the principal includes all damages
        expect(result.principal).toBe(principal + 500 + 750 + 250);
        
        // With the new half-open interval approach, damages on the end date (2023-06-30)
        // are now considered part of the next period (Period 4), not the final period (Period 3)
        // So we only have 2 damages in the final period
        expect(result.finalPeriodDamageInterestDetails.length).toBe(2);
    });
    
    // Test the simplified flow with special damages in the final period
    it('should calculate interest correctly for special damages in the final period', () => {
        const specialDamages = [
            { date: '2023-06-15', amount: 1000, description: 'Final Period Damage' },
            // Add a damage on the end date to test the edge case
            { date: '2023-06-30', amount: 500, description: 'End Date Damage' }
        ];
        
        const mockState = {
            inputs: { jurisdiction: 'BC' },
            results: { specialDamages }
        };
        
        const principal = 10000;
        const startDate = createUTCDate(2023, 1, 1); // Jan 1, 2023
        const endDate = createUTCDate(2023, 6, 30); // Jun 30, 2023
        
        const result = calculateInterestPeriods(
            mockState,
            'prejudgment',
            startDate,
            endDate,
            principal,
            mockRatesData
        );
        
        // Verify the result structure
        expect(result).toHaveProperty('details');
        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('principal');
        expect(result).toHaveProperty('finalPeriodDamageInterestDetails');
        
        // Verify the details
        expect(result.details.length).toBe(1);
        expect(result.details[0].rate).toBe(3.0);
        expect(result.details[0].principal).toBe(principal);
        
        // Verify the principal includes all damages
        expect(result.principal).toBe(principal + 1000 + 500);
        
        // With the new half-open interval approach, damages on the end date (2023-06-30)
        // are now considered part of the next period (Period 4), not the final period (Period 3)
        // So we only have 1 damage in the final period
        expect(result.finalPeriodDamageInterestDetails.length).toBe(1);
        expect(result.finalPeriodDamageInterestDetails[0].principal).toBe(1000);
        expect(result.finalPeriodDamageInterestDetails[0].isFinalPeriodDamage).toBe(true);
    });
    
    // Test the simplified flow with multiple rate periods
    it('should calculate interest correctly across multiple rate periods', () => {
        const mockState = {
            inputs: { jurisdiction: 'BC' },
            results: { specialDamages: [] }
        };
        
        const principal = 10000;
        const startDate = createUTCDate(2022, 6, 1); // Jun 1, 2022
        const endDate = createUTCDate(2023, 2, 28); // Feb 28, 2023
        
        const result = calculateInterestPeriods(
            mockState,
            'prejudgment',
            startDate,
            endDate,
            principal,
            mockRatesData
        );
        
        // Verify the result structure
        expect(result).toHaveProperty('details');
        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('principal');
        
        // Verify the details - should have 3 segments (Period 1, Period 2, Period 3)
        expect(result.details.length).toBe(3);
        
        // Verify the rates for each segment
        expect(result.details[0].rate).toBe(2.0); // Period 1
        expect(result.details[1].rate).toBe(2.5); // Period 2
        expect(result.details[2].rate).toBe(3.0); // Period 3
        
        // Verify the principal remains unchanged
        expect(result.principal).toBe(principal);
    });
    
    // Test the simplified flow with postjudgment interest
    it('should calculate postjudgment interest correctly', () => {
        const mockState = {
            inputs: { jurisdiction: 'BC' },
            results: { specialDamages: [] }
        };
        
        const principal = 20000;
        const startDate = createUTCDate(2023, 1, 1); // Jan 1, 2023
        const endDate = createUTCDate(2023, 12, 31); // Dec 31, 2023
        
        const result = calculateInterestPeriods(
            mockState,
            'postjudgment',
            startDate,
            endDate,
            principal,
            mockRatesData
        );
        
        // Verify the result structure
        expect(result).toHaveProperty('details');
        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('principal');
        
        // Verify the details - should have 2 segments (Period 3, Period 4)
        expect(result.details.length).toBe(2);
        
        // Verify the rates for each segment
        expect(result.details[0].rate).toBe(4.0); // Period 3 postjudgment
        expect(result.details[1].rate).toBe(4.5); // Period 4 postjudgment
        
        // Verify the principal remains unchanged
        expect(result.principal).toBe(principal);
        
        // Verify no finalPeriodDamageInterestDetails for postjudgment
        expect(result.finalPeriodDamageInterestDetails).toBeUndefined();
    });
    
    // Test the simplified flow with special damages in postjudgment
    it('should not calculate separate interest for special damages in postjudgment', () => {
        const specialDamages = [
            { date: '2023-06-15', amount: 1000, description: 'Postjudgment Damage' }
        ];
        
        const mockState = {
            inputs: { jurisdiction: 'BC' },
            results: { specialDamages }
        };
        
        const principal = 20000;
        const startDate = createUTCDate(2023, 1, 1); // Jan 1, 2023
        const endDate = createUTCDate(2023, 12, 31); // Dec 31, 2023
        
        const result = calculateInterestPeriods(
            mockState,
            'postjudgment',
            startDate,
            endDate,
            principal,
            mockRatesData
        );
        
        // Verify the result structure
        expect(result).toHaveProperty('details');
        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('principal');
        
        // Verify the details - should have 2 segments (Period 3, Period 4)
        expect(result.details.length).toBe(2);
        
        // Verify the principal includes all damages
        expect(result.principal).toBe(principal + 1000);
        
        // Verify no finalPeriodDamageInterestDetails for postjudgment
        expect(result.finalPeriodDamageInterestDetails).toBeUndefined();
    });
});
